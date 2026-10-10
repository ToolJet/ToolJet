// Ant Design pack (experiment): writes one literal widget config file per antd widget, generated from
// src/AppBuilder/WidgetManager/antDesignSource.js. ToolJet's own registry and the MCP catalog generator both read
// literal configs, one per file. Run: node scripts-antd-literals.mjs (from frontend/).
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const src = resolve('src/AppBuilder/WidgetManager/antDesignSource.js');
const tmp = join(mkdtempSync(join(tmpdir(), 'antd-')), 'source.mjs');
writeFileSync(tmp, readFileSync(src, 'utf8'));
const mod = await import(tmp);
const out = resolve('src/AppBuilder/WidgetManager/widgets');
const names = [];
for (const [exportName, cfg] of Object.entries(mod)) {
  if (!exportName.endsWith('Config') || !cfg?.name) continue;
  const file = cfg.name.charAt(0).toLowerCase() + cfg.name.slice(1) + '.js';
  writeFileSync(join(out, file), `// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.\nexport const ${exportName} = ${JSON.stringify(cfg, null, 2)};\n`);
  names.push([exportName, file]);
}
const index = [
  '// Ant Design pack (experiment): registry of the generated antd widget configs.',
  ...names.map(([e, f]) => `import { ${e} } from './${f.replace(/\.js$/, '')}';`),
  '',
  `export const antDesignConfigs = [${names.map(([e]) => e).join(', ')}];`,
  'export const ANT_DESIGN_COMPONENTS = antDesignConfigs.map((c) => c.name);',
  '',
].join('\n');
writeFileSync(join(out, 'antDesign.js'), index);
console.log(names.length, 'configs written');
