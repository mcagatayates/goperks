const axios = require('axios');
const config = require('../config');

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * NOTE: the response field name for the token below (`token` /
 * `accessToken` / `data.token`) is a guess based on common API
 * conventions — it has NOT been confirmed against the real
 * developers.isbasi.com docs. Log in once against the test environment
 * and adjust the extraction below to match the real response shape.
 */
async function login() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await axios.post(
    `${config.logo.baseUrl}/api/v1.0/user/integrationLogin`,
    {
      username: config.logo.username,
      password: config.logo.password,
    },
    {
      headers: {
        ApiKey: config.logo.apiKey,
        'Content-Type': 'application/json',
      },
    }
  );

  const token =
    response.data?.token || response.data?.accessToken || response.data?.data?.token;

  if (!token) {
    throw new Error(
      `Logo login succeeded but no token field was recognized. Response: ${JSON.stringify(
        response.data
      )}`
    );
  }

  cachedToken = token;
  // TODO: use the real expiry from the response if the API returns one.
  tokenExpiresAt = now + 50 * 60 * 1000;
  return cachedToken;
}

/**
 * TODO — NOT YET CONFIRMED: the endpoint path and payload shape here are
 * placeholders. They must be verified against the real API reference at
 * https://developers.isbasi.com/ (log in with your İşbaşı user) before
 * this is used against production data. Likely candidates to check for:
 *   - exact resource path (e.g. /api/v1.0/invoice/... or /salesInvoice/...)
 *   - whether the customer must be created/looked up via a separate
 *     endpoint before invoicing, or can be sent inline
 *   - required vs. optional fields, and their exact names/casing
 */
async function createInvoice(invoicePayload) {
  const token = await login();

  const response = await axios.post(`${config.logo.baseUrl}/api/v1.0/invoice/create`, invoicePayload, {
    headers: {
      ApiKey: config.logo.apiKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

module.exports = { login, createInvoice };
