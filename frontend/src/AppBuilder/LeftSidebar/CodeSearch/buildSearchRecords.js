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

// Trigger names for events that don't come from a widget config (query and page handlers).
const NON_WIDGET_EVENT_NAMES = {
  onDataQuerySuccess: 'Query Success',
  onDataQueryFailure: 'Query Failure',
  onPageLoad: 'On page load',
};
// Shown in the handler label instead of indexed as content.
const EVENT_SKIP_KEYS = new Set(['eventId', 'actionId']);
// Action params store ids under `queryId`, `componentId`, …; the card labels them `Query`, `Component`.
const stripIdSuffix = (key) => String(key).replace(/(.)Id$/, '$1');

// `properties.data.value` is stored as `{ data: { value } }`; the field is `data`. A list item's own
// `value` (`options[0].value`) is a real field, not that wrapper, so it stays.
const stripValueKey = (path) =>
  path[path.length - 1] === 'value' && !/^\d+$/.test(path[path.length - 2]) ? path.slice(0, -1) : path;

const STYLE_SECTIONS = new Set(['styles', 'generalStyles']);

// Short name for a nested settings path: `Page header · Height` rather than five `Page header` rows.
const pathShortLabel = (fieldPath) =>
  fieldPath.length > 1
    ? `${humanize(fieldPath[0])} · ${humanize(fieldPath[fieldPath.length - 1])}`
    : humanize(fieldPath[0]);

// A key-value row (REST headers, params, cookies, body) is stored as `[key, value]`.
const isKeyValuePair = (item) => Array.isArray(item) && item.length === 2 && typeof item[0] === 'string';

// A list item's own name (`email` column, `Submit` action, `page` header), or its position when it has none.
const itemName = (item, index) =>
  [isKeyValuePair(item) ? item[0] : undefined, item?.name, item?.label, item?.title, item?.key, item?.buttonText].find(
    (v) => typeof v === 'string' && v.trim()
  ) ?? `#${Number(index) + 1}`;

// How a list editor finds one of its items: by id, else by the value / title / name it is keyed on.
const itemIdentity = (item) => {
  if (!item || typeof item !== 'object') return undefined;
  const identity = [item.id, item.value, item.title, item.name].find((v) => v != null && v !== '');
  return identity === undefined ? undefined : String(identity);
};

// Readable rest of a field path: drops the `value` wrapper and names list items instead of
// numbering them (`Table Columns › email › Name`, not `› Value › 3 › Name`). Also returns the
// identity of each list item on the way down, outermost first, so navigation can open them.
const readableRest = (savedField, rest, { valueWrapper = true } = {}) => {
  const parts = [];
  const itemIds = [];
  let node = savedField;
  rest.forEach((key, i) => {
    const parent = node;
    node = parent?.[key];
    if (isKeyValuePair(parent)) {
      parts.push(String(key) === '0' ? 'Key' : 'Value');
    } else if (Array.isArray(parent)) {
      parts.push(itemName(node, key));
      const identity = itemIdentity(node);
      if (identity !== undefined) itemIds.push(identity);
    } else if (!(valueWrapper && i === 0 && key === 'value')) {
      parts.push(humanize(key));
    }
  });
  return { parts, itemIds };
};

// Full path for the tooltip, short name for the result row (`Disable`, `Style · Box shadow`).
const componentFieldLabels = (widgetDef, section, fieldPath, saved) => {
  const key = fieldPath[0];
  const name = widgetDef?.[section]?.[key]?.displayName?.trim() || humanize(key);
  const { parts, itemIds } = readableRest(saved?.[key], fieldPath.slice(1));
  const field = [STYLE_SECTIONS.has(section) ? `Style · ${name}` : name, ...parts].join(' › ');
  return { full: [SECTION_LABELS[section], name, ...parts].join(' › '), short: field, itemIds };
};

// Query options shown outside the Setup tab (QueryManagerBody renders only the active tab).
const TRANSFORMATION_OPTIONS = new Set([
  'transformation',
  'transformations',
  'transformationLanguage',
  'enableTransformation',
]);
const SETTINGS_OPTIONS = new Set([
  'runOnPageLoad',
  'runOnDependencyChange',
  'requestConfirmation',
  'requestConfirmationFx',
  'confirmationMessage',
  'showSuccessNotification',
  'successMessage',
  'notificationDuration',
  'retry_network_errors',
  'query_timeout',
  'disableQuery',
  'disabledMessage',
  'events',
]);

