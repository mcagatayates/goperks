const config = require('../config');
const { toTurkishCountryName } = require('./countries');

/**
 * Maps a parsed Etsy order into a POST /api/v1.0/invoices/integrationInvoices
 * request body, per the İşbaşı API reference (Fatura > Kaydetme-Güncelleme):
 *
 *   - invoiceId: 0 means "create new".
 *   - customer: sent inline. Per the docs, if no matching `code` is given,
 *     İşbaşı matches/creates the cari by firstName+lastName+taxOrPersonalId
 *     (bireysel) — since Etsy buyers have no Turkish tax/personal ID, a new
 *     cari will be created for every order. That may be what you want, or
 *     you may prefer one shared "Etsy Alıcıları" cari — confirm.
 *   - vatIncluded: false → matches the "Toptan Satış Faturası (KDV Hariç)"
 *     reference template.
 *   - salesInvoiceDetails: line items. The docs describe this array's
 *     *purpose* but not its exact field names — the shape below is a
 *     reasonable draft (productName/quantity/unit/price/vatRate/
 *     vatExemptionCode) and must be checked against a real response/error
 *     from the test environment before going live.
 *   - eGovernmentInvoice.eGovernmentType: the docs say this must be set for
 *     an "istisna" (exemption) invoice but don't give the enum value for
 *     "Hizmet İhracı" — left as a TODO placeholder rather than a guess.
 */
function mapOrderToInvoice(order, { usdToTryRate }, existingInvoiceId = 0) {
  const address = order.shippingAddress;
  const exchangeRate = config.invoiceDefaults.currency === 'TL' ? usdToTryRate : 1;

  const salesInvoiceDetails = order.items.map((item) => {
    const unitPrice = round2(item.unitPriceUsd * exchangeRate);
    const variationText = Object.entries(item.variations)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');

    return {
      productName: variationText ? `${item.title} | ${variationText}` : item.title,
      quantity: item.quantity,
      unit: 'Adet',
      price: unitPrice,
      vatRate: 0,
      // Per docs: "Muafiyetli satırlar için vatExemptionCode doldurulmalıdır.
      // Kodlar /api/v1.0/master/vatexcepts endpointinden alınır." — confirm
      // this is the correct field name/location once tested.
      vatExemptionCode: config.invoiceDefaults.kdvExemptionCode,
      description: `Etsy Transaction ID: ${item.transactionId}`,
    };
  });

  return {
    invoiceId: existingInvoiceId,
    customer: {
      isPersonalCompany: true,
      isForeign: true,
      firstName: address?.name?.split(' ').slice(0, -1).join(' ') || address?.name || order.buyerUsername || 'Etsy',
      lastName: address?.name?.split(' ').slice(-1).join(' ') || 'Alıcısı',
      fullName: address?.name || order.buyerUsername || 'Etsy Alıcısı',
      displayName: address?.name || order.buyerUsername || 'Etsy Alıcısı',
      address: address?.street || null,
      city: address?.city || null,
      state: address?.state || null,
      postalCode: address?.zip || null,
      country: toTurkishCountryName(address?.country),
      emailAddress: null,
    },
    invoiceDate: formatInvoiceDate(new Date()),
    currency: config.invoiceDefaults.currency,
    exchangeRate,
    description: `${config.invoiceDefaults.kdvExemptionDesc} — Etsy Order #${order.orderNumber}`,
    categoryName: config.invoiceDefaults.template,
    vatIncluded: false,
    // TODO — confirm the correct eGovernmentType code for a "Hizmet İhracı"
    // (302/11/1-a) export-exemption sales invoice before enabling this.
    // eGovernmentInvoice: { eGovernmentType: undefined },
    salesInvoiceDetails,
  };
}

function formatInvoiceDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { mapOrderToInvoice };
