/*
 * Validates marketplace plugins. For each plugin it checks that:
 *   - lib/index.ts, lib/types.ts, lib/icon.svg and package.json exist
 *   - lib/manifest.json and lib/operations.json match plugins/schemas/*.schema.json
 *   - no template placeholders like {{OPERATION_1_NAME}} are left in those two files
 *   - manifest source.kind equals the directory name and isn't a built-in connector's kind
 *   - source.kind appears exactly once in plugins.json (skipped with --skip-registry)
 *   - @spec/<kind>/<name> refs use the plugin id and have openapi-specs/<name>.json|yaml
 *   - without @spec refs, every operation value appears as a string literal in lib/*.ts
 *
 * Prints PASS / KNOWN / FAIL per plugin, then a summary. Exits 1 if anything failed.
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

const THIS_FILE = fileURLToPath(import.meta.url);
const MARKETPLACE_DIR = resolve(THIS_FILE, '../..');
const PLUGINS_DIR = join(MARKETPLACE_DIR, 'plugins');
const SCHEMAS_DIR = join(MARKETPLACE_DIR, '../plugins/schemas');
const BUILTIN_PLUGINS_DIR = join(MARKETPLACE_DIR, '../plugins/packages');
const REGISTRY_FILE =
  process.env.PLUGINS_JSON || join(MARKETPLACE_DIR, '../server/src/assets/marketplace/plugins.json');

const REQUIRED_FILES = ['lib/index.ts', 'lib/types.ts', 'lib/icon.svg', 'package.json'];
// Upper-case only: lower-case tokens like {{tenant_id}} are real runtime values in shipped manifests.
const TEMPLATE_PLACEHOLDER = /\{\{[A-Z0-9_]+\}\}/g;

// Pre-existing problems in shipped plugins. Only these exact errors are tolerated; anything else still fails.
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

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function listDir(dir) {
  return existsSync(dir) ? readdirSync(dir) : [];
}

// V1 manifests use `source`, V2 manifests use `tj:source`.
function getKind(manifest) {
  return (manifest?.source ?? manifest?.['tj:source'])?.kind;
}

// Every string anywhere inside a JSON value.
function allStrings(value) {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(allStrings);
  return [];
}

function loadSchemaValidators() {
  const ajv = new Ajv({ allErrors: true });
  return {
    manifest: ajv.compile(readJson(join(SCHEMAS_DIR, 'manifest.schema.json'))),
    operations: ajv.compile(readJson(join(SCHEMAS_DIR, 'operations.schema.json'))),
  };
}

function loadBuiltinKinds() {
  const kinds = new Set();
  for (const name of listDir(BUILTIN_PLUGINS_DIR)) {
    const manifestFile = join(BUILTIN_PLUGINS_DIR, name, 'lib/manifest.json');
    if (existsSync(manifestFile)) kinds.add(getKind(readJson(manifestFile)));
  }
  return kinds;
}

/**
 * Returns a list of error messages for one plugin directory (empty = valid).
 * `registry` is the parsed plugins.json, or undefined to skip the registry check.
 */
