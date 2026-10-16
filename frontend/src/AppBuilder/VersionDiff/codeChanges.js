// Which changes in a version diff carry code worth reading line by line, and in
// what language. The diff already holds every changed value in full (from/to);
// this only decides what to show and how to highlight it.

// Fields that hold code even when the value is one short line.
const CODE_FIELDS = new Set([
  'code',
  'query',
  'sqlquery',
  'sql',
  'transformation',
  'url',
  'body',
  'json_body',
  'raw_body',
  'headers',
  'url_params',
  'url_parameters',
  'cookies',
  'script',
]);

// Groups whose values are positions or names, never code.
const NOT_CODE = new Set(['layout', 'parent', 'type']);

const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

// Component properties are stored as { value, fxActive }.
const unwrap = (value) => (isPlainObject(value) && 'value' in value ? value.value : value);

const lastKey = (path = '') => path.split('.').pop();

const pretty = (value) => (value === undefined || value === null ? '' : JSON.stringify(value, null, 2));

const hasBinding = (text) => typeof text === 'string' && /\{\{[\s\S]*\}\}/.test(text);

export function languageFor(path, sample, context = {}) {
  const key = lastKey(path).toLowerCase();
  if (/css$/.test(key)) return 'css';
  if (key === 'code') return /python/i.test(context.dataSource ?? '') ? 'python' : 'javascript';
  if (key === 'transformation') return context.transformationLanguage === 'python' ? 'python' : 'javascript';
  if (key === 'query' || key === 'sqlquery' || key === 'sql')
    return /mongo/i.test(context.dataSource ?? '') ? 'json' : 'sql';
  if (context.json) return 'json';
  if (hasBinding(sample)) return 'javascript';
  return 'text';
}

// Inside an object (a ToolJet Database query keeps its SQL in sql_execution.sqlQuery),
// the one string that changed, when exactly one did.
function changedLeaf(a, b, prefix = '') {
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  const found = [];
  for (const key of keys) {
    const x = a?.[key];
    const y = b?.[key];
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    if (isPlainObject(x) || isPlainObject(y)) {
      const inner = changedLeaf(isPlainObject(x) ? x : {}, isPlainObject(y) ? y : {}, `${prefix}${key}.`);
      if (!inner) return null;
      found.push(inner);
    } else if ((x === undefined || typeof x === 'string') && (y === undefined || typeof y === 'string')) {
      found.push({ path: `${prefix}${key}`, before: x ?? '', after: y ?? '' });
    } else return null;
    if (found.length > 1) return null;
  }
  return found[0] ?? null;
}

const looksLikeCode = (key, text) =>
  CODE_FIELDS.has(key) || /css$/.test(key) || text.includes('\n') || hasBinding(text);

/**
 * { before, after, language, field } for a change (or an event diff) whose value
 * is code, or null when the one-line summary already says it all.
 */
export function codeOf(item, context = {}) {
  if (!item) return null;
  if (item.eventId !== undefined && !item.path) {
    const before = pretty(item.from);
    const after = pretty(item.to);
    return before === after ? null : { before, after, language: 'json', field: 'handler' };
  }
  if (NOT_CODE.has(item.group)) return null;
  const field = item.path?.startsWith('options.') ? item.path.slice('options.'.length) : lastKey(item.path);
  const key = lastKey(item.path).toLowerCase();
  const a = unwrap(item.from);
  const b = unwrap(item.to);
  const isText = (value) => value === undefined || value === null || typeof value === 'string';

  if (isText(a) && isText(b)) {
    const before = a ?? '';
    const after = b ?? '';
    if (before === after) return null;
    if (!looksLikeCode(key, before) && !looksLikeCode(key, after)) return null;
    return { before, after, language: languageFor(item.path, after || before, context), field };
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const leaf = changedLeaf(a, b);
    if (leaf && (looksLikeCode(lastKey(leaf.path).toLowerCase(), leaf.before) || looksLikeCode('', leaf.after))) {
      return {
        before: leaf.before,
        after: leaf.after,
        language: languageFor(leaf.path, leaf.after || leaf.before, context),
        field: `${field}.${leaf.path}`,
      };
    }
  }

  const structured = (value) => value !== null && typeof value === 'object';
  if (structured(a) || structured(b)) {
    const before = pretty(a);
    const after = pretty(b);
    if (before === after) return null;
    if (!CODE_FIELDS.has(key) && Math.max(before.length, after.length) <= 60) return null;
    return { before, after, language: 'json', field };
  }
  return null;
}

/**
 * Every change in a diff with code to show, queries first: each with the id the
 * dialog selects it by, the row it belongs to (owner) and a title for the pane.
 */
export function codeEntries(diff) {
  if (!diff) return [];
  const out = [];
  const add = (owner, title, status, items, context) => {
    for (const item of items ?? []) {
      const code = codeOf(item, context);
      if (!code) continue;
      const id = item.path ? `${owner}|${item.path}` : `${owner}|event:${item.key}`;
      out.push({ id, owner, title, status, label: item.label ?? 'Event handler', summary: item.summary, ...code });
    }
  };
  for (const query of diff.queries ?? []) {
    const owner = `query:${query.key}`;
    // A new or removed query carries its options instead of changes: its code against an empty side.
    const whole =
      query.options && (query.status === 'added' || query.status === 'removed')
        ? Object.entries(query.options).map(([key, value]) => ({
            group: 'query',
            path: `options.${key}`,
            label: key,
            from: query.status === 'removed' ? value : undefined,
            to: query.status === 'added' ? value : undefined,
            summary: query.status === 'added' ? `New in this version` : 'Removed',
          }))
        : [];
    const context = { dataSource: query.dataSource, transformationLanguage: query.options?.transformationLanguage };
    add(owner, query.name, query.status, whole, context);
    add(owner, query.name, query.status, query.changes, { dataSource: query.dataSource });
    add(owner, query.name, query.status, query.events);
  }
  add('settings', 'App settings', 'changed', diff.settings);
  for (const page of diff.pages ?? []) {
    add(`page:${page.key}`, page.name, page.status, page.changes);
    add(`page:${page.key}`, page.name, page.status, page.events);
    for (const component of page.components ?? []) {
      add(component.key, component.name, component.status, component.changes);
      add(component.key, component.name, component.status, component.events);
    }
  }
  return out;
}

/**
 * What the right pane opens on its own. With no page to preview: the first changed query, else the
 * first code change in the app settings. With a page, the live preview.
 */
export const autoOpen = (diff, entries) => {
  if (!diff || diff.pages?.length) return { selectedKey: null, codeId: null };
  const query = diff.queries?.[0];
  if (query) return { selectedKey: `query:${query.key}`, codeId: firstCodeOf(`query:${query.key}`, entries) };
  return { selectedKey: null, codeId: entries[0]?.id ?? null };
};

/** A query's first code change, which the change list marks and the query pane scrolls to. */
export const firstCodeOf = (key, entries) =>
  key?.startsWith('query:') ? entries.find((entry) => entry.owner === key)?.id ?? null : null;
