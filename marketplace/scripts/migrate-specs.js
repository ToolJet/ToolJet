#!/usr/bin/env node
/**
 * Migrates all marketplace plugins from external specUrl references
 * to local @spec/<kind>/<name> convention.
 *
 * For each plugin with react-component-api-endpoint:
 * 1. Reads operations.json to extract external URLs
 * 2. Downloads each spec file to openapi-specs/
 * 3. Updates operations.json with @spec/ references
 *
 * Usage: node migrate-specs.js [--dry-run] [--plugin <kind>]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const pluginFilter = args.includes('--plugin') ? args[args.indexOf('--plugin') + 1] : null;

const pluginsDir = resolve(import.meta.dirname, '..', 'plugins');

// Find all plugins with react-component-api-endpoint
const plugins = readdirSync(pluginsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .filter((d) => {
    if (pluginFilter && d.name !== pluginFilter) return false;
    const opsPath = join(pluginsDir, d.name, 'lib', 'operations.json');
    if (!existsSync(opsPath)) return false;
    const ops = readFileSync(opsPath, 'utf8');
    return ops.includes('react-component-api-endpoint') && !ops.includes('@spec/');
  })
  .map((d) => d.name);

console.log(`Found ${plugins.length} plugins to migrate${pluginFilter ? ` (filtered: ${pluginFilter})` : ''}:`);
plugins.forEach((p) => console.log(`  - ${p}`));

async function migratePlugin(kind) {
  const opsPath = join(pluginsDir, kind, 'lib', 'operations.json');
  const specsDir = join(pluginsDir, kind, 'openapi-specs');
  const ops = JSON.parse(readFileSync(opsPath, 'utf8'));

  // Find specUrl in the operations properties
  let specUrlObj = null;
  let specUrlKey = null;

  function findSpecUrl(obj, path = '') {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, value] of Object.entries(obj)) {
      if ((key === 'specUrl' || key === 'spec_url') && value) {
        specUrlObj = value;
        specUrlKey = key;
        return;
      }
      if (typeof value === 'object') findSpecUrl(value, `${path}.${key}`);
    }
  }
  findSpecUrl(ops);

  if (!specUrlObj) {
    console.log(`  [${kind}] No specUrl found — skipping`);
    return { kind, status: 'skipped', reason: 'no specUrl' };
  }

  // Collect all URLs to download
  const downloads = []; // { name, url }

  if (typeof specUrlObj === 'string') {
    // Single spec
    const name = kind; // Use plugin kind as the spec name for single-spec plugins
    downloads.push({ name, url: specUrlObj });
  } else if (typeof specUrlObj === 'object') {
    // Multi-spec
    for (const [label, url] of Object.entries(specUrlObj)) {
      const name = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      downloads.push({ name, url });
    }
  }

  console.log(`  [${kind}] ${downloads.length} spec(s) to download`);

  if (dryRun) {
    downloads.forEach((d) => console.log(`    ${d.name}: ${d.url}`));
    return { kind, status: 'dry-run', specs: downloads.length };
  }

  // Create openapi-specs directory
  mkdirSync(specsDir, { recursive: true });

  // Download specs
  const results = [];
  for (const { name, url } of downloads) {
    try {
      console.log(`    Downloading ${name}...`);
      const resp = await fetch(url);
      if (!resp.ok) {
        console.log(`    ❌ ${name}: HTTP ${resp.status}`);
        results.push({ name, status: 'failed', error: `HTTP ${resp.status}` });
        continue;
      }
      const content = await resp.text();
      const ext = url.endsWith('.json') || content.trimStart().startsWith('{') ? 'json' : 'yaml';
      const filePath = join(specsDir, `${name}.${ext}`);
      writeFileSync(filePath, content);
      console.log(`    ✅ ${name}.${ext} (${(content.length / 1024).toFixed(1)}KB)`);
      results.push({ name, ext, status: 'ok' });
    } catch (err) {
      console.log(`    ❌ ${name}: ${err.message}`);
      results.push({ name, status: 'failed', error: err.message });
    }
  }

  // Update operations.json with @spec/ references
  const failedNames = new Set(results.filter((r) => r.status === 'failed').map((r) => r.name));

  function replaceSpecUrls(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'specUrl' || key === 'spec_url') {
        if (typeof value === 'string' && !failedNames.has(kind)) {
          obj[key] = `@spec/${kind}/${kind}`;
        } else if (typeof value === 'object') {
          const newVal = {};
          for (const [label, url] of Object.entries(value)) {
            const name = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            if (failedNames.has(name)) {
              newVal[label] = url; // Keep original URL for failed downloads
            } else {
              newVal[label] = `@spec/${kind}/${name}`;
            }
          }
          obj[key] = newVal;
        }
      } else if (typeof value === 'object') {
        replaceSpecUrls(value);
      }
    }
    return obj;
  }

  replaceSpecUrls(ops);
  writeFileSync(opsPath, JSON.stringify(ops, null, 2) + '\n');

  const okCount = results.filter((r) => r.status === 'ok').length;
  const failCount = results.filter((r) => r.status === 'failed').length;
  console.log(`  [${kind}] Done: ${okCount} ok, ${failCount} failed`);
  return { kind, status: 'done', ok: okCount, failed: failCount };
}

// Run all migrations
console.log('\n--- Starting migration ---\n');
const summaries = [];
for (const kind of plugins) {
  const result = await migratePlugin(kind);
  summaries.push(result);
  console.log('');
}

console.log('\n--- Summary ---');
console.log('Plugin'.padEnd(20) + 'Status'.padEnd(12) + 'Details');
console.log('-'.repeat(50));
for (const s of summaries) {
  const details = s.ok !== undefined ? `${s.ok} ok, ${s.failed || 0} failed` : s.reason || '';
  console.log(s.kind.padEnd(20) + s.status.padEnd(12) + details);
}
