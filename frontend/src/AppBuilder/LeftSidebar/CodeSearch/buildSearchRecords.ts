// Flattens the saved app definition into one searchable row per text field.
// Pure: no store access, so it can move into a Web Worker unchanged. Reads the saved definition
// only — never resolved state — so `{{secrets.x}}` is indexed as written, never as its value.

export type EntityType = 'component' | 'query' | 'event' | 'page' | 'app';

// One thing navigation asks the editor to open; see useCodeSearchReveal.
export interface RevealStep {
  kind: 'listItem' | 'page' | 'queryTab' | 'queryParam' | 'restTab' | 'popoverTab' | 'event' | 'preloadedScript';
  ownerId: string | null;
  itemId: string;
}

// The saved app definition is untyped store data; it is read defensively throughout.
type Saved = any;

interface RecordBase {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  entitySubtype?: string;
  componentType?: string;
  pageId?: string | null;
  query?: Saved;
  // Events: the component / query / page that owns the handler.
  ownerType?: EntityType;
  ownerId?: string;
  eventId?: string;
  reveal?: RevealStep[];
}

export interface SearchRecord extends RecordBase {
  fieldPath: string[];
  fieldLabel: string;
  shortLabel: string;
  text: string;
}

type Labels = { displayName?: string } & Record<string, Record<string, { displayName: string }> | string | undefined>;

export interface PlainDefs {
  widgetDefs: Record<string, Labels | undefined>;
  actionDefs: { id: string; name: string }[];
  pageSettingsDef: Labels | undefined;
}

// Definitions are read defensively, so raw widget configs work as well as their plain labels.
export interface SearchInput {
  widgetDefs?: Record<string, Saved>;
  actionDefs?: PlainDefs['actionDefs'];
  pageSettingsDef?: Saved;
  pages?: Saved[];
  queries?: Saved[];
  events?: Saved[];
  globalSettings?: Saved;
  pageSettings?: Saved;
  translate?: (text: string) => string;
}

