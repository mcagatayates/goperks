const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const config = require('../config');

const TCMB_TODAY_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';

/**
 * Fetches today's TCMB (Turkish Central Bank) USD/TRY rate.
 * Rate type is configurable via TCMB_RATE_TYPE (see .env.example) —
 * confirm with your accountant which rate your invoices should use
 * (döviz alış vs. satış), this only picks a technical default.
 */
async function getUsdToTryRate() {
  const response = await axios.get(TCMB_TODAY_URL, { responseType: 'text' });
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const data = parser.parse(response.data);

  const currencies = data?.Tarih_Date?.Currency;
  const list = Array.isArray(currencies) ? currencies : [currencies];
  const usd = list.find((c) => c['@_Kod'] === 'USD' || c['@_CurrencyCode'] === 'USD');

  if (!usd) {
    throw new Error('TCMB today.xml did not contain a USD entry');
  }

  const rateStr = usd[config.tcmb.rateType];
  const rate = Number(String(rateStr).replace(',', '.'));

  if (!rate) {
    throw new Error(`Could not read TCMB rate type "${config.tcmb.rateType}" from response`);
  }

  return rate;
}

module.exports = { getUsdToTryRate };
