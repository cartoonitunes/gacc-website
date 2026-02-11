/**
 * Extract static data from legacy migration files and server data
 * into clean JSON files for the Next.js app.
 *
 * Run: node scripts/extract-data.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LEGACY = join(ROOT, '_legacy');

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

// ============================================================
// 1. Extract metadata from migration files
// ============================================================

function extractMetadataFromMigration(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  // The migration files define: var metadata = [{token: "0", metadata: {...}, createdAt: new Date(), updatedAt: new Date()}, ...]
  // We need to extract the array and convert to a keyed object.
  // Strategy: Use a sandboxed eval approach - replace `new Date()` with a string, then eval the var assignment.

  const cleaned = content
    .replace(/new Date\(\)/g, '"2024-01-01"')
    .replace(/createdAt:\s*"[^"]*"/g, '')
    .replace(/updatedAt:\s*"[^"]*"/g, '')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*}/g, '}');

  // Find the var metadata = [...] part — array ends before module.exports
  // Try with semicolon first, then without (greedy up to module.exports)
  let match = cleaned.match(/var\s+metadata\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) {
    match = cleaned.match(/var\s+metadata\s*=\s*(\[[\s\S]*\])\s*;?\s*module\.exports/);
  }
  if (!match) {
    throw new Error(`Could not find metadata array in ${filePath}`);
  }

  const fn = new Function(`return ${match[1]}`);
  return fn();
}

function metadataArrayToObject(arr) {
  const result = {};
  for (const item of arr) {
    result[item.token] = item.metadata;
  }
  return result;
}

// ============================================================
// 2. Extract rank data from JS files
// ============================================================

function extractRanksFromJS(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  // Files have: var gacc_ranks = {'0': '1', '1': '2', ...}; module.exports = gacc_ranks;
  const match = content.match(/var\s+\w+\s*=\s*(\{[\s\S]*?\})\s*;?\s*module\.exports/);
  if (!match) {
    throw new Error(`Could not find ranks object in ${filePath}`);
  }
  const fn = new Function(`return ${match[1]}`);
  return fn();
}

// ============================================================
// 3. Extract whitelist addresses from merkle.js
// ============================================================

function extractWhitelists(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  const lists = {};

  // Extract each address array
  const patterns = [
    { name: 'wl', regex: /let\s+wl\s*=\s*(\[[\s\S]*?\])\s*;?\s*(?:\/\/|let|const|var)/ },
    { name: 'wl-multi', regex: /let\s+wlMulti\s*=\s*(\[[\s\S]*?\])\s*;?\s*(?:\/\/|let|const|var)/ },
    { name: 'wl-free', regex: /let\s+wlFree\s*=\s*(\[[\s\S]*?\])\s*;?\s*(?:\/\/|let|const|var)/ },
    { name: 'wl-free-multi', regex: /let\s+wlFreeMulti\s*=\s*(\[[\s\S]*?\])\s*;?\s*(?:\/\/|let|const|var)/ },
  ];

  for (const { name, regex } of patterns) {
    const match = content.match(regex);
    if (match) {
      const fn = new Function(`return ${match[1]}`);
      lists[name] = fn();
      console.log(`  ${name}: ${lists[name].length} addresses`);
    } else {
      console.warn(`  WARNING: Could not find ${name} in merkle.js`);
    }
  }

  return lists;
}

// ============================================================
// Main
// ============================================================

async function main() {
  const dataDir = join(ROOT, 'data');

  // --- Metadata ---
  console.log('Extracting metadata...');
  ensureDir(join(dataDir, 'metadata'));

  const metadataFiles = [
    {
      source: join(LEGACY, 'migrations/20220619190337-populate-revealed-metadata.js'),
      output: join(dataDir, 'metadata/revealed-macc.json'),
      label: 'Revealed MACC metadata',
    },
    {
      source: join(LEGACY, 'migrations/20220619190345-populate-hidden-metadata.js'),
      output: join(dataDir, 'metadata/hidden-macc.json'),
      label: 'Hidden MACC metadata',
    },
    {
      source: join(LEGACY, 'migrations/20230625005053-populate-revealed-kitten-metadata.js'),
      output: join(dataDir, 'metadata/revealed-kittens.json'),
      label: 'Revealed kitten metadata',
    },
    {
      source: join(LEGACY, 'migrations/20230625002636-populate-hidden-kitten-metadata.js'),
      output: join(dataDir, 'metadata/hidden-kittens.json'),
      label: 'Hidden kitten metadata',
    },
  ];

  for (const { source, output, label } of metadataFiles) {
    try {
      console.log(`  Extracting ${label}...`);
      const arr = extractMetadataFromMigration(source);
      const obj = metadataArrayToObject(arr);
      const count = Object.keys(obj).length;
      writeFileSync(output, JSON.stringify(obj));
      console.log(`  ✓ ${label}: ${count} entries -> ${output}`);
    } catch (err) {
      console.error(`  ✗ ${label}: ${err.message}`);
    }
  }

  // --- Apply metadata updates from subsequent migrations ---
  console.log('\nApplying metadata updates...');
  const updateMigrations = [
    'migrations/20220620110139-update-1160.js',
    'migrations/20220623233053-update-46.js',
    'migrations/20220625022349-update-41.js',
    'migrations/20220711004207-remove-none.js',
    'migrations/20220714174729-update-43.js',
    'migrations/20220826233940-mega-reveal.js',
    'migrations/20220827012544-mega-reveal-2.js',
    'migrations/20221005172912-mega-serum-images.js',
    'migrations/20230106171825-new-laser-images.js',
    'migrations/20230106173334-new-laser-images-again.js',
  ];

  // Load the revealed metadata we just extracted
  const revealedPath = join(dataDir, 'metadata/revealed-macc.json');
  let revealed;
  try {
    revealed = JSON.parse(readFileSync(revealedPath, 'utf-8'));
  } catch {
    console.log('  Skipping updates (no base revealed metadata)');
    revealed = null;
  }

  if (revealed) {
    for (const migFile of updateMigrations) {
      const migPath = join(LEGACY, migFile);
      try {
        const content = readFileSync(migPath, 'utf-8');
        // Look for UPDATE patterns - these vary per migration
        // Most use queryInterface.bulkUpdate or direct SQL
        // For now just log - the production DB export will be the source of truth
        console.log(`  Noted: ${migFile} (will apply from DB export)`);
      } catch {
        console.log(`  Skipped: ${migFile} (not found)`);
      }
    }
    console.log('  Note: Full metadata accuracy requires DB export. Migration-extracted data is the baseline.');
  }

  // --- Ranks ---
  console.log('\nExtracting ranks...');
  ensureDir(join(dataDir, 'ranks'));

  const rankFiles = [
    { source: join(LEGACY, 'server/ranks/gacc.js'), output: join(dataDir, 'ranks/gacc.json'), label: 'GACC ranks' },
    { source: join(LEGACY, 'server/ranks/macc.js'), output: join(dataDir, 'ranks/macc.json'), label: 'MACC ranks' },
    { source: join(LEGACY, 'server/ranks/gakc.js'), output: join(dataDir, 'ranks/gakc.json'), label: 'GAKC ranks' },
  ];

  for (const { source, output, label } of rankFiles) {
    try {
      const ranks = extractRanksFromJS(source);
      const count = Object.keys(ranks).length;
      writeFileSync(output, JSON.stringify(ranks));
      console.log(`  ✓ ${label}: ${count} entries -> ${output}`);
    } catch (err) {
      console.error(`  ✗ ${label}: ${err.message}`);
    }
  }

  // --- Whitelist ---
  console.log('\nExtracting whitelists...');
  ensureDir(join(dataDir, 'whitelist'));

  try {
    const whitelists = extractWhitelists(join(LEGACY, 'server/merkle.js'));
    for (const [name, addresses] of Object.entries(whitelists)) {
      const output = join(dataDir, `whitelist/${name}.json`);
      writeFileSync(output, JSON.stringify(addresses));
      console.log(`  ✓ ${name}: ${addresses.length} addresses -> ${output}`);
    }
  } catch (err) {
    console.error(`  ✗ Whitelists: ${err.message}`);
  }

  // --- NFT Stories ---
  console.log('\nCopying NFT stories...');
  try {
    const stories = readFileSync(join(LEGACY, 'server/data/nft-stories.json'), 'utf-8');
    writeFileSync(join(dataDir, 'nft-stories.json'), stories);
    console.log(`  ✓ NFT stories copied`);
  } catch (err) {
    console.error(`  ✗ NFT stories: ${err.message}`);
  }

  // --- ABIs ---
  console.log('\nCopying ABIs...');
  ensureDir(join(dataDir, 'abi'));

  const abiFiles = [
    { source: 'server/abi/mutantAbi.json', output: 'abi/mutant.json' },
    { source: 'server/abi/kittenAbi.json', output: 'abi/kitten.json' },
  ];

  // Also check client ABIs
  const clientAbiFiles = [
    { source: 'client/src/contracts/kittenABI.json', output: 'abi/kitten-client.json' },
    { source: 'client/src/contracts/lunagemABI.json', output: 'abi/lunagem.json' },
    { source: 'client/src/contracts/mutantABI.json', output: 'abi/mutant-client.json' },
  ];

  for (const { source, output } of [...abiFiles, ...clientAbiFiles]) {
    try {
      const abi = readFileSync(join(LEGACY, source), 'utf-8');
      writeFileSync(join(dataDir, output), abi);
      console.log(`  ✓ ${source} -> data/${output}`);
    } catch (err) {
      console.log(`  Skipped: ${source} (${err.message})`);
    }
  }

  console.log('\n✓ Data extraction complete!');
}

main().catch(console.error);