const COMPONENT_SECTIONS = ['properties', 'styles', 'general', 'generalStyles', 'validation', 'others'];
const SECTION_LABELS: Record<string, string> = {
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
const humanize = (key: string): string =>
  String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

// Calls visit(path, value) for every string/number/boolean leaf under `value`.
const walkLeaves = (value: Saved, path: string[], visit: (path: string[], text: string) => void): void => {
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
const NON_WIDGET_EVENT_NAMES: Record<string, string> = {
  onDataQuerySuccess: 'Query Success',
  onDataQueryFailure: 'Query Failure',
  onPageLoad: 'On page load',
};
// Ids are indexed by their display names (Event, Action) below. `component` is the owner's widget
// type, written at creation with no control in the popover.
const EVENT_SKIP_KEYS = new Set(['eventId', 'actionId', 'component']);
// Action params store ids under `queryId`, `componentId`, …; the card labels them `Query`, `Component`.
const stripIdSuffix = (key: string) => String(key).replace(/(.)Id$/, '$1');

// `properties.data.value` is stored as `{ data: { value } }`; the field is `data`. A list item's own
// `value` (`options[0].value`) is a real field, not that wrapper, so it stays.
const stripValueKey = (path: string[]) =>
  path[path.length - 1] === 'value' && !/^\d+$/.test(path[path.length - 2]) ? path.slice(0, -1) : path;

const STYLE_SECTIONS = new Set(['styles', 'generalStyles']);

// Fields the Inspector swaps on a toggle: on → the dynamic code field, off → the static list. Only
// the shown one is indexed, so a column never matches twice (as list rows and as default code).
// Option widgets share one toggle (`advanced`, "Dynamic options").
const dynamicOptions = { toggle: 'advanced', dynamic: 'schema', list: 'options' };
const DYNAMIC_LIST_TOGGLES: Record<string, { toggle: string; dynamic: string; list: string }> = {
  Table: { toggle: 'useDynamicColumn', dynamic: 'columnData', list: 'columns' },
  KeyValuePair: { toggle: 'useDynamicField', dynamic: 'fieldDynamicData', list: 'fields' },
  Tags: { ...dynamicOptions, dynamic: 'data' },
  Steps: { ...dynamicOptions, list: 'steps' },
  DropdownV2: dynamicOptions,
  MultiselectV2: dynamicOptions,
  RadioButtonV2: dynamicOptions,
  TagsInput: dynamicOptions,
  ButtonGroupV2: dynamicOptions,
  PopoverMenu: dynamicOptions,
  ReorderableList: dynamicOptions,
};
// A toggle bound to an expression can't be resolved here; both fields stay indexed then.
const toggleState = (value: Saved): boolean | undefined => {
  if (value === undefined || value === false || /^\{\{\s*false\s*\}\}$/.test(String(value))) return false;
  if (value === true || /^\{\{\s*true\s*\}\}$/.test(String(value))) return true;
  return undefined;
};
const hiddenPropertyOf = (type: string, properties: Saved): string | undefined => {
  const swap = DYNAMIC_LIST_TOGGLES[type];
  if (!swap) return undefined;
  const on = toggleState(properties?.[swap.toggle]?.value);
  return on === undefined ? undefined : on ? swap.list : swap.dynamic;
};

// Short name for a nested settings path: `Page header · Height` rather than five `Page header` rows.
const pathShortLabel = (fieldPath: string[]) =>
  fieldPath.length > 1
    ? `${humanize(fieldPath[0])} · ${humanize(fieldPath[fieldPath.length - 1])}`
    : humanize(fieldPath[0]);

// A key-value row (REST headers, params, cookies, body) is stored as `[key, value]`.
const isKeyValuePair = (item: Saved): boolean =>
  Array.isArray(item) && item.length === 2 && typeof item[0] === 'string';

// A list item's own name (`email` column, `Submit` action, `page` header), or its position when it has none.
const itemName = (item: Saved, index: string): string =>
  [isKeyValuePair(item) ? item[0] : undefined, item?.name, item?.label, item?.title, item?.key, item?.buttonText].find(
    (v) => typeof v === 'string' && v.trim()
  ) ?? `#${Number(index) + 1}`;

// How a list editor finds one of its items: by id, else by the value / title / name it is keyed on,
// else (a Form's field) by the component it renders.
const itemIdentity = (item: Saved): string | undefined => {
  if (!item || typeof item !== 'object') return undefined;
  const identity = [item.id, item.value, item.title, item.name, item.componentId].find((v) => v != null && v !== '');
  return identity === undefined ? undefined : String(identity);
};

// Readable rest of a field path: drops the `value` wrapper and names list items instead of
// numbering them (`Table Columns › email › Name`, not `› Value › 3 › Name`). Also returns the
// identity of each list item on the way down, outermost first, so navigation can open them.
const readableRest = (savedField: Saved, rest: string[], { valueWrapper = true } = {}) => {
  const parts: string[] = [];
  const itemIds: string[] = [];
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
const componentFieldLabels = (widgetDef: Saved, section: string, fieldPath: string[], saved: Saved) => {
  const key = fieldPath[0];
  const name = widgetDef?.[section]?.[key]?.displayName?.trim() || humanize(key);
  const { parts, itemIds } = readableRest(saved?.[key], fieldPath.slice(1));
  const field = [STYLE_SECTIONS.has(section) ? `Style · ${name}` : name, ...parts].join(' › ');
  return {
    full: [SECTION_LABELS[section], name, ...parts].join(' › '),
    short: field,
    itemIds,
  };
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
export const queryTabFor = (record: Pick<SearchRecord, 'entityType' | 'fieldPath'>): string => {
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
const listItemStep = (ownerId: string, itemId: string): RevealStep => ({
  kind: 'listItem',
  ownerId,
  itemId,
});
const pageStep = (pageId: string): RevealStep => ({ kind: 'page', ownerId: null, itemId: pageId });
const queryTabStep = (queryId: string, tab: string): RevealStep => ({
  kind: 'queryTab',
  ownerId: queryId,
  itemId: tab,
});

// Request sub-tabs, by query kind: option key → tab key (REST shows `url_params` as `params` and
// edits the raw body in its Body tab; GraphQL's tabs are keyed by the option name).
const REQUEST_TABS: Record<string, Record<string, string>> = {
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
const queryOptionReveal = (query: Saved, path: string[]): RevealStep[] => {
  const steps = [queryTabStep(query.id, queryTabFor({ entityType: 'query', fieldPath: ['options', ...path] }))];
  const paramName = path[0] === 'parameters' ? query.options.parameters?.[path[1]]?.name : undefined;
  if (paramName)
    steps.push({
      kind: 'queryParam',
      ownerId: query.id,
      itemId: String(paramName),
    });
  const tab = REQUEST_TABS[query.kind]?.[path[0]];
  if (tab) steps.push({ kind: 'restTab', ownerId: query.id, itemId: tab });
  return steps;
};

const componentFieldReveal = (
  componentId: string,
  type: string,
  section: string,
  fieldPath: string[],
  itemIds: string[]
): RevealStep[] => {
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
const eventReveal = (event: Saved, columnsOf: (componentId: string) => Saved[]): RevealStep[] => {
  const { sourceId, target } = event;
  const ref = event.event?.ref;
  const handler: RevealStep = { kind: 'event', ownerId: sourceId, itemId: event.id };
  if (target === 'data_query') return [queryTabStep(sourceId, 'settings'), handler];
  if (target === 'page') return [pageStep(sourceId), handler];
  if (target === 'table_column') {
    const [columnRef, buttonId] = String(ref ?? '').split('::');
    const column = columnsOf(sourceId).find((c) => c?.name === columnRef || c?.key === columnRef);
    const steps = column?.id != null ? [listItemStep(sourceId, String(column.id))] : [];
    // A button column's button opens inside its column's popover, and lists its own handlers.
    if (buttonId) steps.push(listItemStep(sourceId, buttonId));
    return [...steps, handler];
  }
  if (ref) return [listItemStep(sourceId, String(ref)), handler];
  return [handler];
};

// A widget config (or the page settings config) keeps only its display labels: `displayName` and
// `<section>.<key>.displayName` (sections include `events`). Configs also hold functions and JSX,
// which can't be posted to the search worker.
const plainLabels = (def: Saved): Labels | undefined => {
  if (!def || typeof def !== 'object') return undefined;
  const plain: Labels = typeof def.displayName === 'string' ? { displayName: def.displayName } : {};
  for (const [section, fields] of Object.entries(def)) {
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) continue;
    const labels = Object.entries(fields).filter(
      ([, field]: [string, Saved]) => typeof field?.displayName === 'string'
    );
    if (labels.length)
      plain[section] = Object.fromEntries(labels.map(([key, field]) => [key, { displayName: field.displayName }]));
  }
  return plain;
};

// The parts of the editor's definitions buildSearchRecords reads, as plain cloneable data.
export const toPlainDefs = ({
  widgetDefs = {},
  actionDefs = [],
  pageSettingsDef = {},
}: {
  widgetDefs?: Record<string, Saved>;
  actionDefs?: Saved[];
  pageSettingsDef?: Saved;
}): PlainDefs => ({
  widgetDefs: Object.fromEntries(Object.entries(widgetDefs).map(([type, def]) => [type, plainLabels(def)])),
  actionDefs: actionDefs.map(({ id, name }) => ({ id, name })),
  pageSettingsDef: plainLabels(pageSettingsDef),
});

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
}: SearchInput): SearchRecord[] => {
  const idNames: Record<string, string> = {};
  for (const page of pages) {
    idNames[page.id] = page.name;
    for (const [id, { component } = {}] of Object.entries<Saved>(page.components || {})) idNames[id] = component?.name;
  }
  for (const query of queries) idNames[query.id] = query.name;

  const records: SearchRecord[] = [];
  // Owner lookup for events: an event's sourceId is a component, query or page id.
  const owners = new Map<string, RecordBase>();
  const savedColumns = new Map<string, Saved[]>();
  const columnsOf = (componentId: string) => savedColumns.get(componentId) || [];
  const push = (base: RecordBase, fieldPath: string[], fieldLabel: string, value: string, shortLabel = fieldLabel) => {
    records.push({
      ...base,
      fieldPath,
      fieldLabel,
      shortLabel,
      text: translate(value),
    });
  };

  for (const page of pages) {
    const pageBase: RecordBase = {
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

    for (const [componentId, { component } = {}] of Object.entries<Saved>(page.components || {})) {
      if (!component) continue;
      const type = component.component;
      const widgetDef = widgetDefs[type];
      const base: RecordBase = {
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
      const hiddenProperty = hiddenPropertyOf(type, component.definition?.properties);
      for (const section of COMPONENT_SECTIONS) {
        const saved = component.definition?.[section];
        walkLeaves(saved, [], (path, text) => {
          const fieldPath = stripValueKey(path);
          if (fieldPath.length === 0) return;
          if (section === 'properties' && fieldPath[0] === hiddenProperty) return;
          const labels = componentFieldLabels(widgetDef, section, fieldPath, saved);
          const reveal = componentFieldReveal(componentId, type, section, fieldPath, labels.itemIds);
          push(reveal.length ? { ...base, reveal } : base, [section, ...fieldPath], labels.full, text, labels.short);
        });
      }
    }
  }

  for (const query of queries) {
    const base: RecordBase = {
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
      const { parts } = readableRest(query.options[path[0]], path.slice(1), {
        valueWrapper: false,
      });
      const label = [humanize(path[0]), ...parts].join(' › ');
      push({ ...base, reveal }, ['options', ...path], label, text, label);
    });
  }

  // Handlers sharing a trigger and action on one owner look alike, so those get a suffix.
  const ownedEvents = events.filter((event) => owners.has(event.sourceId));
  const kindOf = (event: Saved) => `${event.sourceId}:${event.event?.eventId}:${event.event?.actionId}`;
  const lookAlikes: Record<string, Saved[]> = {};
  for (const event of ownedEvents) (lookAlikes[kindOf(event)] ||= []).push(event);
  // Told apart by handler name, unless the names repeat too (auto-named handlers): then by position.
  const suffixOf = (event: Saved) => {
    const group = lookAlikes[kindOf(event)];
    if (group.length < 2) return '';
    const namesUnique = group.every((other: Saved) => other === event || other.name !== event.name);
    if (event.name && namesUnique) return ` (${event.name})`;
    const byIndex = [...group].sort((a: Saved, b: Saved) => (a.index ?? 0) - (b.index ?? 0));
    return ` #${byIndex.indexOf(event) + 1}`;
  };

  for (const event of ownedEvents) {
    const owner = owners.get(event.sourceId) as RecordBase;
    const { eventId, actionId } = event.event || {};
    // Same text the handler card shows: `<trigger> → <action>`.
    const trigger =
      widgetDefs[owner.componentType ?? '']?.events?.[eventId]?.displayName ||
      NON_WIDGET_EVENT_NAMES[eventId] ||
      humanize(eventId || event.name || 'event');
    const action = actionDefs.find((def) => def.id === actionId)?.name;
    const handler = (action ? `${trigger} → ${action}` : trigger) + suffixOf(event);
    const fullPrefix = ['Events', event.name, handler].filter(Boolean).join(' › ');
    const base: RecordBase = {
      ...owner,
      ownerType: owner.entityType,
      ownerId: owner.entityId,
      entityType: 'event',
      eventId: event.id,
      reveal: eventReveal(event, columnsOf),
    };
    if (event.name) push(base, ['name'], `${fullPrefix} › Event name`, event.name, `${handler} › Event name`);
    // The popover's Event and Action dropdowns, as one row titled like the handler card. No short
    // label: the row's text is its title, so the match is marked in place.
    push(base, ['handler'], fullPrefix, handler, '');
    walkLeaves(event.event, [], (path, text) => {
      if (EVENT_SKIP_KEYS.has(path[0])) return;
      // Event actions store bare ids (queryId, componentId): show the name, drop ids of deleted
      // entities. Anywhere else a UUID is text someone typed, and stays as written.
      if (BARE_UUID.test(text)) {
        if (!idNames[text]) return;
        text = idNames[text];
      }
      const field = path.map((key, i) => humanize(i === path.length - 1 ? stripIdSuffix(key) : key)).join(' › ');
      push(base, ['event', ...path], `${fullPrefix} › ${field}`, text, `${handler} › ${field}`);
    });
  }

  // App-wide page navigation settings (header, menu, pill styles); edited in the Pages panel.
  const pageSettingsBase: RecordBase = {
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

  const appBase: RecordBase = {
    entityType: 'app',
    entityId: 'app',
    entityName: 'App',
    entitySubtype: 'Global settings',
    pageId: null,
  };
  const preloaded = globalSettings?.preloadedScript?.javascript;
  if (preloaded) {
    const reveal: RevealStep[] = [{ kind: 'preloadedScript', ownerId: null, itemId: 'javascript' }];
    push({ ...appBase, reveal }, ['preloadedScript', 'javascript'], 'Preloaded JavaScript', preloaded);
  }
  walkLeaves(globalSettings, [], (path, text) => {
    if (GLOBAL_SETTINGS_SKIP_KEYS.has(path[0])) return;
    const fieldPath = stripValueKey(path);
    if (fieldPath.length === 0) return;
    push(appBase, fieldPath, fieldPath.map(humanize).join(' › '), text, pathShortLabel(fieldPath));
  });
  (globalSettings?.libraries?.javascript || []).forEach((library: Saved, index: number) => {
    const value = typeof library === 'string' ? library : library?.url || library?.name;
    if (value) push(appBase, ['libraries', 'javascript', String(index)], 'JavaScript libraries', value);
  });

  return records;
};
