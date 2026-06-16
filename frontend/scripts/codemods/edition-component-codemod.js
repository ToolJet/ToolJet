#!/usr/bin/env node
/**
 * Replaces runtime edition selection via withEditionSpecificComponent(X, 'Module')
 * with build-time selection:
 *
 *   import EEX from '@ee/modules/<Module>/components/<Dir>';
 *   export default process.env.TOOLJET_EDITION === 'ce' ? X : EEX;
 *
 * - The EE path is resolved through the EE module barrels (export names can
 *   differ from directory names), never guessed.
 * - Wrapped components with no EE counterpart (the HOC's console.warn fallback
 *   today) simply lose the HOC.
 * - Verifies the resolved EE file has a default export; reports otherwise.
 *
 * Usage: node scripts/codemods/edition-component-codemod.js [--write] [--only <substr>]
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const WRITE = process.argv.includes('--write');
const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;
const ROOT = path.resolve(__dirname, '../..');
const EXT = ['.js', '.jsx', '.ts', '.tsx'];

// ESM-cycle cases (EE wraps the CE base) — migrated by hand, see plan.
const SKIP = [
  'src/AppBuilder/QueryManager/Components/QueryManagerBody.jsx',
  'src/AppBuilder/LeftSidebar/LeftSidebar.jsx',
  'src/modules/WorkspaceSettings/WorkspaceSettingsPage.jsx',
];

const parse = (code) =>
  parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy', 'topLevelAwait'],
  });

const resolveFile = (fromDir, request) => {
  const base = path.resolve(fromDir, request);
  return [...EXT.map((e) => base + e), ...EXT.map((e) => path.join(base, 'index' + e)), base].find(
    (c) => fs.existsSync(c) && fs.statSync(c).isFile()
  );
};

const hasDefaultExport = (file) => {
  const ast = parse(fs.readFileSync(file, 'utf8'));
  return ast.program.body.some(
    (n) =>
      n.type === 'ExportDefaultDeclaration' ||
      (n.type === 'ExportNamedDeclaration' && n.specifiers?.some((s) => s.exported?.name === 'default'))
  );
};

// Build {exportName -> {importPath, file, kind, importedName}} for an EE module
// from its barrels. kind is 'default' or 'named' — how the binding must be
// imported from the target file.
//
// Handled barrel shapes:
//   export * as NAME from './x'            -> default import of ./x (HOC did .default ?? ns)
//   export { NAME } from './x'             -> named import { NAME } from ./x
//   export { default as NAME } from './x'  -> default import of ./x
//   import NAME from './x';  export { NAME }        -> default import of ./x
//   import { NAME } from './x'; export { NAME }     -> named import
const eeMapCache = {};
function eeModuleMap(moduleName) {
  if (eeMapCache[moduleName]) return eeMapCache[moduleName];
  const map = {};
  const toAlias = (target) => {
    let imp = path.relative(ROOT, target).replace(/\\/g, '/');
    imp = imp.replace(/\.(jsx?|tsx?)$/, '').replace(/\/index$/, '');
    return '@' + imp; // ee/... -> @ee/...
  };
  for (const rel of [`ee/modules/${moduleName}/components/index.js`, `ee/modules/${moduleName}/index.js`]) {
    const barrel = path.join(ROOT, rel);
    if (!fs.existsSync(barrel)) continue;
    const ast = parse(fs.readFileSync(barrel, 'utf8'));
    // local binding name -> {file, kind, importedName} from the barrel's own imports
    const localImports = {};
    for (const node of ast.program.body) {
      if (node.type !== 'ImportDeclaration') continue;
      const target = resolveFile(path.dirname(barrel), node.source.value);
      if (!target) continue;
      for (const s of node.specifiers) {
        if (s.type === 'ImportDefaultSpecifier') localImports[s.local.name] = { file: target, kind: 'default' };
        else if (s.type === 'ImportSpecifier')
          localImports[s.local.name] = { file: target, kind: 'named', importedName: s.imported.name };
      }
    }
    for (const node of ast.program.body) {
      if (node.type !== 'ExportNamedDeclaration') continue;
      for (const s of node.specifiers || []) {
        if (s.type === 'ExportNamespaceSpecifier') continue; // handled below — needs default import
        const name = s.exported?.name;
        if (!name || map[name]) continue;
        if (node.source) {
          const target = resolveFile(path.dirname(barrel), node.source.value);
          if (!target) continue;
          const isDefault = s.local?.name === 'default';
          map[name] = {
            importPath: toAlias(target),
            file: target,
            kind: isDefault ? 'default' : 'named',
            importedName: isDefault ? null : s.local?.name || name,
          };
        } else if (localImports[s.local?.name]) {
          const li = localImports[s.local.name];
          map[name] = { importPath: toAlias(li.file), file: li.file, kind: li.kind, importedName: li.importedName };
        }
      }
      // export * as NAME from './x'
      if (node.source && node.specifiers?.length === 0 && node.exportKind !== 'type') continue;
    }
    for (const node of ast.program.body) {
      if (node.type === 'ExportNamedDeclaration' && node.source) {
        for (const s of node.specifiers || []) {
          if (s.type === 'ExportNamespaceSpecifier' && s.exported?.name && !map[s.exported.name]) {
            const target = resolveFile(path.dirname(barrel), node.source.value);
            if (!target) continue;
            map[s.exported.name] = { importPath: toAlias(target), file: target, kind: 'default', importedName: null };
          }
        }
      }
    }
  }
  eeMapCache[moduleName] = map;
  return map;
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (EXT.includes(path.extname(e.name))) yield full;
  }
}

const report = { migrated: [], hocDropped: [], skipped: [], manual: [] };

for (const file of walk(path.join(ROOT, 'src'))) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (ONLY && !rel.includes(ONLY)) continue;
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('withEditionSpecificComponent(')) continue;
  if (SKIP.includes(rel)) {
    report.skipped.push(rel);
    continue;
  }
  const ast = parse(src);
  const edits = [];
  const newImports = [];
  let hocImportNode = null;
  let callCount = 0;
  let manualReason = null;

  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (node.type === 'ImportDeclaration' && /withEditionSpecificComponent/.test(src.slice(node.start, node.end))) {
      hocImportNode = node;
    }
    if (node.type === 'CallExpression' && node.callee?.name === 'withEditionSpecificComponent') {
      callCount++;
      const [comp, mod] = node.arguments;
      if (comp?.type !== 'Identifier' || mod?.type !== 'StringLiteral') {
        manualReason = `non-trivial args at ${rel}:${node.loc.start.line}`;
        return;
      }
      const map = eeModuleMap(mod.value);
      const entry = map[comp.name];
      if (entry) {
        if (entry.kind === 'default' && !hasDefaultExport(entry.file)) {
          manualReason = `EE target has no default export: ${entry.importPath} (for ${comp.name})`;
          return;
        }
        const eeName = `EE${comp.name}`;
        newImports.push(
          entry.kind === 'default'
            ? `import ${eeName} from '${entry.importPath}';`
            : `import { ${entry.importedName} as ${eeName} } from '${entry.importPath}';`
        );
        edits.push({
          start: node.start,
          end: node.end,
          replacement: `process.env.TOOLJET_EDITION === 'ce' ? ${comp.name} : ${eeName}`,
        });
        report.migrated.push(`${rel} — ${comp.name} → ${entry.importPath}`);
      } else {
        edits.push({ start: node.start, end: node.end, replacement: comp.name });
        report.hocDropped.push(`${rel} — ${comp.name} ('${mod.value}' has no EE export of that name)`);
      }
    }
    for (const k of Object.keys(node)) {
      if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments') continue;
      const v = node[k];
      if (v && typeof v === 'object') visit(v);
    }
  };
  visit(ast.program);

  if (manualReason) {
    report.manual.push(manualReason);
    continue;
  }
  if (!edits.length) continue;

  // Remove the HOC import if every call in this file was rewritten.
  const hocUsesLeft = callCount - edits.length === 0;
  if (hocImportNode && hocUsesLeft) {
    // Only remove if the import binds nothing else.
    const otherSpecifiers = hocImportNode.specifiers.filter((s) => s.local.name !== 'withEditionSpecificComponent');
    if (otherSpecifiers.length === 0) {
      let end = hocImportNode.end;
      if (src[end] === '\n') end++;
      edits.push({ start: hocImportNode.start, end, replacement: '' });
    }
  }

  let out = src;
  for (const e of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
  }
  if (newImports.length) {
    // Insert after the last existing import.
    const outAst = parse(out);
    const imports = outAst.program.body.filter((n) => n.type === 'ImportDeclaration');
    const insertAt = imports.length ? imports[imports.length - 1].end : 0;
    out = out.slice(0, insertAt) + '\n' + [...new Set(newImports)].join('\n') + out.slice(insertAt);
  }
  if (WRITE) fs.writeFileSync(file, out);
}

console.log(`MIGRATED (${report.migrated.length}):`);
report.migrated.forEach((l) => console.log('  ' + l));
console.log(`HOC DROPPED — no EE counterpart (${report.hocDropped.length}):`);
report.hocDropped.forEach((l) => console.log('  ' + l));
console.log(`SKIPPED hand-migration (${report.skipped.length}):`);
report.skipped.forEach((l) => console.log('  ' + l));
console.log(`MANUAL REVIEW (${report.manual.length}):`);
report.manual.forEach((l) => console.log('  ' + l));
if (!WRITE) console.log('\nDry run — pass --write to apply.');
