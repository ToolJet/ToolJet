// Generates each template manifest's `sources` from the data sources its queries use, and validates every manifest.
// With --check it writes nothing and exits 1 if any manifest is out of date (CI).
// Run from server/: npm run templates:generate [-- --check]
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  deriveSources,
  TemplateDefinition,
  TemplateManifest,
  validateManifest,
} from '../src/modules/templates/template-assets';

const SERVER_DIR = join(__dirname, '..');
const TEMPLATES_DIR = join(SERVER_DIR, 'templates');
const ASSETS_DIR = join(SERVER_DIR, '..', 'frontend', 'assets', 'custom-components', 'templates');
const PLUGINS_DIR = join(SERVER_DIR, '..', 'plugins', 'packages');

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf-8')) as T;

function pluginName(kind: string): string | undefined {
  const manifestPath = join(PLUGINS_DIR, kind, 'lib', 'manifest.json');
  if (!existsSync(manifestPath)) return undefined;
  return readJson<{ 'tj:source'?: { name?: string } }>(manifestPath)['tj:source']?.name;
}

function main() {
  const check = process.argv.includes('--check');
  const categories = readJson<Record<string, string>>(join(TEMPLATES_DIR, 'categories.json'));
  const expected = new Map<string, string>(); // file path -> expected content
  const errors: string[] = [];

  const folders = readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const folder of folders) {
    const dir = join(TEMPLATES_DIR, folder);
    const manifest = readJson<TemplateManifest>(join(dir, 'manifest.json'));
    const definition = readJson<TemplateDefinition>(join(dir, 'definition.json'));

    const previewExists = existsSync(join(ASSETS_DIR, `${folder}.html`));
    errors.push(...validateManifest(folder, manifest, categories, previewExists).map((e) => `${folder}: ${e}`));

    try {
      const sources = deriveSources(definition, pluginName);
      expected.set(join(dir, 'manifest.json'), `${JSON.stringify({ ...manifest, sources }, null, 2)}\n`);
    } catch (error) {
      errors.push(`${folder}: ${(error as Error).message}`);
    }
  }

  if (errors.length) {
    console.error(`Template validation failed:\n  ${errors.join('\n  ')}`);
    process.exit(1);
  }

  const changed = [...expected].filter(
    ([path, content]) => !existsSync(path) || readFileSync(path, 'utf-8') !== content
  );
  const changedPaths = changed.map(([path]) => path);

  if (check) {
    if (changedPaths.length) {
      console.error('Template manifests are out of date. Run: cd server && npm run templates:generate');
      changedPaths.forEach((path) => console.error(`  ${path}`));
      process.exit(1);
    }
    console.log(`Template manifests are up to date (${folders.length} templates).`);
    return;
  }

  changed.forEach(([path, content]) => writeFileSync(path, content));
  console.log(`Wrote ${changed.length} file(s).`);
}

main();
