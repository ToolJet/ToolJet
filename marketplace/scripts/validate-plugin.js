/*
 * Validates marketplace plugins. Per plugin it checks:
 *   - required files exist (lib/index.ts, lib/types.ts, lib/icon.svg, package.json)
 *   - lib/manifest.json and lib/operations.json match plugins/schemas/*.schema.json
 *   - no unreplaced template placeholders ({{UPPER_CASE}}) remain in those two files
 *   - source.kind equals the directory name and is not the kind of a built-in connector in plugins/packages/
 *   - source.kind appears exactly once in plugins.json (skipped by --skip-registry)
 *   - @spec/<kind>/<name> refs use the plugin id and have openapi-specs/<name>.(json|yaml)
 *   - without @spec refs, every operation value appears as a string literal in lib/*.ts
 *
 * Prints PASS/KNOWN/FAIL per plugin, then a summary line; exits 1 on any FAIL.
 *
 * usage: validate-plugin <plugin-id-or-dir>... | --all [--skip-registry] | --self-test
 * PLUGINS_JSON overrides the registry path.
 */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, cpSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { basename, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import Ajv from 'ajv';

const SELF = fileURLToPath(import.meta.url);
const MARKETPLACE_DIR = resolve(SELF, '../..');
const PLUGINS_DIR = join(MARKETPLACE_DIR, 'plugins');
const SCHEMA_DIR = join(MARKETPLACE_DIR, '../plugins/schemas');
const BUILTIN_DIR = join(MARKETPLACE_DIR, '../plugins/packages');
const registryPath = () =>
  process.env.PLUGINS_JSON || join(MARKETPLACE_DIR, '../server/src/assets/marketplace/plugins.json');

const REQUIRED_FILES = ['lib/index.ts', 'lib/types.ts', 'lib/icon.svg', 'package.json'];
const SCHEMA_CHECKED_FILES = ['manifest', 'operations'];
const SPEC_EXTENSIONS = ['json', 'yaml'];
const QUOTES = ['"', "'", '`'];
// Upper-case only: lower-case {{tenant_id}} is a real runtime token in shipped manifests.
const TEMPLATE_PLACEHOLDER = /\{\{[A-Z0-9_]+\}\}/g;
// Pre-existing drift: exact errors suppressed per id so --all stays green; any other error still fails.
const KNOWN_FAILURES = {
  presto: [
    'id "Presto" appears 0 times in plugins.json (expected 1)',
    'directory "presto" must equal source.kind "Presto"',
  ],
  s3: [
    'id "s3" appears 0 times in plugins.json (expected 1)',
    'source.kind "s3" collides with a built-in connector in plugins/packages/',
  ],
};
const USAGE = 'usage: validate-plugin <plugin-id-or-dir>... | --all [--skip-registry] | --self-test';

/**
 * @typedef {object} LoadedPlugin  one plugin dir, read by loadPlugin()
 * @property {string} dirName  directory basename; must match manifest source.kind
 * @property {string[]} presentFiles  REQUIRED_FILES that exist in the dir
 * @property {{manifest?: object, operations?: object}} docs  parsed lib/<name>.json, undefined if missing
 * @property {string} sourceText  all lib/*.ts concatenated (operation handler lookup)
 * @property {string[]} specFiles  file names in openapi-specs/
 * @typedef {{id: string}} RegistryEntry  one item of the plugins.json array; id must appear exactly once
 * @typedef {Object<'manifest'|'operations', import('ajv').ValidateFunction>} Validators  compiled Ajv fns from loadSchemaValidators()
 */

// ---- calculations: pure, return error strings ----

const stringsIn = (v) =>
  typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(stringsIn) : [];

const sourceKind = (manifest) => (manifest?.source ?? manifest?.['tj:source'])?.kind;

function checkRequiredFiles(presentFiles) {
  return REQUIRED_FILES.filter((f) => !presentFiles.includes(f)).map((f) => `missing ${f}`);
}

function checkAgainstSchema(name, doc, validator) {
  if (!doc) return [`missing lib/${name}.json`];
  return validator(doc) ? [] : validator.errors.map((e) => `${name}.json${e.dataPath} ${e.message}`);
}

function checkNoPlaceholders(name, doc) {
  // Serialized so placeholders used as object keys are caught too.
  const found = [...new Set(JSON.stringify(doc ?? {}).match(TEMPLATE_PLACEHOLDER))];
  return found.map((token) => `lib/${name}.json has unreplaced template placeholder ${token}`);
}

function checkRegistryEntry(id, registry) {
  const n = registry.filter((p) => p.id === id).length;
  return n === 1 ? [] : [`id "${id}" appears ${n} times in plugins.json (expected 1)`];
}

function checkNotBuiltinKind(id, builtinKinds) {
  return builtinKinds.has(id) ? [`source.kind "${id}" collides with a built-in connector in plugins/packages/`] : [];
}

function checkDirectoryMatchesId(dirName, id) {
  return dirName === id ? [] : [`directory "${dirName}" must equal source.kind "${id}"`];
}

function checkSpecReferences(specRefs, id, specFiles) {
  return specRefs.flatMap((ref) => {
    const [, kind, name] = ref.split('/');
    const errors = [];
    if (id !== undefined && kind !== id) errors.push(`${ref} must use the plugin id "${id}"`);
    if (!SPEC_EXTENSIONS.some((x) => specFiles.includes(`${name}.${x}`)))
      errors.push(`missing openapi-specs/${name}.(json|yaml) for ${ref}`);
    return errors;
  });
}

function checkOperationHandlers(operations, sourceText) {
  const list = operations.properties?.operation?.list ?? [];
  return list
    .filter((o) => !QUOTES.some((q) => sourceText.includes(q + o.value + q)))
    .map((o) => `operation "${o.value}" not handled in lib/*.ts`);
}

// registry is undefined under --skip-registry; id-based checks need a manifest with a source.kind.
function checkPlugin(plugin, validators, builtinKinds, registry) {
  const { manifest, operations } = plugin.docs;
  const id = sourceKind(manifest);
  const errors = [
    ...checkRequiredFiles(plugin.presentFiles),
    ...SCHEMA_CHECKED_FILES.flatMap((name) => checkAgainstSchema(name, plugin.docs[name], validators[name])),
    ...SCHEMA_CHECKED_FILES.flatMap((name) => checkNoPlaceholders(name, plugin.docs[name])),
  ];
  if (id !== undefined) {
    errors.push(...checkDirectoryMatchesId(plugin.dirName, id), ...checkNotBuiltinKind(id, builtinKinds));
    if (registry) errors.push(...checkRegistryEntry(id, registry));
  }
  if (operations) {
    const specRefs = stringsIn(operations).filter((s) => s.startsWith('@spec/'));
    // Spec-driven plugins route operations through the spec, not lib/*.ts literals.
    errors.push(
      ...(specRefs.length
        ? checkSpecReferences(specRefs, id, plugin.specFiles)
        : checkOperationHandlers(operations, plugin.sourceText))
    );
  }
  return errors;
}

// ---- actions: filesystem ----

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const listDir = (d) => (existsSync(d) ? readdirSync(d) : []);

function loadSchemaValidators() {
  const ajv = new Ajv({ allErrors: true });
  return Object.fromEntries(
    SCHEMA_CHECKED_FILES.map((name) => [name, ajv.compile(readJson(join(SCHEMA_DIR, `${name}.schema.json`)))])
  );
}

const loadBuiltinKinds = () =>
  new Set(
    listDir(BUILTIN_DIR)
      .map((d) => join(BUILTIN_DIR, d, 'lib/manifest.json'))
      .filter(existsSync)
      .map((f) => sourceKind(readJson(f)))
  );

function loadPlugin(dir) {
  const lib = join(dir, 'lib');
  const jsonIfExists = (name) =>
    existsSync(join(lib, `${name}.json`)) ? readJson(join(lib, `${name}.json`)) : undefined;
  return {
    dirName: basename(dir),
    presentFiles: REQUIRED_FILES.filter((f) => existsSync(join(dir, f))),
    docs: Object.fromEntries(SCHEMA_CHECKED_FILES.map((name) => [name, jsonIfExists(name)])),
    sourceText: listDir(lib)
      .filter((f) => f.endsWith('.ts'))
      .map((f) => readFileSync(join(lib, f), 'utf8'))
      .join('\n'),
    specFiles: listDir(join(dir, 'openapi-specs')),
  };
}

function validateTarget(target, validators, builtinKinds, registry) {
  const dir = existsSync(target) ? resolve(target) : join(PLUGINS_DIR, target);
  if (!existsSync(join(dir, 'lib'))) return [`plugin directory not found: ${dir}`];
  return checkPlugin(loadPlugin(dir), validators, builtinKinds, registry);
}

const allPluginIds = () =>
  readdirSync(PLUGINS_DIR).filter((d) => d !== 'common' && existsSync(join(PLUGINS_DIR, d, 'lib')));

// ---- reporting + CLI ----

function run(args) {
  const flags = args.filter((a) => a.startsWith('--'));
  const targets = flags.includes('--all') ? allPluginIds() : args.filter((a) => !a.startsWith('--'));
  if (!targets.length || flags.some((f) => !['--all', '--skip-registry'].includes(f))) {
    console.error(USAGE);
    return 1;
  }
  const validators = loadSchemaValidators();
  const builtinKinds = loadBuiltinKinds();
  const registry = flags.includes('--skip-registry') ? undefined : readJson(registryPath());
  let failed = 0;
  let known = 0;
  for (const target of targets) {
    const id = basename(resolve(target));
    const all = validateTarget(target, validators, builtinKinds, registry);
    const errors = all.filter((e) => !(KNOWN_FAILURES[id] ?? []).includes(e));
    if (errors.length) {
      failed++;
      errors.forEach((e) => console.log(`FAIL ${id}: ${e}`));
    } else if (all.length) {
      known++;
      all.forEach((e) => console.log(`KNOWN ${id}: ${e}`));
    } else {
      console.log(`PASS ${id}`);
    }
  }
  console.log(`${targets.length} checked, ${failed} failed, ${known} known failures`);
  return failed ? 1 : 0;
}

// ---- self-test: each case prepares a fresh temp dir; expects an exit code and output substring ----

const copyPlugin = (id, dest) =>
  cpSync(join(PLUGINS_DIR, id), dest, { recursive: true, filter: (p) => !p.includes('node_modules') });

const editJson = (file, edit) => {
  const doc = readJson(file);
  edit(doc);
  writeFileSync(file, JSON.stringify(doc));
};

// A cohere copy with one lib/<file>.json edit, validated without the registry.
const cohereWith = (file, edit) => (tmp) => {
  copyPlugin('cohere', join(tmp, 'cohere'));
  editJson(join(tmp, 'cohere/lib', file), edit);
  return { args: [join(tmp, 'cohere'), '--skip-registry'] };
};

const SELF_TEST_CASES = [
  { label: 'valid plugin passes', exit: 0, says: 'PASS cohere', prepare: () => ({ args: ['cohere'] }) },
  {
    label: 'valid directory passes (skip registry)',
    exit: 0,
    says: 'PASS cohere',
    prepare: cohereWith('manifest.json', () => {}),
  },
  { label: 'known failure is suppressed', exit: 0, says: 'KNOWN presto', prepare: () => ({ args: ['presto'] }) },
  {
    label: 'other error on a known-failure plugin fails',
    exit: 1,
    says: 'missing lib/types.ts',
    prepare: (tmp) => {
      copyPlugin('presto', join(tmp, 'presto'));
      rmSync(join(tmp, 'presto/lib/types.ts'));
      return { args: [join(tmp, 'presto')] };
    },
  },
  {
    label: 'built-in connector kind fails',
    exit: 1,
    says: 'collides with a built-in',
    prepare: cohereWith('manifest.json', (m) => (m.source.kind = 'googlesheets')),
  },
  {
    label: 'directory differs from source.kind even with --skip-registry',
    exit: 1,
    says: 'directory "cohere" must equal source.kind "other"',
    prepare: cohereWith('manifest.json', (m) => (m.source.kind = 'other')),
  },
  {
    label: 'invented widget type fails',
    exit: 1,
    says: 'operations.json',
    prepare: cohereWith('operations.json', (ops) => (ops.properties.operation.type = 'codeeditor')),
  },
  {
    label: 'manifest without source.name fails',
    exit: 1,
    says: 'manifest.json',
    prepare: cohereWith('manifest.json', (m) => delete m.source.name),
  },
  {
    label: 'unreplaced template placeholder fails',
    exit: 1,
    says: 'unreplaced template placeholder {{OPERATION_1_NAME}}',
    prepare: cohereWith('operations.json', (ops) => (ops.properties.operation.list[0].name = '{{OPERATION_1_NAME}}')),
  },
  {
    label: 'duplicate registry id fails',
    exit: 1,
    says: 'appears 2 times',
    prepare: (tmp) => {
      const registry = readJson(registryPath());
      writeFileSync(join(tmp, 'plugins.json'), JSON.stringify([...registry, registry.find((p) => p.id === 'cohere')]));
      return { args: ['cohere'], env: { PLUGINS_JSON: join(tmp, 'plugins.json') } };
    },
  },
];

function selfTest() {
  const tmp = mkdtempSync(join(tmpdir(), 'validate-plugin-'));
  try {
    SELF_TEST_CASES.forEach(({ label, exit, says, prepare }, i) => {
      const caseDir = join(tmp, String(i));
      mkdirSync(caseDir);
      const { args, env = {} } = prepare(caseDir);
      const r = spawnSync('node', [SELF, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
      if (r.status !== exit || !r.stdout.includes(says))
        throw new Error(`${label}: expected exit ${exit} and "${says}", got ${r.status}\n${r.stdout}`);
      console.log(`ok ${label}`);
    });
    return 0;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

process.exit(process.argv.includes('--self-test') ? selfTest() : run(process.argv.slice(2)));
