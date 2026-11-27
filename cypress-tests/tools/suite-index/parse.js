const crypto = require("crypto");
const babel = require("@babel/parser");

const BABEL_OPTS = { sourceType: "module", plugins: ["jsx"], errorRecovery: false };
const TAG_RE = { type: /@tjType\s+(.+)/, block: /@tjBlock\s+(\S+)/, usage: /@tjUsage\s+(.+)/, dom: /@tjDom\s+(.+)/ };

function sourceHash(text) {
  return "sha256:" + crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function parse(src, file) {
  try {
    return { ast: babel.parse(src, BABEL_OPTS) };
  } catch (e) {
    return { warning: { file, line: 0, message: `parse-error: ${e.message}` } };
  }
}

// Same value rule as tj-annotations.js: the value ends at the next @ or *.
function readTags(commentText) {
  const grab = (re) => ((commentText.match(re) || [])[1] || "").replace(/\s*[@*].*$/, "").trim();
  const type = grab(TAG_RE.type);
  return { type: type ? type.split(",").map(s => s.trim()) : [], block: grab(TAG_RE.block), usage: grab(TAG_RE.usage), dom: grab(TAG_RE.dom) };
}

function jsdocBefore(node) {
  const docs = (node.leadingComments || []).filter(c => c.type === "CommentBlock" && c.value.startsWith("*"));
  return docs.length ? docs[docs.length - 1].value : "";
}

function signatureOf(src, fn) {
  if (!fn || !fn.params) return "";
  return "(" + fn.params.map(p => src.slice(p.start, p.end)).join(", ") + ")";
}

function isFunction(node) {
  return node && ["ArrowFunctionExpression", "FunctionExpression", "FunctionDeclaration", "ObjectMethod"].includes(node.type);
}

function patternNames(id) {
  if (id.type === "Identifier") return [id.name];
  if (id.type === "ObjectPattern")
    return id.properties.flatMap(p => (p.type === "RestElement" ? patternNames(p.argument) : patternNames(p.value)));
  if (id.type === "ArrayPattern") return id.elements.filter(Boolean).flatMap(patternNames);
  if (id.type === "AssignmentPattern") return patternNames(id.left);
  return [];
}

// Every named export form: function (async, generator), class, let/const/var (including
// destructuring) and `export { a, b as c }` lists. Tags come from the JSDoc above the statement.
function parseHelpers(src, file) {
  const { ast, warning } = parse(src, file);
  if (!ast) return { records: [], warnings: [warning] };
  const locals = new Map();
  for (const stmt of ast.program.body) {
    if ((stmt.type === "FunctionDeclaration" || stmt.type === "ClassDeclaration") && stmt.id)
      locals.set(stmt.id.name, { stmt, fn: stmt.type === "FunctionDeclaration" ? stmt : null, node: stmt });
    if (stmt.type === "VariableDeclaration")
      for (const v of stmt.declarations)
        for (const name of patternNames(v.id)) locals.set(name, { stmt, fn: isFunction(v.init) ? v.init : null, node: v });
  }
  const records = [];
  const have = new Set();
  const add = (name, stmt, fn, node) => {
    if (have.has(name)) return;
    have.add(name);
    records.push({
      kind: "helper", name, file, line: stmt.loc.start.line,
      ...readTags(jsdocBefore(stmt)),
      signature: signatureOf(src, fn),
      hash: sourceHash(src.slice(node.start, node.end)),
    });
  };
  for (const stmt of ast.program.body) {
    if (stmt.type !== "ExportNamedDeclaration" || stmt.source) continue;
    const d = stmt.declaration;
    if (d && (d.type === "FunctionDeclaration" || d.type === "ClassDeclaration") && d.id)
      add(d.id.name, stmt, d.type === "FunctionDeclaration" ? d : null, d);
    else if (d && d.type === "VariableDeclaration")
      for (const v of d.declarations)
        for (const name of patternNames(v.id)) add(name, stmt, v.id.type === "Identifier" && isFunction(v.init) ? v.init : null, v);
    else if (!d)
      for (const sp of stmt.specifiers) {
        const local = locals.get(sp.local.name);
        if (local) add(sp.exported.name || sp.exported.value, local.stmt, local.fn, local.node);
      }
  }
  return { records, warnings: [] };
}

function walk(node, visit) {
  if (!node || typeof node.type !== "string") return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === "leadingComments" || key === "trailingComments" || key === "innerComments" || key === "loc") continue;
    const v = node[key];
    if (Array.isArray(v)) v.forEach(c => walk(c, visit));
    else if (v && typeof v.type === "string") walk(v, visit);
  }
}

