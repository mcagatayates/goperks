require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  imap: {
    host: required('IMAP_HOST'),
    port: Number(process.env.IMAP_PORT || 993),
    secure: process.env.IMAP_SECURE !== 'false',
    user: required('IMAP_USER'),
    password: required('IMAP_PASSWORD'),
    folder: process.env.IMAP_FOLDER || 'INBOX',
    processedFolder: process.env.IMAP_PROCESSED_FOLDER || null,
    senderFilter: process.env.ETSY_SENDER_EMAIL || 'transaction@etsy.com',
  },
  logo: {
    baseUrl: required('LOGO_API_BASE_URL').replace(/\/+$/, ''),
    apiKey: required('LOGO_API_KEY'),
    username: required('LOGO_USERNAME'),
    password: required('LOGO_PASSWORD'),
  },
  invoiceDefaults: {
    kdvExemptionCode: process.env.LOGO_KDV_EXEMPTION_CODE || '302/11/1-a',
    kdvExemptionDesc: process.env.LOGO_KDV_EXEMPTION_DESC || 'Hizmet İhracı',
    currency: process.env.LOGO_INVOICE_CURRENCY || 'TL',
    template: process.env.LOGO_INVOICE_TEMPLATE || 'Toptan Satış Faturası (KDV Hariç)',
  },
  tcmb: {
    rateType: process.env.TCMB_RATE_TYPE || 'ForexSelling',
  },
  poll: {
    intervalMs: Number(process.env.POLL_INTERVAL_MS || 5 * 60 * 1000),
    runOnce: process.env.RUN_ONCE === 'true',
  },
};
