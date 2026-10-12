// Flattens the saved app definition into one searchable row per text field.
// Pure: no store access, so it can move into a Web Worker unchanged. Reads the saved definition
// only — never resolved state — so `{{secrets.x}}` is indexed as written, never as its value.

const COMPONENT_SECTIONS = ['properties', 'styles', 'general', 'generalStyles', 'validation', 'others'];
const SECTION_LABELS = {
  properties: 'Properties',
  styles: 'Styles',
  general: 'Properties',
  generalStyles: 'Styles',
  validation: 'Validation',
  others: 'Others',
};
// Keys that never hold user-authored text; indexing them only adds noise (ids, grid coordinates).
const SKIP_KEYS = new Set(['layouts', 'id', 'createdAt', 'updatedAt', 'parent', 'fxActive', 'isDefault']);
// Page keys indexed elsewhere (name, handle, components) or that are internal bookkeeping.
const PAGE_SKIP_KEYS = new Set([
  'components',
  'name',
  'handle',
  'appId',
  'pageGroupId',
  'index',
  'permissions',
  'isPageGroup',
]);
// Global settings indexed with their own labels below (preloaded JS, libraries) or not app code at
// all (theme: the workspace design-system palette, dozens of colors that would drown real matches).
const GLOBAL_SETTINGS_SKIP_KEYS = new Set(['preloadedScript', 'libraries', 'theme']);
const BARE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// `onRowClicked` → `On row clicked`, `url_params` → `Url params` (sentence case, like the Inspector).
const humanize = (key) =>
  String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

// Calls visit(path, value) for every string/number/boolean leaf under `value`.
const walkLeaves = (value, path, visit) => {
  if (value === null || value === undefined) return;
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (SKIP_KEYS.has(key)) continue;
      walkLeaves(child, [...path, key], visit);
    }
    return;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value);
    if (text !== '') visit(path, text);
  }
};

// `properties.data.value` is stored as `{ data: { value } }`; the field is `data`.
const stripValueKey = (path) => (path[path.length - 1] === 'value' ? path.slice(0, -1) : path);

const getPath = (object, path) => path.reduce((node, key) => (node == null ? undefined : node[key]), object);

// A value nobody set is noise: every Button would match "Button", every widget its default colors.
// Skip a leaf when the saved entry is flagged `isDefault`, or when it equals the widget config's
// default at the same path (defaults are stored either as `{ value }` or as the bare value).
const isUnchangedDefault = (section, defaults, path, text) => {
  if (getPath(section, [...path.slice(0, -1), 'isDefault']) === true) return true;
  let fallback = getPath(defaults, path);
  if (fallback === undefined && path[path.length - 1] === 'value') fallback = getPath(defaults, path.slice(0, -1));
  if (fallback && typeof fallback === 'object' && 'value' in fallback) fallback = fallback.value;
  return fallback != null && typeof fallback !== 'object' && String(fallback) === text;
};

const STYLE_SECTIONS = new Set(['styles', 'generalStyles']);

// Short name for a nested settings path: `Page header · Height` rather than five `Page header` rows.
const pathShortLabel = (fieldPath) =>
  fieldPath.length > 1
    ? `${humanize(fieldPath[0])} · ${humanize(fieldPath[fieldPath.length - 1])}`
    : humanize(fieldPath[0]);

// Full path for the tooltip, short name for the result row (`Disable`, `Style · Box shadow`).
const componentFieldLabels = (widgetDef, section, fieldPath) => {
  const key = fieldPath[0];
  const name = widgetDef?.[section]?.[key]?.displayName || humanize(key);
  const rest = fieldPath.slice(1).map(humanize);
  return {
    full: [SECTION_LABELS[section], name, ...rest].join(' › '),
    short: STYLE_SECTIONS.has(section) ? `Style · ${name}` : name,
  };
};