function commandCall(expr) {
  if (!expr || expr.type !== "CallExpression") return null;
  const c = expr.callee;
  if (c.type !== "MemberExpression" || c.property.type !== "Identifier") return null;
  if (!["add", "overwrite"].includes(c.property.name)) return null;
  const o = c.object;
  const isCommands = o.type === "MemberExpression" && o.object.type === "Identifier" && o.object.name === "Cypress"
    && o.property.type === "Identifier" && o.property.name === "Commands";
  return isCommands ? c.property.name : null;
}

function parseCommands(src, file) {
  const { ast, warning } = parse(src, file);
  if (!ast) return { records: [], warnings: [warning] };
  const records = [];
  const warnings = [];
  walk(ast.program, (node) => {
    if (node.type !== "ExpressionStatement") return;
    const op = commandCall(node.expression);
    if (!op) return;
    const call = node.expression;
    const line = call.loc.start.line;
    const first = call.arguments[0];
    if (!first || first.type !== "StringLiteral") {
      warnings.push({ file, line, message: "non-literal command name; skipped" });
      return;
    }
    const fn = [...call.arguments].reverse().find(isFunction) || null;
    records.push({
      kind: "command", name: first.value, file, line, overwrite: op === "overwrite",
      ...readTags(jsdocBefore(node)),
      signature: signatureOf(src, fn),
      hash: sourceHash(fn ? src.slice(fn.start, fn.end) : src.slice(call.start, call.end)),
    });
  });
  return { records, warnings };
}

function propKey(prop) {
  if (prop.computed) return null;
  if (prop.key.type === "Identifier") return prop.key.name;
  if (prop.key.type === "StringLiteral") return prop.key.value;
  return null;
}

function parseSelectors(src, file) {
  const { ast, warning } = parse(src, file);
  if (!ast) return { records: [], warnings: [warning] };
  const records = [];
  const warnings = [];
  const flatten = (obj, prefix) => {
    for (const prop of obj.properties) {
      const line = prop.loc.start.line;
      if (prop.type === "SpreadElement") { warnings.push({ file, line, message: `spread in ${prefix}; skipped` }); continue; }
      const key = propKey(prop);
      if (key === null) { warnings.push({ file, line, message: `computed key in ${prefix}; skipped` }); continue; }
      const name = `${prefix}.${key}`;
      const value = prop.type === "ObjectMethod" ? prop : prop.value;
      if (value.type === "ObjectExpression") { flatten(value, name); continue; }
      const fn = isFunction(value) ? value : null;
      const dynamic = !!fn || (value.type === "TemplateLiteral" && value.expressions.length > 0);
      records.push({
        kind: "selector", name, file, line, dynamic,
        params: fn ? fn.params.map(p => src.slice(p.start, p.end)) : [],
        expression: src.slice(value.start, value.end),
      });
    }
  };
  for (const stmt of ast.program.body) {
    if (stmt.type !== "ExportNamedDeclaration" || !stmt.declaration || stmt.declaration.type !== "VariableDeclaration") continue;
    for (const v of stmt.declaration.declarations)
      if (v.id.type === "Identifier" && v.init && v.init.type === "ObjectExpression") flatten(v.init, v.id.name);
  }
  return { records, warnings };
}

module.exports = { parseHelpers, parseCommands, parseSelectors, sourceHash };
