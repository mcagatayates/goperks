const axios = require('axios');
const config = require('../config');

let cachedToken = null;
let cachedTenantId = null;
let tokenExpiresAt = 0;

/**
 * Every documented İşbaşı endpoint wraps its response as
 * { code, message, isError, data }, and every authenticated endpoint
 * requires both `tenantId` and `Authorization: Bearer {accessToken}`
 * headers, sourced from the login response. The exact field names inside
 * `data` for integrationLogin specifically (accessToken vs token,
 * tenantId vs TenantId, ...) were not shown verbatim in the docs we have
 * — this tries the conventional names with fallbacks and fails loudly if
 * none match, so a single real login call will immediately tell us which
 * one to keep.
 */
async function login() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return { token: cachedToken, tenantId: cachedTenantId };
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

  const data = response.data?.data || response.data;
  const token = data?.accessToken || data?.token || data?.AccessToken;
  const tenantId = data?.tenantId || data?.TenantId;

  if (!token || !tenantId) {
    throw new Error(
      `Logo login succeeded but accessToken/tenantId were not recognized in the response. Response: ${JSON.stringify(
        response.data
      )}`
    );
  }

  cachedToken = token;
  cachedTenantId = tenantId;
  // TODO: use the real expiry from the response if the API returns one
  // (docs mention accessToken validity of ~1 day elsewhere in the API).
  tokenExpiresAt = now + 50 * 60 * 1000;
  return { token: cachedToken, tenantId: cachedTenantId };
}

function authHeaders(token, tenantId) {
  return {
    ApiKey: config.logo.apiKey,
    Authorization: `Bearer ${token}`,
    tenantId,
    'Content-Type': 'application/json; charset=utf-8',
    Lang: 'tr-TR',
  };
}

/**
 * POST /api/v1.0/invoices/integrationInvoices — confirmed endpoint from
 * the İşbaşı API reference (Fatura > Kaydetme-Güncelleme). invoiceId: 0
 * creates a new invoice; a non-zero id updates an existing one.
 *
 * Still unconfirmed (not fully detailed in the reference we have and not
 * live-tested — this sandbox's network policy blocks the test API):
 *   - the exact field names inside each `salesInvoiceDetails` line item
 *   - the `eGovernmentInvoice.eGovernmentType` enum value for an export /
 *     KDV-exemption ("Hizmet İhracı") sales invoice
 * See invoiceMapper.js for where these are built.
 */
async function createInvoice(invoicePayload) {
  const { token, tenantId } = await login();

  const response = await axios.post(
    `${config.logo.baseUrl}/api/v1.0/invoices/integrationInvoices`,
    invoicePayload,
    { headers: authHeaders(token, tenantId) }
  );

  return response.data;
}

module.exports = { login, createInvoice };
