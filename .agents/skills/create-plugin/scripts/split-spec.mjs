// Split an OpenAPI spec into self-contained files for @spec/<id>/<name>.
// Run from marketplace/ (js-yaml comes from its devDependencies):
//   node ../.agents/skills/create-plugin/scripts/split-spec.mjs <spec> <out-dir> [name=TagA,TagB ...] [rest=*]
// No groups: one file per first tag. `*` takes every operation no earlier group took.
// Each file keeps only the components its operations reference. Fails if any operation is left over.
// Also collapses 3.1 `type: [X, "null"]` to `type: X`: the api-endpoint widget expects a string.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { extname, join } from 'path';

const yaml = createRequire(join(process.cwd(), 'noop.js'))('js-yaml');
const [specPath, outDir, ...groupArgs] = process.argv.slice(2);
if (!specPath || !outDir) {
  console.error('usage: split-spec.mjs <spec> <out-dir> [name=TagA,TagB ...] [rest=*]');
  process.exit(1);
}
const ext = extname(specPath) === '.json' ? '.json' : '.yaml';
const spec = yaml.load(readFileSync(specPath, 'utf8'));
const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const keyOf = (path, op) => op.tags?.[0] ?? path.split('/').filter(Boolean)[0] ?? 'root';

const ops = Object.entries(spec.paths ?? {}).flatMap(([path, item]) =>
  METHODS.filter((m) => item[m]).map((method) => ({ path, method, key: keyOf(path, item[method]) }))
);
const groups = groupArgs.length
  ? groupArgs.map((a) => ({ name: a.split('=')[0], keys: a.split('=')[1].split(',') }))
  : [...new Set(ops.map((o) => o.key))].map((k) => ({ name: slug(k), keys: [k] }));
const taken = new Set();
for (const g of groups) {
  g.ops = ops.filter((o) => !taken.has(o) && (g.keys.includes('*') || g.keys.includes(o.key)));
  g.ops.forEach((o) => taken.add(o));
}
const left = ops.filter((o) => !taken.has(o));
if (left.length) {
  console.error(`unassigned operations (add a group or rest=*): ${[...new Set(left.map((o) => o.key))].join(', ')}`);
  process.exit(1);
}

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
const fixTypes = (node) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node.type)) {
    const real = node.type.filter((t) => t !== 'null');
    if (real.length === 1) node.type = real[0];
    else console.warn(`warning: multi-type schema ${JSON.stringify(node.type)} left as is`);
  }
  Object.values(node).forEach(fixTypes);
};

mkdirSync(outDir, { recursive: true });
for (const g of groups.filter((x) => x.ops.length)) {
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
    const value = spec[root]?.[section]?.[name];
    if (root !== 'components' || value === undefined) throw new Error(`unresolved $ref ${ref} in ${g.name}`);
    (components[section] ??= {})[name] = value;
    pending.push(...refsIn(value));
  }
  const out = structuredClone({ ...spec, paths, components });
  delete out.webhooks;
  fixTypes(out);
  const file = join(outDir, `${g.name}${ext}`);
  writeFileSync(file, ext === '.json' ? JSON.stringify(out, null, 2) : yaml.dump(out, { noRefs: true, lineWidth: -1 }));
  console.log(`${file}: ${g.ops.length} operations`);
}
console.log(`total ${ops.length} operations`);
