#!/usr/bin/env node
/**
 * Rewrites named imports of a barrel (e.g. `import { fooService } from '@/_services'`)
 * into direct imports of the file that actually exports each name
 * (`import { fooService } from '@/_services/foo.service'`).
 *
 * Usage:
 *   node scripts/codemods/barrel-to-direct-imports.js <barrelDir> <importAlias> [--write]
 *
 * Examples:
 *   node scripts/codemods/barrel-to-direct-imports.js src/_services @/_services
 *   node scripts/codemods/barrel-to-direct-imports.js src/_components @/_components --write
 *
 * Without --write it runs as a dry run and prints the planned rewrites.
 * Fails loudly on: duplicate export names across barrel targets, imported
 * names not found in the export map.
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const [, , barrelDirArg, importAlias, ...flags] = process.argv;
if (!barrelDirArg || !importAlias) {
  console.error('Usage: node barrel-to-direct-imports.js <barrelDir> <importAlias> [--write] [--allow-unknown]');
  process.exit(1);
}
const WRITE = flags.includes('--write');
// Leave names the barrel doesn't export on the original barrel import (with a
// warning) instead of failing the run. Use only for known-dead imports.
const ALLOW_UNKNOWN = flags.includes('--allow-unknown');
const ROOT = path.resolve(__dirname, '../..');
const barrelDir = path.resolve(ROOT, barrelDirArg);
const SCAN_DIRS = ['src', 'ee', 'cloud'].map((d) => path.join(ROOT, d)).filter((d) => fs.existsSync(d));
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

function parseFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  return {
    code,
    ast: parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy', 'topLevelAwait'],
    }),
  };
}

function resolveModuleFile(fromDir, request) {
  const base = path.resolve(fromDir, request);
  const candidates = [
    ...EXTENSIONS.map((e) => base + e),
    ...EXTENSIONS.map((e) => path.join(base, 'index' + e)),
    base, // already has extension
  ];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}

// Collect exported names of a module, following `export * from` one level deep.
function collectExports(file, depth = 0) {
  const names = new Map(); // name -> file that declares it
  const { ast } = parseFile(file);
  for (const node of ast.program.body) {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        const decl = node.declaration;
        if (decl.type === 'VariableDeclaration') {
          decl.declarations.forEach((d) => {
            if (d.id.type === 'Identifier') names.set(d.id.name, file);
            else if (d.id.type === 'ObjectPattern')
              d.id.properties.forEach((p) => p.value?.type === 'Identifier' && names.set(p.value.name, file));
          });
        } else if (decl.id) {
          names.set(decl.id.name, file);
        }
      }
      // Re-exports (`export { X } from './x'`) attribute the name to the source
      // file, not the barrel, so rewrites point at the real module.
      const reexportTarget = node.source ? resolveModuleFile(path.dirname(file), node.source.value) : null;
      node.specifiers?.forEach((s) => {
        if (s.exported?.type === 'Identifier' && s.exported.name !== 'default')
          names.set(s.exported.name, reexportTarget || file);
      });
    } else if (node.type === 'ExportAllDeclaration') {
      if (depth >= 2) {
        console.warn(`WARN: export * nesting too deep, skipping ${node.source.value} in ${file}`);
        continue;
      }
      const target = resolveModuleFile(path.dirname(file), node.source.value);
      if (!target) {
        console.warn(`WARN: cannot resolve export * source ${node.source.value} in ${file}`);
        continue;
      }
      for (const [n, f] of collectExports(target, depth + 1)) {
        if (names.has(n) && names.get(n) !== f) {
          console.error(`DUPLICATE export "${n}" from ${names.get(n)} and ${f}`);
          process.exitCode = 1;
        }
        names.set(n, f);
      }
    }
  }
  return names;
}

// name -> import specifier (alias path, no extension, directories collapse to dir path)
function toImportPath(file) {
  let rel = path.relative(barrelDir, file).replace(/\\/g, '/');
  rel = rel.replace(/\.(jsx?|tsx?)$/, '').replace(/\/index$/, '');
  return rel === '' || rel === 'index' ? importAlias : `${importAlias}/${rel}`;
}

const barrelIndex = resolveModuleFile(barrelDir, './index') || resolveModuleFile(path.dirname(barrelDir), './' + path.basename(barrelDir));
if (!barrelIndex) {
  console.error(`Cannot find barrel index in ${barrelDir}`);
  process.exit(1);
}
const exportMap = collectExports(barrelIndex);
if (process.exitCode === 1) process.exit(1);
console.error(`Export map: ${exportMap.size} names from ${new Set(exportMap.values()).size} files`);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXTENSIONS.includes(path.extname(entry.name))) yield full;
  }
}

let changedFiles = 0;
let failed = false;
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    if (file === barrelIndex) continue;
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes(`'${importAlias}'`) && !src.includes(`"${importAlias}"`)) continue;
    let ast;
    try {
      ast = parser.parse(src, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy', 'topLevelAwait'],
      });
    } catch (e) {
      console.error(`PARSE ERROR ${file}: ${e.message}`);
      failed = true;
      continue;
    }
    const edits = [];
    for (const node of ast.program.body) {
      if (node.type !== 'ImportDeclaration' || node.source.value !== importAlias) continue;
      if (node.specifiers.some((s) => s.type !== 'ImportSpecifier')) {
        console.error(`UNSUPPORTED import form (default/namespace) in ${file}`);
        failed = true;
        continue;
      }
      const groups = new Map(); // importPath -> ["name" | "name as alias"]
      for (const s of node.specifiers) {
        const imported = s.imported.name;
        const target = exportMap.get(imported);
        if (!target) {
          if (ALLOW_UNKNOWN) {
            console.warn(`WARN: unknown export "${imported}" left on barrel import in ${file}`);
            if (!groups.has(importAlias)) groups.set(importAlias, []);
            groups.get(importAlias).push(s.local.name === imported ? imported : `${imported} as ${s.local.name}`);
          } else {
            console.error(`UNKNOWN export "${imported}" imported in ${file}`);
            failed = true;
          }
          continue;
        }
        const p = toImportPath(target);
        const spec = s.local.name === imported ? imported : `${imported} as ${s.local.name}`;
        if (!groups.has(p)) groups.set(p, []);
        groups.get(p).push(spec);
      }
      const replacement = [...groups.entries()]
        .map(([p, specs]) => `import { ${specs.join(', ')} } from '${p}';`)
        .join('\n');
      edits.push({ start: node.start, end: node.end, replacement });
    }
    if (!edits.length) continue;
    let out = src;
    for (const e of edits.sort((a, b) => b.start - a.start)) {
      out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
    }
    changedFiles++;
    if (WRITE) fs.writeFileSync(file, out);
    else console.log(`WOULD REWRITE ${path.relative(ROOT, file)}`);
  }
}
console.error(`${WRITE ? 'Rewrote' : 'Would rewrite'} ${changedFiles} files`);
if (failed) {
  console.error('FAILED: unresolved names or unsupported forms — nothing should be merged until fixed.');
  process.exit(1);
}
