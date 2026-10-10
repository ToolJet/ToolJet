// shadcn/ui pack (experiment): writes one literal widget config file per shadcn widget, generated from the config
// sources src/AppBuilder/WidgetManager/shadcnSource*.js (with their shared shadcnPackHelpers.js). ToolJet's own
// registry and the MCP catalog generator both read literal configs, one per file. Output is formatted with the repo's
// prettier settings, and a file is written only when its content changes.
// Run: node scripts-shadcn-literals.mjs (from frontend/).
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import prettier from 'prettier';

const dir = resolve('src/AppBuilder/WidgetManager');
const out = join(dir, 'widgets');
// The sources import their helpers by relative path, so they are copied together into one module directory.
const tmp = mkdtempSync(join(tmpdir(), 'shadcn-'));
writeFileSync(join(tmp, 'package.json'), '{"type":"module"}');
const sources = readdirSync(dir).filter((f) => /^shadcnSource.*\.js$/.test(f)).sort();
for (const f of [...sources, 'shadcnPackHelpers.js']) writeFileSync(join(tmp, f), readFileSync(join(dir, f), 'utf8'));
// Native configs a pack widget builds on (the Dialog is ModalV2 in the pack's look).
mkdirSync(join(tmp, 'widgets'));
for (const f of ['modalV2.js']) writeFileSync(join(tmp, 'widgets', f), readFileSync(join(out, f), 'utf8'));

const PRETTIER = { parser: 'babel', semi: true, trailingComma: 'es5', printWidth: 120, singleQuote: true, arrowParens: 'always' };
let written = 0;
const write = (file, code) => {
  const formatted = prettier.format(code, PRETTIER);
  if (existsSync(file) && readFileSync(file, 'utf8') === formatted) return;
  writeFileSync(file, formatted);
  written += 1;
};

const names = [];
for (const source of sources) {
  const mod = await import(join(tmp, source));
  for (const [exportName, cfg] of Object.entries(mod)) {
    if (!exportName.endsWith('Config') || !cfg?.name) continue;
    if (names.some(([e]) => e === exportName)) throw new Error(`${exportName} is defined twice`);
    const file = cfg.name.charAt(0).toLowerCase() + cfg.name.slice(1) + '.js';
    write(
      join(out, file),
      `// GENERATED from WidgetManager/${source} by scripts-shadcn-literals.mjs. Do not edit by hand.\nexport const ${exportName} = ${JSON.stringify(cfg, null, 2)};\n`
    );
    names.push([exportName, file]);
  }
}
const index = [
  '// shadcn/ui pack (experiment): registry of the generated shadcn widget configs.',
  ...names.map(([e, f]) => `import { ${e} } from './${f.replace(/\.js$/, '')}';`),
  '',
  `export const shadcnConfigs = [${names.map(([e]) => e).join(', ')}];`,
  'export const SHADCN_COMPONENTS = shadcnConfigs.map((c) => c.name);',
  '',
].join('\n');
write(join(out, 'shadcn.js'), index);
console.log(names.length, 'configs,', written, 'files written');
