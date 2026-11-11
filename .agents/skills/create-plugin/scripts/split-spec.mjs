// Splits an OpenAPI spec into smaller self-contained files, one per group, for @spec/<id>/<name>.
//
// Run from marketplace/ after `npm install` there (js-yaml is a declared marketplace devDependency):
//   node ../.agents/skills/create-plugin/scripts/split-spec.mjs <spec> <out-dir> name=TagA,TagB [name=* ...]
//
// - Each `name=TagA,TagB` group gets the operations whose first tag is listed.
// - One group may use `*` to take every operation no other group lists.
// - Every operation must land in exactly one group, or nothing is written.
// - Each output keeps only the components its operations reference.
// - OpenAPI 3.1 `type: [X, "null"]` becomes `type: X`, because the api-endpoint widget expects a string.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { extname, join } from 'path';

const yaml = createRequire(join(process.cwd(), 'noop.js'))('js-yaml');

const USAGE = 'usage: split-spec.mjs <spec> <out-dir> name=TagA,TagB [name=* ...]';
const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
// Keys whose values are sample data, not schemas; their `type` fields are left alone.
const DATA_KEYS = ['example', 'examples', 'default', 'enum'];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function main() {
  const [specPath, outDir, ...groupArgs] = process.argv.slice(2);
  if (!specPath || !outDir || groupArgs.length === 0 || groupArgs.some((a) => !a.includes('='))) fail(USAGE);

  const spec = yaml.load(readFileSync(specPath, 'utf8'));
  const extension = extname(specPath) === '.json' ? '.json' : '.yaml';

  const groups = parseGroups(groupArgs);
  const operations = listOperations(spec);
  assignOperationsToGroups(operations, groups);

  // Build every file in memory first, so a failure leaves nothing half-written.
  const outputs = groups
    .filter((group) => group.operations.length > 0)
    .map((group) => ({
      file: join(outDir, `${group.name}${extension}`),
      body: serialize(buildGroupSpec(spec, group), extension),
      count: group.operations.length,
    }));

  mkdirSync(outDir, { recursive: true });
  for (const { file, body, count } of outputs) {
    writeFileSync(file, body);
    console.log(`${file}: ${count} operations`);
  }
  console.log(`total ${operations.length} operations`);
}

// "name=TagA,TagB" -> { name, tags: ['TagA', 'TagB'], operations: [] }
function parseGroups(groupArgs) {
  const groups = groupArgs.map((arg) => {
    const separator = arg.indexOf('=');
    return { name: arg.slice(0, separator), tags: arg.slice(separator + 1).split(','), operations: [] };
  });

  const names = groups.map((g) => g.name);
  if (new Set(names).size !== names.length) fail(`duplicate group names: ${names.join(', ')}`);
  if (groups.filter((g) => g.tags.includes('*')).length > 1) fail('only one group may use *');

  return groups;
}

// Every operation in the spec as { path, method, tag }, where tag is its first tag.
function listOperations(spec) {
  const operations = [];
  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    if (pathItem.$ref) fail(`path item $ref not supported: ${path} (inline it first)`);
    for (const method of HTTP_METHODS) {
      if (pathItem[method]) operations.push({ path, method, tag: pathItem[method].tags?.[0] });
    }
  }
  return operations;
}

// Puts each operation in the group that lists its tag, otherwise in the `*` group.
function assignOperationsToGroups(operations, groups) {
  const catchAllGroup = groups.find((g) => g.tags.includes('*'));
  const problems = [];

  for (const operation of operations) {
    const { path, method, tag } = operation;
    const matches = groups.filter((g) => tag !== undefined && g.tags.includes(tag));

    if (matches.length > 1) {
      problems.push(`${method} ${path} (tag ${tag}) is in groups ${matches.map((g) => g.name).join(', ')}`);
    }

    const group = matches[0] ?? catchAllGroup;
    if (group) group.operations.push(operation);
    else problems.push(`${method} ${path} (tag ${tag ?? 'none'}) is in no group; add it or a name=* group`);
  }

  if (problems.length > 0) fail(`cannot assign operations:\n  ${problems.join('\n  ')}`);
}

// A copy of the spec with only this group's operations and the components they reference.
function buildGroupSpec(spec, group) {
  const paths = {};
  for (const { path, method } of group.operations) {
    if (!paths[path]) {
      // Path-level parameters and servers apply to every operation on the path.
      const { parameters, servers } = spec.paths[path];
      paths[path] = {};
      if (parameters) paths[path].parameters = parameters;
      if (servers) paths[path].servers = servers;
    }
    paths[path][method] = spec.paths[path][method];
  }

  const components = collectReferencedComponents(spec, paths, group.name);

  const groupSpec = structuredClone({ ...spec, paths, components });
  delete groupSpec.webhooks;
  collapseNullableTypes(groupSpec);
  return groupSpec;
}

// Follows $refs from the given paths (and from each component they pull in) and returns the
// components needed. Security schemes are always kept.
function collectReferencedComponents(spec, paths, groupName) {
  const components = {};
  if (spec.components?.securitySchemes) components.securitySchemes = spec.components.securitySchemes;

  const pending = [...findLocalRefs(paths)];
  const visited = new Set();

  while (pending.length > 0) {
    const ref = pending.pop();
    if (visited.has(ref)) continue;
    visited.add(ref);

    const [root, section, name, ...rest] = refToPathParts(ref);

    // A ref to another path is fine as long as that path is in this file.
    if (root === 'paths' && getIn({ paths }, [root, section, name, ...rest]) !== undefined) continue;

    // ponytail: only resolves components/<section>/<name>, not deeper ref segments
    const value = spec[root]?.[section]?.[name];
    if (root !== 'components' || value === undefined) fail(`unresolved $ref ${ref} in ${groupName}`);

    components[section] ??= {};
    components[section][name] = value;
    pending.push(...findLocalRefs(value));
  }

  return components;
}

// All "#/..." $ref strings anywhere inside a value.
function findLocalRefs(value, found = new Set()) {
  if (value && typeof value === 'object') {
    if (typeof value.$ref === 'string' && value.$ref.startsWith('#/')) found.add(value.$ref);
    for (const child of Object.values(value)) findLocalRefs(child, found);
  }
  return found;
}

// "#/components/schemas/a~1b" -> ['components', 'schemas', 'a/b'] (JSON Pointer unescaping)
function refToPathParts(ref) {
  return ref
    .slice(2)
    .split('/')
    .map((part) => decodeURIComponent(part).replace(/~1/g, '/').replace(/~0/g, '~'));
}

function getIn(object, keys) {
  return keys.reduce((node, key) => node?.[key], object);
}

// `type: ['string', 'null']` -> `type: 'string'`, recursively. Leaves real multi-type schemas alone.
function collapseNullableTypes(node) {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node.type)) {
    const nonNullTypes = node.type.filter((t) => t !== 'null');
    if (nonNullTypes.length === 1) node.type = nonNullTypes[0];
    else console.warn(`warning: multi-type schema ${JSON.stringify(node.type)} left as is`);
  }

  for (const [key, child] of Object.entries(node)) {
    if (!DATA_KEYS.includes(key)) collapseNullableTypes(child);
  }
}

function serialize(document, extension) {
  return extension === '.json'
    ? JSON.stringify(document, null, 2)
    : yaml.dump(document, { noRefs: true, lineWidth: -1 });
}

main();
