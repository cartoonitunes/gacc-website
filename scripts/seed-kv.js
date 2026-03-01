#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
  console.error('Set KV_REST_API_URL and KV_REST_API_TOKEN env vars');
  process.exit(1);
}

async function kvSet(key, value) {
  const res = await fetch(`${KV_REST_API_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}`, {
    headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
  });
  if (!res.ok) throw new Error(`KV SET failed for ${key}: ${res.status}`);
}

function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = content.split('\n').slice(1); // skip header
  return lines.map(line => {
    const [token, address] = line.split(',');
    return { token: token.trim(), address: address.trim() };
  });
}

async function seed(csvFile, keyPrefix) {
  if (!fs.existsSync(csvFile)) {
    console.log(`Skipping ${csvFile} (not found)`);
    return;
  }

  const rows = parseCsv(csvFile);
  console.log(`Seeding ${rows.length} ${keyPrefix} entries...`);

  let count = 0;
  for (const row of rows) {
    await kvSet(`${keyPrefix}:${row.token}`, true);
    if (row.address) {
      await kvSet(`${keyPrefix}:${row.token}:address`, row.address);
    }
    count++;
    if (count % 50 === 0) console.log(`  ${count}/${rows.length}`);
  }
  console.log(`Done: ${count} ${keyPrefix} entries seeded`);
}

async function main() {
  const scriptsDir = __dirname;
  const tokensFile = path.join(scriptsDir, '..', 'claimed-tokens.csv');
  const kittensFile = path.join(scriptsDir, '..', 'claimed-kittens.csv');

  await seed(tokensFile, 'tokens');
  await seed(kittensFile, 'kittens');
  console.log('All done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
