// shadcn/ui pack (experiment): writes one literal widget config file per shadcn widget, generated from
// src/AppBuilder/WidgetManager/shadcnSource.js. ToolJet's own registry and the MCP catalog generator both read
// literal configs, one per file. Run: node scripts-shadcn-literals.mjs (from frontend/).
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const src = resolve('src/AppBuilder/WidgetManager/shadcnSource.js');
const tmp = join(mkdtempSync(join(tmpdir(), 'shadcn-')), 'source.mjs');
writeFileSync(tmp, readFileSync(src, 'utf8'));
const mod = await import(tmp);
const out = resolve('src/AppBuilder/WidgetManager/widgets');
const names = [];
for (const [exportName, cfg] of Object.entries(mod)) {
  if (!exportName.endsWith('Config') || !cfg?.name) continue;
  const file = cfg.name.charAt(0).toLowerCase() + cfg.name.slice(1) + '.js';
  writeFileSync(join(out, file), `// GENERATED from WidgetManager/shadcnSource.js by scripts-shadcn-literals.mjs. Do not edit by hand.\nexport const ${exportName} = ${JSON.stringify(cfg, null, 2)};\n`);
  names.push([exportName, file]);
}
const index = [
  '// shadcn/ui pack (experiment): registry of the generated shadcn widget configs.',
  ...names.map(([e, f]) => `import { ${e} } from './${f.replace(/\.js$/, '')}';`),
  '',
  `export const shadcnConfigs = [${names.map(([e]) => e).join(', ')}];`,
  'export const SHADCN_COMPONENTS = shadcnConfigs.map((c) => c.name);',
  '',
].join('\n');
writeFileSync(join(out, 'shadcn.js'), index);
console.log(names.length, 'configs written');
