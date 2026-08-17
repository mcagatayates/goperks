const config = require('../config');
const { toTurkishCountryName } = require('./countries');

/**
 * Maps a parsed Etsy order into a POST /api/v1.0/invoices/integrationInvoices
 * request body, per the İşbaşı API reference (Fatura > Kaydetme-Güncelleme)
 * and the real "Müşteri & Tedarikçi Hesap Düzenle" screenshots shared for a
 * foreign individual customer:
 *
 *   - invoiceId: 0 means "create new".
 *   - customer: sent inline, no `code` — confirmed a new cari is created for
 *     every order (no shared "Etsy buyers" cari).
 *   - taxOrPersonalId / notApplyVat: the reference customer card uses a
 *     placeholder TCKN ("2222222222", see LOGO_FOREIGN_CUSTOMER_TCKN) and
 *     has "KDV Uygulanmaz" checked for foreign individual buyers.
 *   - address: sent as one free-text block (street, then "CITY, STATE ZIP",
 *     then country) — the reference card leaves the structured city/state/
 *     postalCode fields empty and only sets the `country` dropdown.
 *   - vatIncluded: false → matches the "Toptan Satış Faturası (KDV Hariç)"
 *     reference template.
 *   - salesInvoiceDetails: line items. The docs describe this array's
 *     *purpose* but not its exact field names — the shape below is a
 *     reasonable draft (productName/quantity/unit/price/vatRate/
 *     vatExemptionCode) and must be checked against a real response/error
 *     from the test environment before going live.
 *   - eArchivePortalInvoice: the reference card has "Fatura Türü: E-Arşiv"
 *     (not E-Arşiv İnternet) and "İrsaliye Yerine Geçer" checked, which
 *     matches the docs' "E-Arşiv Portal Faturası" case (isEArchive,
 *     dispatchIncluded, eGovernmentType). "GİB Fatura Tipi: Satış" is shown
 *     in the UI but the numeric eGovernmentType value for it isn't given in
 *     the docs — left as a TODO rather than a guess.
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

  const buyerName = address?.name || order.buyerUsername || 'Etsy Alıcısı';
  const [firstName, ...lastNameParts] = buyerName.split(' ');
  const lastName = lastNameParts.join(' ') || 'Alıcısı';

  return {
    invoiceId: existingInvoiceId,
    customer: {
      isPersonalCompany: true,
      isForeign: true,
      firstName,
      lastName,
      fullName: buyerName,
      displayName: buyerName,
      taxOrPersonalId: config.invoiceDefaults.foreignCustomerTcNo,
      notApplyVat: true,
      address: formatAddressBlock(address),
      country: toTurkishCountryName(address?.country),
      emailAddress: null,
    },
    invoiceDate: formatInvoiceDate(new Date()),
    currency: config.invoiceDefaults.currency,
    exchangeRate,
    description: `${config.invoiceDefaults.kdvExemptionDesc} — Etsy Order #${order.orderNumber}`,
    categoryName: config.invoiceDefaults.template,
    vatIncluded: false,
    eArchivePortalInvoice: {
      isEArchive: true,
      dispatchIncluded: true,
      // TODO — confirm the numeric/string value İşbaşı expects here for the
      // "GİB Fatura Tipi: Satış" option shown in the customer's e-Devlet tab.
      eGovernmentType: undefined,
    },
    salesInvoiceDetails,
  };
}

function formatAddressBlock(address) {
  if (!address) return null;
  const cityLine = [address.city, address.state].filter(Boolean).join(', ') + (address.zip ? ` ${address.zip}` : '');
  return [address.street, cityLine.trim() || null, address.country].filter(Boolean).join('\n');
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
