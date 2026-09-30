import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, cpSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { basename, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import Ajv from 'ajv';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const schemaDir = join(root, '../plugins/schemas');
const registryPath = () => process.env.PLUGINS_JSON || join(root, '../server/src/assets/marketplace/plugins.json');
const REQUIRED = ['lib/index.ts', 'lib/types.ts', 'lib/icon.svg', 'package.json'];
const KNOWN_FAILURES = {
  presto: 'id "Presto" appears 0 times in plugins.json (expected 1)',
  s3: 'id "s3" appears 0 times in plugins.json (expected 1)',
};

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const strings = (v) =>
  typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];

function validate(arg, skipRegistry) {
  const dir = existsSync(arg) ? resolve(arg) : join(root, 'plugins', arg);
  const errors = [];
  if (!existsSync(join(dir, 'lib'))) return [`plugin directory not found: ${dir}`];
  REQUIRED.filter((f) => !existsSync(join(dir, f))).forEach((f) => errors.push(`missing ${f}`));

  const ajv = new Ajv({ allErrors: true });
  const docs = {};
  for (const name of ['manifest', 'operations']) {
    const file = join(dir, 'lib', `${name}.json`);
    if (!existsSync(file)) {
      errors.push(`missing lib/${name}.json`);
      continue;
    }
    docs[name] = readJson(file);
    const check = ajv.compile(readJson(join(schemaDir, `${name}.schema.json`)));
    if (!check(docs[name])) check.errors.forEach((e) => errors.push(`${name}.json${e.dataPath} ${e.message}`));
  }

  const id = (docs.manifest?.source ?? docs.manifest?.['tj:source'])?.kind;
  if (!skipRegistry) {
    const n = readJson(registryPath()).filter((p) => p.id === id).length;
    if (n !== 1) errors.push(`id "${id}" appears ${n} times in plugins.json (expected 1)`);
    else if (basename(dir) !== id) errors.push(`directory "${basename(dir)}" must equal source.kind "${id}"`);
  }

  if (docs.operations) {
    const specs = strings(docs.operations).filter((s) => s.startsWith('@spec/'));
    if (specs.length) {
      for (const s of specs) {
        const [, kind, name] = s.split('/');
        if (kind !== id) errors.push(`${s} must use the plugin id "${id}"`);
        if (!['json', 'yaml'].some((x) => existsSync(join(dir, 'openapi-specs', `${name}.${x}`))))
          errors.push(`missing openapi-specs/${name}.(json|yaml) for ${s}`);
      }
    } else {
      const list = docs.operations.properties?.operation?.list ?? [];
      const src = readdirSync(join(dir, 'lib'))
        .filter((f) => f.endsWith('.ts'))
        .map((f) => readFileSync(join(dir, 'lib', f), 'utf8'))
        .join('\n');
      list
        .filter((o) => !['"', "'", '`'].some((q) => src.includes(q + o.value + q)))
        .forEach((o) => errors.push(`operation "${o.value}" not handled in lib/*.ts`));
    }
  }
  return errors;
}

function run(args) {
  const skipRegistry = args.includes('--skip-registry');
  let targets = args.filter((a) => !a.startsWith('--'));
  if (args.includes('--all'))
    targets = readdirSync(join(root, 'plugins')).filter(
      (d) => d !== 'common' && existsSync(join(root, 'plugins', d, 'lib'))
    );
  if (!targets.length)
    return console.error('usage: validate-plugin <plugin-id-or-dir>... | --all [--skip-registry] | --self-test') || 1;
  let failed = 0;
  let known = 0;
  for (const t of targets) {
    const id = basename(resolve(t));
    const all = validate(t, skipRegistry);
    const errors = all.filter((e) => e !== KNOWN_FAILURES[id]);
    if (errors.length) {
      failed++;
      errors.forEach((e) => console.log(`FAIL ${id}: ${e}`));
    } else if (all.length) {
      known++;
      console.log(`KNOWN ${id}: ${KNOWN_FAILURES[id]}`);
    }
  }
  console.log(`${targets.length} checked, ${failed} failed, ${known} known failures`);
  return failed ? 1 : 0;
}

function selfTest() {
  const tmp = mkdtempSync(join(tmpdir(), 'validate-plugin-'));
  try {
    const copy = join(tmp, 'cohere');
    const skip = (d) => !d.includes('node_modules');
    cpSync(join(root, 'plugins/cohere'), copy, { recursive: true, filter: skip });
    const self = fileURLToPath(import.meta.url);
    const exec = (args, env = {}) =>
      spawnSync('node', [self, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
    const expect = (label, r, code) => {
      if (r.status !== code) throw new Error(`${label}: expected exit ${code}, got ${r.status}\n${r.stdout}`);
      console.log(`ok ${label}`);
    };
    expect('valid plugin passes', exec(['cohere']), 0);
    expect('valid directory passes (skip registry)', exec([copy, '--skip-registry']), 0);
    expect('known failure is suppressed', exec(['presto']), 0);
    const presto = join(tmp, 'presto');
    cpSync(join(root, 'plugins/presto'), presto, { recursive: true, filter: skip });
    rmSync(join(presto, 'lib/types.ts'));
    expect('other error on a known-failure plugin fails', exec([presto]), 1);
    const opsFile = join(copy, 'lib/operations.json');
    const ops = readJson(opsFile);
    ops.properties.operation.type = 'codeeditor';
    writeFileSync(opsFile, JSON.stringify(ops));
    expect('invented widget type fails', exec([copy, '--skip-registry']), 1);
    writeFileSync(opsFile, readFileSync(join(root, 'plugins/cohere/lib/operations.json')));
    const manifest = join(copy, 'lib/manifest.json');
    const m = readJson(manifest);
    delete m.source.name;
    writeFileSync(manifest, JSON.stringify(m));
    expect('manifest without source.name fails', exec([copy, '--skip-registry']), 1);
    const dup = join(tmp, 'plugins.json');
    const reg = readJson(registryPath());
    writeFileSync(dup, JSON.stringify([...reg, reg.find((p) => p.id === 'cohere')]));
    expect('duplicate registry id fails', exec(['cohere'], { PLUGINS_JSON: dup }), 1);
    return 0;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

process.exit(process.argv.includes('--self-test') ? selfTest() : run(process.argv.slice(2)));
