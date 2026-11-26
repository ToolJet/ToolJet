const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const babel = require("@babel/parser");
const { parseHelpers, parseCommands } = require("./parse");

const ALIASES = {
  Support: "cypress/support", Texts: "cypress/constants/texts", Selectors: "cypress/constants/selectors",
  Constants: "cypress/constants", Fixtures: "cypress/fixtures", Plugins: "cypress/plugins",
};
const PREFIX = "cypress-tests/";
const SECRET = [/ghp_[A-Za-z0-9]{20,}/, /github_pat_[A-Za-z0-9_]{20,}/, /AKIA[0-9A-Z]{16}/, /BEGIN (RSA |EC )?PRIVATE KEY/, /x-access-token:[^\s"'@$]{8,}/, /sk-ant-[A-Za-z0-9_-]{20,}/];

const fail = (rule, file, line, message) => ({ rule, file, line, message });
const count = (src, re) => (src.match(re) || []).length;

function parseSrc(src) {
  try { return babel.parse(src, { sourceType: "module", plugins: ["jsx"] }); } catch { return null; }
}

function resolveImport(rootRel, file, source) {
  const head = source.split("/")[0];
  let base = null;
  if (ALIASES[head]) base = path.posix.join(ALIASES[head], source.slice(head.length + 1));
  else if (source.startsWith(".")) base = path.posix.normalize(path.posix.join(path.posix.dirname(file.slice(PREFIX.length)), source));
  return base ? [base, `${base}.js`, `${base}/index.js`] : null;
}

function importKeys(ast) {
  const keys = new Map();
  for (const s of ast.program.body) {
    if (s.type !== "ImportDeclaration") continue;
    for (const sp of s.specifiers)
      if (sp.type === "ImportSpecifier") keys.set(`${s.source.value}#${sp.imported.name || sp.imported.value}`, { source: s.source.value, name: sp.imported.name || sp.imported.value, line: sp.loc.start.line });
  }
  return keys;
}

function checkChange({ file, before, after, exportsOf, existingNames }) {
  const out = [];
  const ast = parseSrc(after);
  if (!ast) return [fail("parse", file, 0, "file does not parse")];
  const prevAst = before ? parseSrc(before) : null;
  const prevImports = prevAst ? importKeys(prevAst) : new Map();
  for (const [key, imp] of importKeys(ast)) {
    if (prevImports.has(key)) continue;
    const candidates = resolveImport(PREFIX, file, imp.source);
    if (!candidates) continue;
    const exported = exportsOf(candidates);
    if (exported && !exported.has(imp.name)) out.push(fail("import", file, imp.line, `${imp.name} is not exported by ${imp.source}`));
  }

  if (/cypress\/(support|commands)\//.test(file)) {
    const prevNames = new Set(before ? [...parseHelpers(before, file).records, ...parseCommands(before, file).records].map(r => `${r.kind}:${r.name}`) : []);
    const now = [...parseHelpers(after, file).records, ...parseCommands(after, file).records];
    for (const r of now) {
      if (prevNames.has(`${r.kind}:${r.name}`) || r.overwrite) continue;
      const missing = [["@tjType", r.type.length], ["@tjBlock", r.block], ["@tjUsage", r.usage]].filter(([, v]) => !v).map(([t]) => t);
      if (missing.length) out.push(fail("untagged", file, r.line, `${r.name} lacks ${missing.join(", ")}`));
      if (existingNames.has(r.name)) out.push(fail("dup-name", file, r.line, `${r.name} already exists elsewhere`));
    }
  }

  const lines = after.split("\n");
  const prevLines = before.split("\n");
  const bannedRes = [[/\b(it|describe)\.only\(/, "it.only"], [/\bcy\.wait\(\s*\d+/, "cy.wait(<number>)"]];
  for (const [re, label] of bannedRes) {
    const was = prevLines.filter(l => re.test(l)).length;
    const hits = lines.map((l, i) => (re.test(l) ? i + 1 : 0)).filter(Boolean);
    if (hits.length > was) hits.slice(was).forEach(n => out.push(fail("banned", file, n, `${label} added`)));
  }
  return out;
}

const IT = /(^|[^\w.])it\(/gm;
const SKIP = /\bit\.skip\(/g;

function checkAll(changes, ctx) {
  const out = changes.flatMap(c => checkChange({ ...c, ...ctx }));
  const specs = changes.filter(c => /\.cy\.js$|\.skip\.js$/.test(c.file) || /cypress\/e2e\//.test(c.file));
  const was = specs.reduce((n, c) => n + count(c.before, IT), 0);
  const now = specs.reduce((n, c) => n + count(c.after, IT), 0);
  const skipWas = specs.reduce((n, c) => n + count(c.before, SKIP), 0);
  const skipNow = specs.reduce((n, c) => n + count(c.after, SKIP), 0);
  if (now < was || skipNow > skipWas) out.push(fail("it-count", "", 0, `it() blocks ${was} -> ${now}, it.skip ${skipWas} -> ${skipNow}`));
  return out;
}

function scopeCheck(files) {
  return files.filter(f => !f.startsWith(PREFIX)).map(f => fail("scope", f, 0, "outside cypress-tests/"));
}

function exposureCheck(file, added) {
  const out = [];
  added.split("\n").forEach((l, i) => { if (SECRET.some(re => re.test(l))) out.push(fail("exposure", file, i + 1, "secret-shaped text")); });
  return out;
}

function git(root, ...args) {
  const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : null;
}

function run(root, baseRef) {
  const top = git(root, "rev-parse", "--show-toplevel").trim();
  const base = git(top, "merge-base", "HEAD", baseRef).trim();
  const files = git(top, "diff", "--name-only", `${base}...HEAD`).split("\n").filter(Boolean);
  const out = scopeCheck(files);
  const cyFiles = files.filter(f => f.startsWith(PREFIX + "cypress/") && f.endsWith(".js"));
  const changes = cyFiles.map(f => ({
    file: f,
    before: git(top, "show", `${base}:${f}`) || "",
    after: fs.existsSync(path.join(top, f)) ? fs.readFileSync(path.join(top, f), "utf8") : "",
  }));
  const cache = new Map();
  const exportsOf = (cands) => {
    for (const c of cands) {
      const abs = path.join(top, PREFIX, c);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
      if (!cache.has(abs)) cache.set(abs, new Set(parseHelpers(fs.readFileSync(abs, "utf8"), c).records.map(r => r.name)));
      return cache.get(abs);
    }
    return null;
  };
  const { collectSymbols } = require("./generate");
  const owners = new Map();
  for (const s of collectSymbols(path.join(top, "cypress-tests")).symbols.filter(s => s.kind !== "selector"))
    owners.set(s.name, [...(owners.get(s.name) || []), PREFIX + s.file]);
  out.push(...checkAll(changes, { exportsOf, existingNames: filterNames(owners, changes) }));
  for (const c of changes) {
    const prev = new Set(c.before.split("\n"));
    out.push(...exposureCheck(c.file, c.after.split("\n").filter(l => !prev.has(l)).join("\n")));
  }
  return out;
}

// A new helper collides when the same name is exported by a file this change did not add it to.
function filterNames(owners, changes) {
  const names = new Set();
  const addedIn = new Map(changes.map(c => [c.file, c]));
  for (const [name, files] of owners) {
    const elsewhere = files.filter(f => !addedIn.has(f) || (addedIn.get(f).before || "").includes(name));
    if (elsewhere.length) names.add(name);
  }
  return names;
}

if (require.main === module) {
  const i = process.argv.indexOf("--base");
  const base = i === -1 ? "origin/lts-3.21" : process.argv[i + 1];
  const results = run(process.cwd(), base);
  if (!results.length) { console.log("PASS spec-check"); process.exit(0); }
  results.forEach(r => console.log(`FAIL ${r.rule} ${r.file}${r.line ? ":" + r.line : ""} ${r.message}`));
  process.exit(1);
}

module.exports = { checkChange, checkAll, scopeCheck, exposureCheck, run };
