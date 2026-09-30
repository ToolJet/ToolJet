/*
 * Validates marketplace plugins. Per plugin it checks:
 *   - required files exist (lib/index.ts, lib/types.ts, lib/icon.svg, package.json)
 *   - lib/manifest.json and lib/operations.json match plugins/schemas/*.schema.json
 *   - no unreplaced template placeholders ({{UPPER_CASE}}) remain in those two files
 *   - source.kind appears exactly once in plugins.json and equals the directory name
 *   - source.kind is not the kind of a built-in connector in plugins/packages/
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
  presto: ['id "Presto" appears 0 times in plugins.json (expected 1)'],
  s3: [
    'id "s3" appears 0 times in plugins.json (expected 1)',
    'source.kind "s3" collides with a built-in connector in plugins/packages/',
  ],
};
const USAGE = 'usage: validate-plugin <plugin-id-or-dir>... | --all [--skip-registry] | --self-test';

/**
 * @typedef {{ id: string }} RegistryEntry
 * @typedef {(doc: unknown) => boolean} SchemaValidator  Ajv validator; sets `.errors` on failure
 * @typedef {object} LoadedPlugin
 * @property {string} dirName          basename of the plugin directory
 * @property {string[]} presentFiles   which REQUIRED_FILES exist
 * @property {{ manifest?: object, operations?: object }} docs  parsed lib/*.json, absent if missing
 * @property {string} sourceText       all lib/*.ts concatenated
 * @property {string[]} specFiles      file names in openapi-specs/
 * @property {RegistryEntry[] | undefined} registry  undefined when --skip-registry
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
    if (kind !== id) errors.push(`${ref} must use the plugin id "${id}"`);
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

/**
 * @param {LoadedPlugin} plugin
 * @param {Record<string, SchemaValidator>} validators
 * @param {Set<string>} builtinKinds  source.kind of every plugins/packages connector
 */