export const buildSearchRecords = ({
  pages = [],
  queries = [],
  events = [],
  globalSettings = {},
  pageSettings = null,
  translate = (text) => text,
  widgetDefs = {},
  pageSettingsDef = {},
}) => {
  const idNames = {};
  for (const page of pages) {
    idNames[page.id] = page.name;
    for (const [id, { component } = {}] of Object.entries(page.components || {})) idNames[id] = component?.name;
  }
  for (const query of queries) idNames[query.id] = query.name;

  const records = [];
  // Owner lookup for events: an event's sourceId is a component, query or page id.
  const owners = new Map();
  const push = (base, fieldPath, fieldLabel, value, shortLabel = fieldLabel) => {
    // Event actions store bare ids (queryId, componentId): show the name, drop unknown ids.
    if (BARE_UUID.test(value)) {
      const name = idNames[value];
      if (!name) return;
      value = name;
    }
    records.push({ ...base, fieldPath, fieldLabel, shortLabel, text: translate(value) });
  };

  for (const page of pages) {
    const pageBase = {
      entityType: 'page',
      entityId: page.id,
      entityName: page.name,
      entitySubtype: 'Page',
      pageId: page.id,
    };
    owners.set(page.id, pageBase);
    push(pageBase, ['name'], 'Name', page.name);
    if (page.handle) push(pageBase, ['handle'], 'Handle', page.handle);
    // hidden / disabled conditions, icon, URL, open-in, …
    walkLeaves(page, [], (path, text) => {
      if (PAGE_SKIP_KEYS.has(path[0])) return;
      const fieldPath = stripValueKey(path);
      if (fieldPath.length === 0) return;
      push(pageBase, fieldPath, fieldPath.map(humanize).join(' › '), text, pathShortLabel(fieldPath));
    });

    for (const [componentId, { component } = {}] of Object.entries(page.components || {})) {
      if (!component) continue;
      const type = component.component;
      const widgetDef = widgetDefs[type];
      const base = {
        entityType: 'component',
        entityId: componentId,
        entityName: component.name,
        entitySubtype: widgetDef?.displayName || type,
        componentType: type,
        pageId: page.id,
      };
      owners.set(componentId, base);
      push(base, ['name'], 'Name', component.name);
      for (const section of COMPONENT_SECTIONS) {
        const saved = component.definition?.[section];
        walkLeaves(saved, [], (path, text) => {
          const fieldPath = stripValueKey(path);
          if (fieldPath.length === 0) return;
          if (isUnchangedDefault(saved, widgetDef?.definition?.[section], path, text)) return;
          const labels = componentFieldLabels(widgetDef, section, fieldPath);
          push(base, [section, ...fieldPath], labels.full, text, labels.short);
        });
      }
    }
  }

  for (const query of queries) {
    const base = {
      entityType: 'query',
      entityId: query.id,
      entityName: query.name,
      entitySubtype: query.kind,
      query,
      pageId: null,
    };
    owners.set(query.id, base);
    push(base, ['name'], 'Name', query.name);
    walkLeaves(query.options, [], (path, text) =>
      push(base, ['options', ...path], path.map(humanize).join(' › '), text, humanize(path[0]))
    );
  }

  for (const event of events) {
    const owner = owners.get(event.sourceId);
    if (!owner) continue; // handler whose owner no longer exists
    const eventName = humanize(event.event?.eventId || event.name || 'event');
    const base = {
      ...owner,
      ownerType: owner.entityType,
      ownerId: owner.entityId,
      entityType: 'event',
      eventId: event.id,
    };
    walkLeaves(event.event, [], (path, text) =>
      push(
        base,
        ['event', ...path],
        ['Events', eventName, ...path.map(humanize)].join(' › '),
        text,
        `${eventName} · ${humanize(path[path.length - 1])}`
      )
    );
  }

  // App-wide page navigation settings (header, menu, pill styles); edited in the Pages panel.
  const pageSettingsBase = {
    entityType: 'app',
    entityId: 'pageSettings',
    entityName: 'Pages and navigation',
    entitySubtype: 'Page settings',
    pageId: null,
  };
  for (const section of ['properties', 'styles']) {
    const saved = pageSettings?.definition?.[section];
    // pageConfig.properties holds default values; its styles hold display metadata, so styles rely
    // on the saved `isDefault` flag instead.
    const defaults = section === 'properties' ? pageSettingsDef.properties : undefined;
    walkLeaves(saved, [], (path, text) => {
      const fieldPath = stripValueKey(path);
      if (fieldPath.length === 0) return;
      if (isUnchangedDefault(saved, defaults, path, text)) return;
      const labels = componentFieldLabels(pageSettingsDef, section, fieldPath);
      push(pageSettingsBase, [section, ...fieldPath], labels.full, text, labels.short);
    });
  }

  const appBase = {
    entityType: 'app',
    entityId: 'app',
    entityName: 'App',
    entitySubtype: 'Global settings',
    pageId: null,
  };
  const preloaded = globalSettings?.preloadedScript?.javascript;
  if (preloaded) push(appBase, ['preloadedScript', 'javascript'], 'Preloaded JavaScript', preloaded);
  walkLeaves(globalSettings, [], (path, text) => {
    if (GLOBAL_SETTINGS_SKIP_KEYS.has(path[0])) return;
    const fieldPath = stripValueKey(path);
    if (fieldPath.length === 0) return;
    push(appBase, fieldPath, fieldPath.map(humanize).join(' › '), text, pathShortLabel(fieldPath));
  });
  (globalSettings?.libraries?.javascript || []).forEach((library, index) => {
    const value = typeof library === 'string' ? library : library?.url || library?.name;
    if (value) push(appBase, ['libraries', 'javascript', index], 'JavaScript libraries', value);
  });

  return records;
};
