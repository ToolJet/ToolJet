#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (!process.env.TOOLJET_BANNED_TERMS && fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*TOOLJET_BANNED_TERMS\s*=\s*(.*)\s*$/);
    if (match) {
      process.env.TOOLJET_BANNED_TERMS = match[1].trim().replace(/^["']|["']$/g, '');
      break;
    }
  }
}

const RAW = process.env.TOOLJET_BANNED_TERMS || '';
const TERMS = RAW.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (TERMS.length === 0) {
  process.exit(0);
}

const files = process.argv.slice(2).filter((file) => fs.existsSync(file));

if (files.length === 0) {
  process.exit(0);
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BANNED_TERM_REGEX = new RegExp(`(${TERMS.map(escape).join('|')})`, 'gi');

const violations = [];

for (const file of files) {
  const normalizedPath = file.split(path.sep).join('/');

  const content = fs.readFileSync(file, 'utf8');
  const fileLines = content.split('\n');

  fileLines.forEach((line, index) => {
    const matches = line.match(BANNED_TERM_REGEX);
    if (matches) {
      const unique = [...new Set(matches.map((m) => m.toLowerCase()))];
      violations.push({
        file: normalizedPath,
        line: index + 1,
        terms: unique,
        text: line.trim(),
      });
    }
  });
}

if (violations.length === 0) {
  process.exit(0);
}

const report = violations.map((v) => `  ${v.file}:${v.line}  →  [${v.terms.join(', ')}]\n    ${v.text}`).join('\n');
console.error(`\nDisallowed term references are not permitted in frontend source.\n${report}\n`);

process.exit(1);
