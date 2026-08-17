const config = require('../config');
const { toTurkishCountryName } = require('./countries');

/**
 * Maps a parsed Etsy order into a Logo İşbaşı invoice payload.
 *
 * Field names/shape mirror the reference invoice screenshot the user
 * provided (Bireysel customer, TL currency, KDV muafiyet kodu 302/11/1-a
 * "Hizmet İhracı", "Toptan Satış Faturası (KDV Hariç)" template) rather
 * than a confirmed Logo API schema — the real request shape must be
 * checked against https://developers.isbasi.com/ and this function
 * adjusted to match before going live. Treat this as a first draft.
 */
function mapOrderToInvoice(order, { usdToTryRate }) {
  const address = order.shippingAddress;

  const lines = order.items.map((item) => {
    const unitPriceTry = round2(item.unitPriceUsd * usdToTryRate);
    const variationText = Object.entries(item.variations)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');

    return {
      productName: variationText ? `${item.title} | ${variationText}` : item.title,
      quantity: item.quantity,
      unit: 'Adet',
      unitPrice: unitPriceTry,
      vatRate: 0,
      total: round2(unitPriceTry * item.quantity),
      description: `Etsy Transaction ID: ${item.transactionId}`,
    };
  });

  return {
    invoiceType: 'Bireysel',
    customer: {
      name: address?.name || order.buyerUsername || 'Etsy Alıcısı',
      address: address?.street || null,
      city: address?.city || null,
      district: null,
      country: toTurkishCountryName(address?.country),
      taxOffice: null,
      taxNumber: null,
    },
    invoiceDate: new Date().toISOString(),
    currency: config.invoiceDefaults.currency,
    exemptionCode: config.invoiceDefaults.kdvExemptionCode,
    exemptionDescription: config.invoiceDefaults.kdvExemptionDesc,
    template: config.invoiceDefaults.template,
    externalReference: `Etsy Order #${order.orderNumber}`,
    description: config.invoiceDefaults.kdvExemptionDesc,
    lines,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { mapOrderToInvoice };
