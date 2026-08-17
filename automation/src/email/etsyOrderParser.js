/**
 * Parses Etsy "You made a sale!" order notification emails (sent from
 * transaction@etsy.com) into a structured order object.
 *
 * Built against a single real sample. Etsy's layout varies for: digital
 * orders (no shipping address), multi-item orders, non-US addresses and
 * gift-wrapped orders — validate against more real samples before relying
 * on this in production.
 */

function normalizeLines(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim());
}

function parseOrderNumber(lines) {
  const line = lines.find((l) => /Your order number is:/i.test(l));
  if (!line) return null;
  const match = line.match(/Your order number is:\s*(\d+)/i);
  return match ? match[1] : null;
}

function parsePaymentDate(text) {
  const match = text.match(/on ([A-Za-z]+ \d{1,2},\s*\d{4})/);
  return match ? match[1] : null;
}

function parseShippingAddress(lines) {
  const startIdx = lines.findIndex((l) => /^Shipping address$/i.test(l));
  if (startIdx === -1) return null; // digital order, no shipping address

  const block = [];
  for (let i = startIdx + 1; i < lines.length && block.length < 8; i += 1) {
    const line = lines[i];
    if (!line) {
      if (block.length > 0) break;
      continue;
    }
    if (/^Shipping internationally\?/i.test(line)) break;
    block.push(line);
  }

  if (block.length < 3) return null;

  const cityStateZipIdx = block.findIndex((l) =>
    /^[A-Za-zÇĞİÖŞÜçğıöşü.'\- ]+,\s*[A-Z]{2}\s+\d{4,6}(-\d{4})?$/.test(l)
  );

  if (cityStateZipIdx === -1) {
    // Fallback: assume [name, ...street lines, country] with no clean city/state/zip match
    return {
      name: block[0],
      street: block.slice(1, -1).join(', '),
      city: null,
      state: null,
      zip: null,
      country: block[block.length - 1],
    };
  }

  const name = block[0];
  const street = block.slice(1, cityStateZipIdx).join(', ');
  const cityStateZip = block[cityStateZipIdx];
  const country = block[cityStateZipIdx + 1] || null;

  const cszMatch = cityStateZip.match(/^(.+),\s*([A-Z]{2})\s+(\d{4,6}(?:-\d{4})?)$/);

  return {
    name,
    street,
    city: cszMatch ? cszMatch[1] : null,
    state: cszMatch ? cszMatch[2] : null,
    zip: cszMatch ? cszMatch[3] : null,
    country,
  };
}

function parseBuyerUsername(text) {
  const match = text.match(/\n\s*([a-zA-Z0-9_.-]{3,})\s*\n\s*Send them a Convo/);
  return match ? match[1] : null;
}

function parseItems(text) {
  const itemRegex =
    /([^\n]+(?:\n(?!Shop:)[^\n]+)*)\nShop:\s*([^\n]+)\nTransaction ID:\s*(\d+)\nQuantity:\s*(\d+)\nPrice:\s*\$([\d,]+\.\d{2})/g;

  const items = [];
  let match;
  while ((match = itemRegex.exec(text)) !== null) {
    const titleBlockLines = match[1]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const title = titleBlockLines[0];
    const variations = {};
    for (const line of titleBlockLines.slice(1)) {
      const varMatch = line.match(/^([^:]+):\s*(.+)$/);
      if (varMatch) {
        variations[varMatch[1].trim()] = varMatch[2].trim();
      }
    }

    items.push({
      title,
      variations,
      shop: match[2].trim(),
      transactionId: match[3],
      quantity: Number(match[4]),
      unitPriceUsd: Number(match[5].replace(/,/g, '')),
    });
  }

  return items;
}

function parseTotals(text) {
  const match = text.match(
    /Item total:\s*\n?\$([\d,]+\.\d{2})[\s\S]*?Shipping:\s*\n?\$([\d,]+\.\d{2})[\s\S]*?Sales tax:\s*\n?\$([\d,]+\.\d{2})[\s\S]*?Order total:\s*\n?\$([\d,]+\.\d{2})/
  );

  if (!match) return null;

  return {
    itemTotalUsd: Number(match[1].replace(/,/g, '')),
    shippingUsd: Number(match[2].replace(/,/g, '')),
    salesTaxUsd: Number(match[3].replace(/,/g, '')),
    orderTotalUsd: Number(match[4].replace(/,/g, '')),
  };
}

function parseEtsyOrderEmail(text) {
  const lines = normalizeLines(text).filter((l, i, arr) => !(l === '' && arr[i - 1] === ''));

  const orderNumber = parseOrderNumber(lines);
  if (!orderNumber) {
    return null; // not an order notification email (or format not recognized)
  }

  return {
    orderNumber,
    paymentDate: parsePaymentDate(text),
    buyerUsername: parseBuyerUsername(text),
    shippingAddress: parseShippingAddress(lines),
    items: parseItems(text),
    totals: parseTotals(text),
  };
}

module.exports = { parseEtsyOrderEmail };
