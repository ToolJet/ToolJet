// Split an OpenAPI spec into self-contained files for @spec/<id>/<name>.
// Run from marketplace/ after `npm install` there (js-yaml is hoisted into its node_modules by eslint):
//   node ../.agents/skills/create-plugin/scripts/split-spec.mjs <spec> <out-dir> name=TagA,TagB [name=* ...]
// Groups are explicit; `*` takes every operation no named group lists (at most one `*` group).
// Each file keeps only the components its operations reference. Nothing is written unless all checks pass.
// Also collapses 3.1 `type: [X, "null"]` to `type: X`: the api-endpoint widget expects a string.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { extname, join } from 'path';

const USAGE = 'usage: split-spec.mjs <spec> <out-dir> name=TagA,TagB [name=* ...]';
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};
const yaml = createRequire(join(process.cwd(), 'noop.js'))('js-yaml');
const [specPath, outDir, ...groupArgs] = process.argv.slice(2);
if (!specPath || !outDir || !groupArgs.length || groupArgs.some((a) => !a.includes('='))) fail(USAGE);
const ext = extname(specPath) === '.json' ? '.json' : '.yaml';
const spec = yaml.load(readFileSync(specPath, 'utf8'));
const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

const ops = Object.entries(spec.paths ?? {}).flatMap(([path, item]) => {
  if (item.$ref) fail(`path item $ref not supported: ${path} (inline it first)`);
  return METHODS.filter((m) => item[m]).map((method) => ({ path, method, tag: item[method].tags?.[0] }));
});
const groups = groupArgs.map((a) => {
  const [name, keys] = [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)];
  return { name, keys: keys.split(',') };
});
const names = groups.map((g) => g.name);
if (new Set(names).size !== names.length) fail(`duplicate group names: ${names.join(', ')}`);
if (groups.filter((g) => g.keys.includes('*')).length > 1) fail('only one group may use *');

// Each operation goes to exactly one group: a named tag match, else the `*` group.
const restGroup = groups.find((g) => g.keys.includes('*'));
for (const g of groups) g.ops = [];
const problems = [];
for (const o of ops) {
  const hits = groups.filter((g) => o.tag !== undefined && g.keys.includes(o.tag));
  if (hits.length > 1)
    problems.push(`${o.method} ${o.path} (tag ${o.tag}) is in groups ${hits.map((g) => g.name).join(', ')}`);
  const owner = hits[0] ?? restGroup;
  if (owner) owner.ops.push(o);
  else problems.push(`${o.method} ${o.path} (tag ${o.tag ?? 'none'}) is in no group; add it or a name=* group`);
}
if (problems.length) fail(`cannot assign operations:\n  ${problems.join('\n  ')}`);

const refsIn = (node, out = new Set()) => {
  if (node && typeof node === 'object') {
    if (typeof node.$ref === 'string' && node.$ref.startsWith('#/')) out.add(node.$ref);
    Object.values(node).forEach((v) => refsIn(v, out));
  }
  return out;
};
const lookup = (ref) =>
  ref
    .slice(2)
    .split('/')
    .map((p) => decodeURIComponent(p).replace(/~1/g, '/').replace(/~0/g, '~'));
const resolve = (doc, parts) => parts.reduce((node, p) => node?.[p], doc);
// example-like values are data, not schemas
const DATA_KEYS = ['example', 'examples', 'default', 'enum'];
const fixTypes = (node) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node.type)) {
    const real = node.type.filter((t) => t !== 'null');
    if (real.length === 1) node.type = real[0];
    else console.warn(`warning: multi-type schema ${JSON.stringify(node.type)} left as is`);
  }
  for (const [k, v] of Object.entries(node)) if (!DATA_KEYS.includes(k)) fixTypes(v);
};

const files = groups
  .filter((g) => g.ops.length)
  .map((g) => {
    const paths = {};
    for (const { path, method } of g.ops) {
      const { parameters, servers } = spec.paths[path];
      paths[path] ??= { ...(parameters && { parameters }), ...(servers && { servers }) };
      paths[path][method] = spec.paths[path][method];
    }
    const schemes = spec.components?.securitySchemes;
    const components = schemes ? { securitySchemes: schemes } : {};
    const pending = [...refsIn(paths)];
    const seen = new Set();
    while (pending.length) {
      const ref = pending.pop();
      if (seen.has(ref)) continue;
      seen.add(ref);
      const parts = lookup(ref);
      const [root, section, name] = parts;
      // refs into paths must stay inside this file
      if (root === 'paths' && resolve({ paths }, parts) !== undefined) continue;
      // ponytail: checks only components/<section>/<name>, not deeper ref segments
      const value = spec[root]?.[section]?.[name];
      if (root !== 'components' || value === undefined) fail(`unresolved $ref ${ref} in ${g.name}`);
      (components[section] ??= {})[name] = value;
      pending.push(...refsIn(value));
    }
    const out = structuredClone({ ...spec, paths, components });
    delete out.webhooks;
    fixTypes(out);
    const body = ext === '.json' ? JSON.stringify(out, null, 2) : yaml.dump(out, { noRefs: true, lineWidth: -1 });
    return { file: join(outDir, `${g.name}${ext}`), body, count: g.ops.length };
  });

mkdirSync(outDir, { recursive: true });
for (const { file, body, count } of files) {
  writeFileSync(file, body);
  console.log(`${file}: ${count} operations`);
}
console.log(`total ${ops.length} operations`);
