const config = require('./config');
const { fetchUnseenEtsyOrderEmails, markHandled } = require('./email/imapClient');
const { parseEtsyOrderEmail } = require('./email/etsyOrderParser');
const { getUsdToTryRate } = require('./logo/exchangeRate');
const { mapOrderToInvoice } = require('./logo/invoiceMapper');
const { createInvoice } = require('./logo/logoClient');

async function processOnce() {
  console.log(`[${new Date().toISOString()}] Checking mailbox for new Etsy orders...`);

  const { client, messages } = await fetchUnseenEtsyOrderEmails();

  if (messages.length === 0) {
    console.log('No new order emails.');
    await client.logout();
    return;
  }

  let usdToTryRate = null;
  if (config.invoiceDefaults.currency === 'TL') {
    usdToTryRate = await getUsdToTryRate();
    console.log(`USD/TRY rate (${config.tcmb.rateType}): ${usdToTryRate}`);
  }

  for (const { uid, parsed } of messages) {
    try {
      const order = parseEtsyOrderEmail(parsed.text || '');

      if (!order) {
        console.warn(`UID ${uid}: not recognized as an Etsy order email, skipping (left unread).`);
        continue;
      }

      console.log(`UID ${uid}: parsed order #${order.orderNumber} (${order.items.length} item(s)).`);

      const invoicePayload = mapOrderToInvoice(order, { usdToTryRate });
      const result = await createInvoice(invoicePayload);

      console.log(`UID ${uid}: invoice created for order #${order.orderNumber}.`, result);

      await markHandled(client, uid);
    } catch (err) {
      console.error(`UID ${uid}: failed to process, leaving unread for retry.`, err.message);
    }
  }

  await client.logout();
}

async function main() {
  if (config.poll.runOnce) {
    await processOnce();
    return;
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await processOnce();
    } catch (err) {
      console.error('Polling cycle failed:', err.message);
    }
    await new Promise((resolve) => setTimeout(resolve, config.poll.intervalMs));
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