// The query manager tab a query field (or query event handler) is edited in.
export const queryTabFor = (record) => {
  if (record.entityType === 'event') return 'settings';
  if (record.fieldPath[0] !== 'options') return 'setup';
  if (TRANSFORMATION_OPTIONS.has(record.fieldPath[1])) return 'transformation';
  if (SETTINGS_OPTIONS.has(record.fieldPath[1])) return 'settings';
  return 'setup';
};

// Column fields edited on the column popover's Styles tab (Table/ColumnManager/StylesTabElements).
const TABLE_COLUMN_STYLE_KEYS = new Set([
  'horizontalAlignment',
  'activeColor',
  'borderRadius',
  'objectFit',
  'toggleOnBg',
  'toggleOffBg',
  'textColor',
  'cellBackgroundColor',
  'linkColor',
  'underlineColor',
  'underline',
  'selectedBgColorStars',
  'selectedBgColorHearts',
  'unselectedBgColor',
]);

// Reveal steps: what navigation asks the editor to open, outermost first, so the match is on screen.
// Each is consumed by the component that shows it (see useCodeSearchReveal).
const listItemStep = (ownerId, itemId) => ({ kind: 'listItem', ownerId, itemId });
const pageStep = (pageId) => ({ kind: 'page', ownerId: null, itemId: pageId });
const queryTabStep = (queryId, tab) => ({ kind: 'queryTab', ownerId: queryId, itemId: tab });

// Request sub-tabs, by query kind: option key → tab key (REST shows `url_params` as `params` and
// edits the raw body in its Body tab; GraphQL's tabs are keyed by the option name).
const REQUEST_TABS = {
  restapi: {
    headers: 'headers',
    url_params: 'params',
    body: 'body',
    raw_body: 'body',
    json_body: 'body',
    cookies: 'cookies',
  },
  graphql: { headers: 'headers', url_params: 'url_params', cookies: 'cookies' },
};

// Inside the Setup tab: a parameter's popover (`parameters[i]`, by name) or a request sub-tab.
const queryOptionReveal = (query, path) => {
  const steps = [queryTabStep(query.id, queryTabFor({ entityType: 'query', fieldPath: ['options', ...path] }))];
  const paramName = path[0] === 'parameters' ? query.options.parameters?.[path[1]]?.name : undefined;
  if (paramName) steps.push({ kind: 'queryParam', ownerId: query.id, itemId: String(paramName) });
  const tab = REQUEST_TABS[query.kind]?.[path[0]];
  if (tab) steps.push({ kind: 'restTab', ownerId: query.id, itemId: tab });
  return steps;
};

const componentFieldReveal = (componentId, type, section, fieldPath, itemIds) => {
  const steps = itemIds.map((itemId) => listItemStep(componentId, itemId));
  // properties.columns.value[i].<styleKey>
  const isColumnStyle =
    type === 'Table' && section === 'properties' && fieldPath[0] === 'columns' && fieldPath.length === 4;
  if (isColumnStyle && TABLE_COLUMN_STYLE_KEYS.has(fieldPath[3]) && itemIds[0]) {
    steps.push({ kind: 'popoverTab', ownerId: itemIds[0], itemId: 'styles' });
  }
  return steps;
};

// Where a handler's list is shown, from how the handler is stored: a query's Settings tab, a page's
// popover, a Table column's popover (`ref` = column name; `<column>::<buttonId>` for a button in a
// button column), a Table action (`ref` = action name), a Navigation item (`ref` = item id), or the
// component's own Events section.
const eventReveal = (event, columnsOf) => {
  const { sourceId, target } = event;
  const ref = event.event?.ref;
  const handler = { kind: 'event', ownerId: sourceId, itemId: event.id };
  if (target === 'data_query') return [queryTabStep(sourceId, 'settings'), handler];
  if (target === 'page') return [pageStep(sourceId), handler];
  if (target === 'table_column') {
    const [columnRef, buttonId] = String(ref ?? '').split('::');
    const column = columnsOf(sourceId).find((c) => c?.name === columnRef || c?.key === columnRef);
    const steps = column?.id != null ? [listItemStep(sourceId, String(column.id))] : [];
    // ponytail: button-column buttons are not openable yet; the chain stops at their column.
    return buttonId ? steps : [...steps, handler];
  }
  if (ref) return [listItemStep(sourceId, String(ref)), handler];
  return [handler];
};

