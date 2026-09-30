import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, cpSync } from 'fs';
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
  presto: 'registry id is "presto" but manifest kind is "Presto"',
  s3: 'not listed in server plugins.json',
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
  }

  if (docs.operations) {
    const specs = strings(docs.operations).filter((s) => s.startsWith('@spec/'));
    if (specs.length) {
      for (const s of specs) {
        if (!['json', 'yaml', 'yml'].some((x) => existsSync(join(dir, 'openapi-specs', `${basename(s)}.${x}`))))
          errors.push(`missing openapi-specs/${basename(s)}.(json|yaml) for ${s}`);
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
    const errors = validate(t, skipRegistry);
    const id = basename(resolve(t));
    if (errors.length && KNOWN_FAILURES[id]) {
      known++;
      console.log(`KNOWN ${id}: ${KNOWN_FAILURES[id]}`);
    } else if (errors.length) {
      failed++;
      errors.forEach((e) => console.log(`FAIL ${id}: ${e}`));
    }
  }
  console.log(`${targets.length} checked, ${failed} failed, ${known} known failures`);
  return failed ? 1 : 0;
}

function selfTest() {
  const tmp = mkdtempSync(join(tmpdir(), 'validate-plugin-'));
  const copy = join(tmp, 'cohere');
  cpSync(join(root, 'plugins/cohere'), copy, { recursive: true, filter: (s) => !s.includes('node_modules') });
  const self = fileURLToPath(import.meta.url);
  const exec = (args, env = {}) =>
    spawnSync('node', [self, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
  const expect = (label, r, code) => {
    if (r.status !== code) throw new Error(`${label}: expected exit ${code}, got ${r.status}\n${r.stdout}`);
    console.log(`ok ${label}`);
  };
  expect('valid plugin passes', exec(['cohere']), 0);
  expect('valid directory passes (skip registry)', exec([copy, '--skip-registry']), 0);
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
  const probe = join(copy, 'lib/probe.ts');
  writeFileSync(probe, "case 'a(b':\n");
  const probeOps = readJson(opsFile);
  const list = probeOps.properties.operation.list;
  list.push({ value: 'a(b', name: 'p' }, { value: 'a.c', name: 'q' });
  writeFileSync(opsFile, JSON.stringify(probeOps));
  const out = exec([copy, '--skip-registry']);
  const failing = out.stdout;
  if (out.status !== 1 || failing.includes('"a(b"') || !failing.includes('"a.c"'))
    throw new Error(`operation value matching: unexpected result\n${failing}${out.stderr}`);
  console.log('ok operation values with regex characters match literally');
  return 0;
}

process.exit(process.argv.includes('--self-test') ? selfTest() : run(process.argv.slice(2)));
