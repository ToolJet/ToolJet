#!/usr/bin/env node
// Fails when a migration imports anything other than typeorm or a Node built-in.
//
// Usage: node scripts/check-migration-imports.mjs <migration files...>
//
// A migration runs against the schema of its time, but entities, helpers and services
// follow today's code. Importing them means a later change can silently change or break
// an old migration, so migrations stay self-contained: raw SQL via queryRunner.query().
// A genuinely needed import can stay if its line carries a reason:
//   import { getEnvVars } from '../scripts/database-config-utils'; // migration-import-allowed: needs TOOLJET_DB_USER

import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { pathToFileURL } from 'node:url';

const MARKER = /\/\/\s*migration-import-allowed:\s*\S/;
const PATTERNS = [
  /^\s*import\s[^;]*?\sfrom\s*['"]([^'"\n]+)['"]/gm, // import x from '…' (also multi-line, import type)
  /^\s*import\s*['"]([^'"\n]+)['"]/gm, // import '…'
  /^\s*export\s+(?:type\s+)?[*{][^;]*?\sfrom\s*['"]([^'"\n]+)['"]/gm, // export { … } / * from '…'
  /\brequire\(\s*['"]([^'"\n]+)['"]\s*\)/g, // require('…')
  /\bimport\(\s*['"]([^'"\n]+)['"]\s*\)/g, // import('…')
];

const isAllowed = (source) =>
  source === 'typeorm' || source.startsWith('typeorm/') || source.startsWith('node:') || builtinModules.includes(source);

// blank out comments but keep offsets and newlines, so line numbers still match
const stripComments = (code) =>
  code.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (c) => c.replace(/[^\n]/g, ' '));

// returns [{ line, source }] for every import that isn't allowed, in file order
export function disallowedImports(code) {
  const lines = code.split('\n');
  const stripped = stripComments(code);
  const found = new Map();
  for (const re of PATTERNS) {
    for (const m of stripped.matchAll(re)) {
      const source = m[1];
      const at = m.index + m[0].lastIndexOf(source);
      const line = stripped.slice(0, at).split('\n').length;
      if (isAllowed(source) || MARKER.test(lines[line - 1])) continue;
      found.set(`${line}:${source}`, { line, source });
    }
  }
  return [...found.values()].sort((a, b) => a.line - b.line);
}

function main(files) {
  let failed = false;
  for (const file of files) {
    for (const { line, source } of disallowedImports(readFileSync(file, 'utf8'))) {
      failed = true;
      console.log(`::error file=${file},line=${line}::Migration imports '${source}'. Migrations must be self-contained (typeorm and Node built-ins only); use queryRunner.query() with SQL, or add '// migration-import-allowed: <reason>' to the import line.`);
    }
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