export const buildSearchRecords = ({
  pages = [],
  queries = [],
  events = [],
  globalSettings = {},
  pageSettings = null,
  translate = (text) => text,
  widgetDefs = {},
  actionDefs = [],
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
  const savedColumns = new Map();
  const columnsOf = (componentId) => savedColumns.get(componentId) || [];
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
      reveal: [pageStep(page.id)],
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
      if (Array.isArray(component.definition?.properties?.columns?.value)) {
        savedColumns.set(componentId, component.definition.properties.columns.value);
      }
      push(base, ['name'], 'Name', component.name);
      for (const section of COMPONENT_SECTIONS) {
        const saved = component.definition?.[section];
        walkLeaves(saved, [], (path, text) => {
          const fieldPath = stripValueKey(path);
          if (fieldPath.length === 0) return;
          const labels = componentFieldLabels(widgetDef, section, fieldPath, saved);
          const reveal = componentFieldReveal(componentId, type, section, fieldPath, labels.itemIds);
          push(reveal.length ? { ...base, reveal } : base, [section, ...fieldPath], labels.full, text, labels.short);
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
    walkLeaves(query.options, [], (path, text) => {
      const reveal = queryOptionReveal(query, path);
      // Query options have no `{ value }` wrapper; list items are named like component lists.
      const { parts } = readableRest(query.options[path[0]], path.slice(1), { valueWrapper: false });
      const label = [humanize(path[0]), ...parts].join(' › ');
      push({ ...base, reveal }, ['options', ...path], label, text, label);
    });
  }

  // Handlers sharing a trigger and action on one owner look alike, so those get a suffix.
  const ownedEvents = events.filter((event) => owners.has(event.sourceId));
  const kindOf = (event) => `${event.sourceId}:${event.event?.eventId}:${event.event?.actionId}`;
  const lookAlikes = {};
  for (const event of ownedEvents) (lookAlikes[kindOf(event)] ||= []).push(event);
  // Told apart by handler name, unless the names repeat too (auto-named handlers): then by position.
  const suffixOf = (event) => {
    const group = lookAlikes[kindOf(event)];
    if (group.length < 2) return '';
    const namesUnique = group.every((other) => other === event || other.name !== event.name);
    if (event.name && namesUnique) return ` (${event.name})`;
    const byIndex = [...group].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    return ` #${byIndex.indexOf(event) + 1}`;
  };

  for (const event of ownedEvents) {
    const owner = owners.get(event.sourceId);
    const { eventId, actionId } = event.event || {};
    // Same text the handler card shows: `<trigger> → <action>`.
    const trigger =
      widgetDefs[owner.componentType]?.events?.[eventId]?.displayName ||
      NON_WIDGET_EVENT_NAMES[eventId] ||
      humanize(eventId || event.name || 'event');
    const action = actionDefs.find((def) => def.id === actionId)?.name;
    const handler = (action ? `${trigger} → ${action}` : trigger) + suffixOf(event);
    const fullPrefix = ['Events', event.name, handler].filter(Boolean).join(' › ');
    const base = {
      ...owner,
      ownerType: owner.entityType,
      ownerId: owner.entityId,
      entityType: 'event',
      eventId: event.id,
      reveal: eventReveal(event, columnsOf),
    };
    if (event.name) push(base, ['name'], `${fullPrefix} › Event name`, event.name, `${handler} › Event name`);
    walkLeaves(event.event, [], (path, text) => {
      if (EVENT_SKIP_KEYS.has(path[0])) return;
      const field = path.map((key, i) => humanize(i === path.length - 1 ? stripIdSuffix(key) : key)).join(' › ');
      push(base, ['event', ...path], `${fullPrefix} › ${field}`, text, `${handler} › ${field}`);
    });
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
    walkLeaves(saved, [], (path, text) => {
      const fieldPath = stripValueKey(path);
      if (fieldPath.length === 0) return;
      const labels = componentFieldLabels(pageSettingsDef, section, fieldPath, saved);
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
  if (preloaded) {
    const reveal = [{ kind: 'preloadedScript', ownerId: null, itemId: 'javascript' }];
    push({ ...appBase, reveal }, ['preloadedScript', 'javascript'], 'Preloaded JavaScript', preloaded);
  }
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
