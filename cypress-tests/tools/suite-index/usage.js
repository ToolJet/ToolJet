const fs = require("fs");
const path = require("path");
const babel = require("@babel/parser");
const { SPEC_AREAS } = require("./areas");

function globMatches(glob, file) {
  return glob.endsWith("/**") ? file.startsWith(glob.slice(0, -2)) : file === glob;
}

function areaOfSpec(file) {
  const entry = SPEC_AREAS.find(e => e.specGlobs.some(g => globMatches(g, file)));
  return entry ? entry.area : null;
}

function listSpecs(rootDir, rel = "cypress/e2e") {
  const abs = path.join(rootDir, rel);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap(e => {
    const child = path.posix.join(rel, e.name);
    if (e.isDirectory()) return listSpecs(rootDir, child);
    return e.name.endsWith(".cy.js") ? [child] : [];
  }).sort();
}

function oneLine(text) {
  return text.replace(/\s*\n\s*/g, " ").replace(/\(\s+/g, "(").replace(/,?\s+\)/g, ")").trim();
}

function walk(node, visit) {
  if (!node || typeof node.type !== "string") return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === "loc" || key.endsWith("Comments")) continue;
    const v = node[key];
    if (Array.isArray(v)) v.forEach(c => walk(c, visit));
    else if (v && typeof v.type === "string") walk(v, visit);
  }
}

// Keyed by "helper:<name>" / "command:<name>": which areas' specs call it, and where.
function collectUsage(rootDir, symbols) {
  const helpers = new Set(symbols.filter(s => s.kind === "helper").map(s => s.name));
  const commands = new Set(symbols.filter(s => s.kind === "command").map(s => s.name));
  const usage = new Map();
  const record = (key, area, file, node, src) => {
    if (!usage.has(key)) usage.set(key, { areas: new Set(), sites: [] });
    const u = usage.get(key);
    u.areas.add(area);
    u.sites.push({ file, line: node.loc.start.line, text: oneLine(src.slice(node.start, node.end)) });
  };
  for (const file of listSpecs(rootDir)) {
    const area = areaOfSpec(file);
    if (!area) continue;
    const src = fs.readFileSync(path.join(rootDir, file), "utf8");
    let ast;
    try { ast = babel.parse(src, { sourceType: "module", plugins: ["jsx"] }); } catch { continue; }
    const imported = new Map();
    for (const stmt of ast.program.body)
      if (stmt.type === "ImportDeclaration" && /^Support\//.test(stmt.source.value))
        for (const sp of stmt.specifiers)
          if (sp.type === "ImportSpecifier") imported.set(sp.local.name, sp.imported.name || sp.imported.value);
    walk(ast.program, (n) => {
      if (n.type !== "CallExpression") return;
      const c = n.callee;
      if (c.type === "Identifier" && imported.has(c.name) && helpers.has(imported.get(c.name)))
        record(`helper:${imported.get(c.name)}`, area, file, n, src);
      else if (c.type === "MemberExpression" && c.object.type === "Identifier" && c.object.name === "cy"
        && c.property.type === "Identifier" && commands.has(c.property.name))
        record(`command:${c.property.name}`, area, file, n, src);
    });
  }
  return usage;
}

module.exports = { collectUsage, areaOfSpec, oneLine };
