const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const config = require('../config');

async function fetchUnseenEtsyOrderEmails() {
  const client = new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: config.imap.secure,
    auth: {
      user: config.imap.user,
      pass: config.imap.password,
    },
    logger: false,
  });

  const messages = [];

  await client.connect();
  try {
    const lock = await client.getMailboxLock(config.imap.folder);
    try {
      const uids = await client.search({
        seen: false,
        from: config.imap.senderFilter,
      });

      for (const uid of uids) {
        const raw = await client.download(uid, undefined, { uid: true });
        const parsed = await simpleParser(raw.content);
        messages.push({ uid, parsed });
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    await client.logout().catch(() => {});
    throw err;
  }

  return { client, messages };
}

async function markHandled(client, uid) {
  await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });

  if (config.imap.processedFolder) {
    await client.messageMove(uid, config.imap.processedFolder, { uid: true });
  }
}

module.exports = { fetchUnseenEtsyOrderEmails, markHandled };
