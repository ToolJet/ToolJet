/**
 * Variable definitions: app and page variables a builder declares in the Variables panel.
 *
 * A definition is `{ id, scope: 'app' | 'page', name, value, fxActive }`. `value` is the text the
 * builder typed — a static value (number, boolean, null, JSON or plain string) or a `{{ }}`
 * expression. Expressions are evaluated on load and again whenever anything they read changes.
 *
 * Everything here is pure, so the panel (validation, preview) and the store (init order, cycle
 * guard) share one implementation.
 */
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
// Special on plain objects: assigning variables['__proto__'] changes the prototype instead of storing a value.
const BLOCKED_NAMES = new Set(['__proto__', 'constructor', 'prototype']);

export const VARIABLE_SCOPES = { APP: 'app', PAGE: 'page' };

/**
 * A saved definition in its canonical shape. The app payload snake-cases keys nested inside
 * global_settings, so an app variable comes back as `fx_active`; both spellings are accepted.
 */
export function normalizeVariableDefinition(raw = {}) {
  return {
    id: raw.id,
    name: raw.name ?? '',
    value: raw.value === undefined || raw.value === null ? '' : String(raw.value),
    fxActive: Boolean(raw.fxActive ?? raw.fx_active),
  };
}

/** A definition map (`{ [id]: definition }`) with every entry normalized. */
export const normalizeVariableDefinitionMap = (map) =>
  Object.fromEntries(Object.values(map || {}).map((d) => [d.id, normalizeVariableDefinition(d)]));

export function validateVariableName(rawName, scope, definitions = [], selfId = null, pageName = '') {
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
  const clash = definitions.find((d) => d.id !== selfId && d.scope === scope && d.name === name);
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
  if (/^-?\d+(\.\d+)?$/.test(t)) return { ok: true, value: Number(t) };
  if (t === 'true' || t === 'false') return { ok: true, value: t === 'true' };
  if (t === 'null') return { ok: true, value: null };
  if (/^[[{]/.test(t)) {
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

const keyOf = (scope, name) => `${scope}:${name}`;
const labelOf = (def) => (def.scope === VARIABLE_SCOPES.PAGE ? `page.${def.name}` : def.name);

function buildEdges(definitions) {
  const byKey = new Map(definitions.map((d) => [keyOf(d.scope, d.name), d]));
  const edges = new Map();
  definitions.forEach((d) => {
    const deps = isExpressionValue(d)
      ? getVariableRefs(toExpression(d))
          .map((r) => byKey.get(keyOf(r.scope, r.name)))
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