function checkPlugin(plugin, validators, builtinKinds) {
  const { manifest, operations } = plugin.docs;
  const id = sourceKind(manifest);
  const errors = [
    ...checkRequiredFiles(plugin.presentFiles),
    ...SCHEMA_CHECKED_FILES.flatMap((name) => checkAgainstSchema(name, plugin.docs[name], validators[name])),
    ...SCHEMA_CHECKED_FILES.flatMap((name) => checkNoPlaceholders(name, plugin.docs[name])),
    ...checkNotBuiltinKind(id, builtinKinds),
  ];
  if (plugin.registry) {
    const registryErrors = checkRegistryEntry(id, plugin.registry);
    errors.push(...(registryErrors.length ? registryErrors : checkDirectoryMatchesId(plugin.dirName, id)));
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

/** @returns {LoadedPlugin} */
function loadPlugin(dir, skipRegistry) {
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
    registry: skipRegistry ? undefined : readJson(registryPath()),
  };
}

function validateTarget(target, skipRegistry, validators, builtinKinds) {
  const dir = existsSync(target) ? resolve(target) : join(PLUGINS_DIR, target);
  if (!existsSync(join(dir, 'lib'))) return [`plugin directory not found: ${dir}`];
  return checkPlugin(loadPlugin(dir, skipRegistry), validators, builtinKinds);
}

const allPluginIds = () =>
  readdirSync(PLUGINS_DIR).filter((d) => d !== 'common' && existsSync(join(PLUGINS_DIR, d, 'lib')));

// ---- reporting + CLI ----

function run(args) {
  const skipRegistry = args.includes('--skip-registry');
  const targets = args.includes('--all') ? allPluginIds() : args.filter((a) => !a.startsWith('--'));
  if (!targets.length) {
    console.error(USAGE);
    return 1;
  }
  const validators = loadSchemaValidators();
  const builtinKinds = loadBuiltinKinds();
  let failed = 0;
  let known = 0;
  for (const target of targets) {
    const id = basename(resolve(target));
    const all = validateTarget(target, skipRegistry, validators, builtinKinds);
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

// ---- self-test: each case prepares a fresh temp dir and expects an exit code ----

const copyPlugin = (id, dest) =>
  cpSync(join(PLUGINS_DIR, id), dest, { recursive: true, filter: (p) => !p.includes('node_modules') });

const editJson = (file, edit) => {
  const doc = readJson(file);
  edit(doc);
  writeFileSync(file, JSON.stringify(doc));
};

const SELF_TEST_CASES = [
  { label: 'valid plugin passes', exit: 0, prepare: () => ({ args: ['cohere'] }) },
  {
    label: 'valid directory passes (skip registry)',
    exit: 0,
    prepare: (tmp) => {
      copyPlugin('cohere', join(tmp, 'cohere'));
      return { args: [join(tmp, 'cohere'), '--skip-registry'] };
    },
  },
  { label: 'known failure is suppressed', exit: 0, prepare: () => ({ args: ['presto'] }) },
  {
    label: 'other error on a known-failure plugin fails',
    exit: 1,
    prepare: (tmp) => {
      copyPlugin('presto', join(tmp, 'presto'));
      rmSync(join(tmp, 'presto/lib/types.ts'));
      return { args: [join(tmp, 'presto')] };
    },
  },
  { label: 'several known failures are suppressed', exit: 0, prepare: () => ({ args: ['s3'] }) },
  {
    label: 'other error on a multi-known-failure plugin fails',
    exit: 1,
    prepare: (tmp) => {
      copyPlugin('s3', join(tmp, 's3'));
      rmSync(join(tmp, 's3/lib/types.ts'));
      return { args: [join(tmp, 's3')] };
    },
  },
  {
    label: 'built-in connector kind fails',
    exit: 1,
    prepare: (tmp) => {
      copyPlugin('cohere', join(tmp, 'cohere'));
      editJson(join(tmp, 'cohere/lib/manifest.json'), (m) => (m.source.kind = 'googlesheets'));
      return { args: [join(tmp, 'cohere'), '--skip-registry'] };
    },
  },
  {
    label: 'invented widget type fails',
    exit: 1,
    prepare: (tmp) => {
      copyPlugin('cohere', join(tmp, 'cohere'));
      editJson(join(tmp, 'cohere/lib/operations.json'), (ops) => (ops.properties.operation.type = 'codeeditor'));
      return { args: [join(tmp, 'cohere'), '--skip-registry'] };
    },
  },
  {
    label: 'manifest without source.name fails',
    exit: 1,
    prepare: (tmp) => {
      copyPlugin('cohere', join(tmp, 'cohere'));
      editJson(join(tmp, 'cohere/lib/manifest.json'), (m) => delete m.source.name);
      return { args: [join(tmp, 'cohere'), '--skip-registry'] };
    },
  },
  {
    label: 'unreplaced template placeholder fails',
    exit: 1,
    prepare: (tmp) => {
      copyPlugin('cohere', join(tmp, 'cohere'));
      editJson(
        join(tmp, 'cohere/lib/operations.json'),
        (ops) => (ops.properties.operation.list[0].name = '{{OPERATION_1_NAME}}')
      );
      return { args: [join(tmp, 'cohere'), '--skip-registry'] };
    },
  },
  {
    label: 'duplicate registry id fails',
    exit: 1,
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
    SELF_TEST_CASES.forEach(({ label, exit, prepare }, i) => {
      const caseDir = join(tmp, String(i));
      mkdirSync(caseDir);
      const { args, env = {} } = prepare(caseDir);
      const r = spawnSync('node', [SELF, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
      if (r.status !== exit) throw new Error(`${label}: expected exit ${exit}, got ${r.status}\n${r.stdout}`);
      console.log(`ok ${label}`);
    });
    return 0;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

process.exit(process.argv.includes('--self-test') ? selfTest() : run(process.argv.slice(2)));
