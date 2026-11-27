/**
 * Variable definitions: app and page variables a builder declares in the Variables panel.
 *
 * Saved maps are keyed by variable name: `globalSettings.variables` (app) and `page.variables`
 * (that page), each `{ [name]: { value, fxActive } }`. A variable is identified by its scope and
 * name (plus the page or module that owns the map); there is no separate definition id. `value` is
 * the text the builder typed — a static value (number, boolean, null, JSON or plain string) or a
 * `{{ }}` expression. Expressions are evaluated on load and again whenever anything they read changes.
 *
 * In memory a definition is `{ scope, name, value, fxActive }` (see `definitionsOf`).
 *
 * Everything here is pure, so the panel (validation, preview) and the store (init order, cycle
 * guard) share one implementation.
 */
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
// Names that can't be declared. Keep in step with the other copy (frontend _utils/variableDefinitions.js
// and server helpers/variable-definition-map.helper.ts).
const BLOCKED_NAMES = new Set([
  'prototype',
  // Inherited by every plain object, so `variables.<name>` already resolves to one of these:
  // `__proto__` changes the prototype when assigned, and the rest are Object.prototype methods
  // (`variables.toString` is a function until a variable with that name is set).
  '__proto__',
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

export const VARIABLE_SCOPES = { APP: 'app', PAGE: 'page' };

/** The key that identifies a variable within one page/module context: app and page names may repeat. */
export const variableKey = (scope, name) => `${scope}:${name}`;

const isUsableName = (name) => typeof name === 'string' && IDENTIFIER.test(name) && !BLOCKED_NAMES.has(name);

/**
 * A saved definition in its stored shape. The app payload snake-cases keys nested inside
 * global_settings, so an older fx flag can come back as `fx_active`; both spellings are accepted.
 */
export function normalizeVariableDefinition(raw = {}) {
  return {
    value: raw.value === undefined || raw.value === null ? '' : String(raw.value),
    fxActive: Boolean(raw.fxActive ?? raw.fx_active),
  };
}

const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Reads a saved definition map into `{ [name]: { value, fxActive } }`. Saved maps come from the
 * API, so a malformed entry is skipped rather than allowed to stop the editor loading.
 *
 * Development data saved before definitions were keyed by name is `{ [id]: { id, name, ... } }`;
 * such an entry is read under its `name`. Two of those with the same name can't both be kept, so
 * the first wins and the name is reported in `duplicates` for the caller to surface.
 */
export function readVariableDefinitionMap(map) {
  const definitions = {};
  const duplicates = [];
  if (!isPlainObject(map)) return { definitions, duplicates };
  Object.entries(map).forEach(([key, raw]) => {
    if (!isPlainObject(raw)) return;
    const isIdKeyed = typeof raw.id === 'string' && typeof raw.name === 'string';
    const name = isIdKeyed ? raw.name : key;
    if (!isUsableName(name)) return;
    if (Object.prototype.hasOwnProperty.call(definitions, name)) {
      if (!duplicates.includes(name)) duplicates.push(name);
      return;
    }
    definitions[name] = normalizeVariableDefinition(raw);
  });
  return { definitions, duplicates };
}

/** A saved definition map as `{ [name]: { value, fxActive } }`; see `readVariableDefinitionMap`. */
export const normalizeVariableDefinitionMap = (map) => readVariableDefinitionMap(map).definitions;

/** A saved map as a list of in-memory definitions: `{ scope, name, value, fxActive }`. */
export const definitionsOf = (map, scope) =>
  Object.entries(normalizeVariableDefinitionMap(map)).map(([name, definition]) => ({ scope, name, ...definition }));

/** `selfName` is the variable being renamed, which can keep its own name. */
export function validateVariableName(rawName, scope, definitions = [], selfName = null, pageName = '') {
  const name = String(rawName ?? '');
  if (!name.trim()) return 'Enter a name.';
  if (/^\d/.test(name)) {
    const suggestion = name.replace(/^\d+/, '');
    return suggestion
      ? `Names can’t start with a number. Try “${suggestion}” or prefix it with a letter.`
      : 'Names can’t start with a number. Prefix it with a letter.';
  }
  if (!IDENTIFIER.test(name)) return 'Use letters, numbers, _ or $ only, with no spaces, dots or dashes.';
  if (BLOCKED_NAMES.has(name)) return `“${name}” can’t be used as a variable name. Pick another name.`;
  const clash = name !== selfName && definitions.find((d) => d.scope === scope && d.name === name);
  if (clash) {
    const where = scope === VARIABLE_SCOPES.PAGE && pageName ? ` on ${pageName}` : '';
    return `${scope === VARIABLE_SCOPES.APP ? 'An app' : 'A page'} variable named “${name}” already exists${where}. Names must be unique within their scope.`;
  }
  return null;
}

export function parseStaticValue(text) {
  const raw = String(text ?? '');
  const t = raw.trim();
  if (t === '') return { ok: true, value: '' };
  // A leading zero (02134, 007) marks an identifier such as a ZIP code, so it stays text.
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(t)) return { ok: true, value: Number(t) };
  if (t === 'true' || t === 'false') return { ok: true, value: t === 'true' };
  if (t === 'null') return { ok: true, value: null };
  // Quote a value to keep it a string: "true", "5".
  if (/^[[{"]/.test(t)) {
    try {
      return { ok: true, value: JSON.parse(t) };
    } catch {
      return { ok: false, error: 'Not valid JSON. Use double quotes around keys and strings.' };
    }
  }
  return { ok: true, value: raw };
}

export function isExpressionValue({ value, fxActive } = {}) {
  if (fxActive) return true;
  const text = String(value ?? '');
  return text.includes('{{') && text.includes('}}');
}

/** The expression text to resolve: fx values typed without braces are wrapped. */
export function toExpression({ value } = {}) {
  const text = String(value ?? '').trim();
  if (text.includes('{{') && text.includes('}}')) return text;
  return `{{${text}}}`;
}

/** App and page variables an expression reads, in first-seen order. Static values read nothing. */
export function getVariableRefs(value) {
  const text = String(value ?? '');
  if (!text.includes('{{')) return [];
  const { allRefs } = extractAndReplaceReferencesFromString(text);
  const seen = new Set();
  const refs = [];
  allRefs.forEach(({ entityType, entityNameOrId, entityKey }) => {
    let scope = null;
    if (entityType === 'variables') scope = VARIABLE_SCOPES.APP;
    else if (entityType === 'page' && entityNameOrId === 'variables') scope = VARIABLE_SCOPES.PAGE;
    if (!scope || !entityKey) return;
    const key = `${scope}:${entityKey}`;
    if (seen.has(key)) return;
    seen.add(key);
    refs.push({ scope, name: entityKey });
  });
  return refs;
}

const labelOf = (def) => (def.scope === VARIABLE_SCOPES.PAGE ? `page.${def.name}` : def.name);

function buildEdges(definitions) {
  const byKey = new Map(definitions.map((d) => [variableKey(d.scope, d.name), d]));
  const edges = new Map();
  definitions.forEach((d) => {
    const deps = isExpressionValue(d)
      ? getVariableRefs(toExpression(d))
          .map((r) => byKey.get(variableKey(r.scope, r.name)))
          .filter(Boolean)
      : [];
    edges.set(d, deps);
  });
  return edges;
}

/**
 * First circular reference between declared variables, as a label path that ends where it
 * started (`['a', 'b', 'a']`; page variables are labelled `page.<name>`), or null.
 */
export function findVariableCycle(definitions = []) {
  const edges = buildEdges(definitions);
  const state = new Map(); // undefined = unvisited, 1 = on stack, 2 = done
  const stack = [];

  const visit = (def) => {
    state.set(def, 1);
    stack.push(def);
    for (const dep of edges.get(def)) {
      if (state.get(dep) === 1) {
        const start = stack.indexOf(dep);
        return [...stack.slice(start), dep].map(labelOf);
      }
      if (!state.get(dep)) {
        const found = visit(dep);
        if (found) return found;
      }
    }
    stack.pop();
    state.set(def, 2);
    return null;
  };

  for (const def of definitions) {
    if (!state.get(def)) {
      const found = visit(def);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Evaluation order for load: every variable after the variables it reads. Variables in a cycle,
 * or that read one, can't be evaluated safely and come back in `cyclic` instead.
 */
export function orderVariableDefinitions(definitions = []) {
  const edges = buildEdges(definitions);
  const ordered = [];
  const cyclic = new Set();
  const state = new Map();

  const visit = (def, path) => {
    if (state.get(def) === 2) return !cyclic.has(def);
    if (state.get(def) === 1) {
      path.slice(path.indexOf(def)).forEach((d) => cyclic.add(d));
      return false;
    }
    state.set(def, 1);
    path.push(def);
    let ok = true;
    for (const dep of edges.get(def)) {
      if (!visit(dep, path)) ok = false;
    }
    path.pop();
    state.set(def, 2);
    if (ok && !cyclic.has(def)) ordered.push(def);
    else cyclic.add(def);
    return ok && !cyclic.has(def);
  };

  definitions.forEach((d) => visit(d, []));
  return { ordered, cyclic: definitions.filter((d) => cyclic.has(d)) };
}