function checkPlugin(dir, { validators, builtinKinds, registry }) {
  if (!existsSync(join(dir, 'lib'))) return [`plugin directory not found: ${dir}`];

  const errors = [];

  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(dir, file))) errors.push(`missing ${file}`);
  }

  // manifest.json and operations.json: present, schema-valid, no leftover placeholders.
  const docs = {};
  for (const name of ['manifest', 'operations']) {
    const file = join(dir, 'lib', `${name}.json`);
    if (!existsSync(file)) {
      errors.push(`missing lib/${name}.json`);
      continue;
    }
    const doc = readJson(file);
    docs[name] = doc;

    const validate = validators[name];
    if (!validate(doc)) {
      for (const e of validate.errors) errors.push(`${name}.json${e.dataPath} ${e.message}`);
    }

    // Checked on the serialized JSON so placeholders used as object keys are caught too.
    const placeholders = new Set(JSON.stringify(doc).match(TEMPLATE_PLACEHOLDER));
    for (const token of placeholders) errors.push(`lib/${name}.json has unreplaced template placeholder ${token}`);
  }

  // Identity: the manifest kind is the plugin id.
  const id = getKind(docs.manifest);
  if (id !== undefined) {
    const dirName = basename(dir);
    if (dirName !== id) errors.push(`directory "${dirName}" must equal source.kind "${id}"`);

    if (builtinKinds.has(id))
      errors.push(`source.kind "${id}" collides with a built-in connector in plugins/packages/`);

    if (registry) {
      const count = registry.filter((entry) => entry.id === id).length;
      if (count !== 1) errors.push(`id "${id}" appears ${count} times in plugins.json (expected 1)`);
    }
  }

  // Operations: spec-driven plugins must ship their specs; the rest must handle each operation in code.
  if (docs.operations) {
    const specRefs = allStrings(docs.operations).filter((s) => s.startsWith('@spec/'));

    if (specRefs.length > 0) {
      const specFiles = listDir(join(dir, 'openapi-specs'));
      for (const ref of specRefs) {
        const [, kind, name] = ref.split('/');
        if (id !== undefined && kind !== id) errors.push(`${ref} must use the plugin id "${id}"`);
        if (!specFiles.includes(`${name}.json`) && !specFiles.includes(`${name}.yaml`)) {
          errors.push(`missing openapi-specs/${name}.(json|yaml) for ${ref}`);
        }
      }
    } else {
      const libDir = join(dir, 'lib');
      const sourceCode = listDir(libDir)
        .filter((f) => f.endsWith('.ts'))
        .map((f) => readFileSync(join(libDir, f), 'utf8'))
        .join('\n');
      for (const operation of docs.operations.properties?.operation?.list ?? []) {
        const v = operation.value;
        const handled =
          sourceCode.includes(`"${v}"`) || sourceCode.includes(`'${v}'`) || sourceCode.includes(`\`${v}\``);
        if (!handled) errors.push(`operation "${v}" not handled in lib/*.ts`);
      }
    }
  }

  return errors;
}

function main(args) {
  const flags = args.filter((a) => a.startsWith('--'));
  const unknownFlag = flags.some((f) => f !== '--all' && f !== '--skip-registry');
  const targets = flags.includes('--all')
    ? readdirSync(PLUGINS_DIR).filter((d) => d !== 'common' && existsSync(join(PLUGINS_DIR, d, 'lib')))
    : args.filter((a) => !a.startsWith('--'));

  if (targets.length === 0 || unknownFlag) {
    console.error(USAGE);
    return 1;
  }

  const context = {
    validators: loadSchemaValidators(),
    builtinKinds: loadBuiltinKinds(),
    registry: flags.includes('--skip-registry') ? undefined : readJson(REGISTRY_FILE),
  };

  let failed = 0;
  let known = 0;
  for (const target of targets) {
    // A target is either a plugin id under marketplace/plugins/ or a path to a plugin directory.
    const dir = existsSync(target) ? resolve(target) : join(PLUGINS_DIR, target);
    const id = basename(resolve(target));
    const allErrors = checkPlugin(dir, context);
    const newErrors = allErrors.filter((e) => !(KNOWN_FAILURES[id] ?? []).includes(e));

    if (newErrors.length > 0) {
      failed++;
      for (const e of newErrors) console.log(`FAIL ${id}: ${e}`);
    } else if (allErrors.length > 0) {
      known++;
      for (const e of allErrors) console.log(`KNOWN ${id}: ${e}`);
    } else {
      console.log(`PASS ${id}`);
    }
  }

  console.log(`${targets.length} checked, ${failed} failed, ${known} known failures`);
  return failed > 0 ? 1 : 0;
}

// ---- self-test ----
// Each case copies a known-good plugin into a temp dir, breaks one thing, runs this script on it,
// and expects a given exit code and output text.

const GOOD_PLUGIN = 'cohere';

function copyPlugin(id, tmp) {
  const dest = join(tmp, id);
  cpSync(join(PLUGINS_DIR, id), dest, { recursive: true, filter: (p) => !p.includes('node_modules') });
  return dest;
}

function editJson(file, change) {
  const doc = readJson(file);
  change(doc);
  writeFileSync(file, JSON.stringify(doc));
}

