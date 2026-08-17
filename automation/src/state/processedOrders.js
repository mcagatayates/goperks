const fs = require('fs');
const path = require('path');
const config = require('../config');

let cache = null;

function load() {
  if (cache) return cache;

  try {
    const raw = fs.readFileSync(config.state.processedOrdersFile, 'utf8');
    cache = new Set(JSON.parse(raw));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    cache = new Set();
  }

  return cache;
}

function isProcessed(orderNumber) {
  return load().has(orderNumber);
}

function markProcessed(orderNumber) {
  load().add(orderNumber);

  const file = config.state.processedOrdersFile;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify([...cache], null, 2));
}

module.exports = { isProcessed, markProcessed };