// Copies the good plugin, applies `change` to one of its lib/*.json files, and validates the copy.
function goodPluginWithChange(tmp, jsonFile, change) {
  const dir = copyPlugin(GOOD_PLUGIN, tmp);
  editJson(join(dir, 'lib', jsonFile), change);
  return { args: [dir, '--skip-registry'] };
}

const SELF_TEST_CASES = [
  {
    name: 'valid plugin passes',
    expectExit: 0,
    expectOutput: `PASS ${GOOD_PLUGIN}`,
    setup: () => ({ args: [GOOD_PLUGIN] }),
  },
  {
    name: 'valid directory passes (skip registry)',
    expectExit: 0,
    expectOutput: `PASS ${GOOD_PLUGIN}`,
    setup: (tmp) => goodPluginWithChange(tmp, 'manifest.json', () => {}),
  },
  {
    name: 'known failure is tolerated',
    expectExit: 0,
    expectOutput: 'KNOWN presto',
    setup: () => ({ args: ['presto'] }),
  },
  {
    name: 'a new error on a known-failure plugin still fails',
    expectExit: 1,
    expectOutput: 'missing lib/types.ts',
    setup: (tmp) => {
      const dir = copyPlugin('presto', tmp);
      rmSync(join(dir, 'lib/types.ts'));
      return { args: [dir] };
    },
  },
  {
    name: 'built-in connector kind fails',
    expectExit: 1,
    expectOutput: 'collides with a built-in',
    setup: (tmp) => goodPluginWithChange(tmp, 'manifest.json', (m) => (m.source.kind = 'googlesheets')),
  },
  {
    name: 'directory differs from source.kind even with --skip-registry',
    expectExit: 1,
    expectOutput: `directory "${GOOD_PLUGIN}" must equal source.kind "other"`,
    setup: (tmp) => goodPluginWithChange(tmp, 'manifest.json', (m) => (m.source.kind = 'other')),
  },
  {
    name: 'invented widget type fails',
    expectExit: 1,
    expectOutput: 'operations.json',
    setup: (tmp) =>
      goodPluginWithChange(tmp, 'operations.json', (ops) => (ops.properties.operation.type = 'codeeditor')),
  },
  {
    name: 'manifest without source.name fails',
    expectExit: 1,
    expectOutput: 'manifest.json',
    setup: (tmp) => goodPluginWithChange(tmp, 'manifest.json', (m) => delete m.source.name),
  },
  {
    name: 'leftover template placeholder fails',
    expectExit: 1,
    expectOutput: 'unreplaced template placeholder {{OPERATION_1_NAME}}',
    setup: (tmp) =>
      goodPluginWithChange(
        tmp,
        'operations.json',
        (ops) => (ops.properties.operation.list[0].name = '{{OPERATION_1_NAME}}')
      ),
  },
  {
    name: 'duplicate registry id fails',
    expectExit: 1,
    expectOutput: 'appears 2 times',
    setup: (tmp) => {
      const registry = readJson(REGISTRY_FILE);
      const duplicated = [...registry, registry.find((entry) => entry.id === GOOD_PLUGIN)];
      const registryFile = join(tmp, 'plugins.json');
      writeFileSync(registryFile, JSON.stringify(duplicated));
      return { args: [GOOD_PLUGIN], env: { PLUGINS_JSON: registryFile } };
    },
  },
];

function selfTest() {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'validate-plugin-'));
  try {
    SELF_TEST_CASES.forEach((testCase, i) => {
      const tmp = join(tmpRoot, String(i));
      mkdirSync(tmp);
      const { args, env = {} } = testCase.setup(tmp);
      const result = spawnSync('node', [THIS_FILE, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
      if (result.status !== testCase.expectExit || !result.stdout.includes(testCase.expectOutput)) {
        throw new Error(
          `${testCase.name}: expected exit ${testCase.expectExit} and "${testCase.expectOutput}", ` +
            `got exit ${result.status}\n${result.stdout}`
        );
      }
      console.log(`ok ${testCase.name}`);
    });
    return 0;
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
}

process.exit(process.argv.includes('--self-test') ? selfTest() : main(process.argv.slice(2)));
