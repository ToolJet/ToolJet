// Names the UI 2.0 widgets (component types starting with `Shad`) used before their names were settled, and the name
// each one became. This is the server copy of frontend/src/AppBuilder/Widgets/Shadcn/legacyNames.ts: keep the data
// identical. The data migration (data-migrations/*-RenameUi2PackNames.ts) carries its own frozen copy; this one is
// used on import, so an app exported before the rename comes in with the new names.
//
// A rename maps an old name to the name that replaces it; where both names fired or held the same thing, only the
// replacement is left. An exposed value may map to a path ('lastCardMovement.card').

export type Ui2Renames = {
  events?: Record<string, string>;
  actions?: Record<string, string>;
  exposed?: Record<string, string>;
  properties?: Record<string, string>;
};

/** Applies to every UI 2.0 widget type: the older control actions. */
export const UI2_COMMON_RENAMES: Ui2Renames = {
  actions: { visibility: 'setVisibility', disable: 'setDisable', loading: 'setLoading' },
};

const CHART: Ui2Renames = { exposed: { clickedDatum: 'clickedDataPoint' } };
const PICKER: Ui2Renames = { events: { onChange: 'onSelect' }, actions: { clear: 'clearValue' } };

export const UI2_RENAMES: Record<string, Ui2Renames> = {
  ShadAreaChart: CHART,
  ShadBarChart: CHART,
  ShadComboChart: CHART,
  ShadFunnelChart: CHART,
  ShadHeatmapChart: CHART,
  ShadLineChart: CHART,
  ShadPieChart: CHART,
  ShadRadarChart: CHART,
  ShadRadialChart: CHART,
  ShadScatterChart: CHART,
  ShadBreadcrumb: { events: { onItemClick: 'onItemClicked' } },
  ShadButtonGroup: { exposed: { values: 'selected' } },
  ShadCalendar: { events: { onMonthChange: 'onMonthChanged' } },
  ShadCardGrid: { events: { onCardClick: 'onCardClicked' } },
  ShadCarousel: { events: { onSlideChange: 'onSlideChanged', onSlideClick: 'onSlideClicked' } },
  ShadCheckbox: { actions: { setChecked: 'setValue' } },
  ShadColorPicker: { exposed: { selectedColorHex: 'value', rgb: 'selectedColorRGB', rgba: 'selectedColorRGBA' } },
  ShadCombobox: { events: { onChange: 'onSelect' } },
  ShadDatePicker: {
    events: { onChange: 'onSelect' },
    actions: { setDate: 'setValue', clear: 'clearValue' },
    exposed: { selectedDate: 'value' },
  },
  ShadDateTimePicker: {
    ...PICKER,
    actions: { setDate: 'setValue', clear: 'clearValue' },
  },
  ShadEmpty: { events: { onAction: 'onActionClicked' } },
  ShadFileUpload: { actions: { clear: 'clearFiles' }, exposed: { files: 'file' } },
  ShadHero: { events: { onActionClick: 'onActionClicked', onSecondaryActionClick: 'onSecondaryActionClicked' } },
  ShadImage: { properties: { src: 'source', alt: 'alternativeText', fit: 'imageFit' } },
  ShadKanban: {
    events: { onCardClicked: 'onCardSelected' },
    actions: { updateCard: 'updateCardData' },
    exposed: {
      cards: 'updatedCardData',
      selectedCard: 'lastSelectedCard',
      lastMove: 'lastCardMovement',
      movedCard: 'lastCardMovement.card',
    },
  },
  ShadLink: { properties: { href: 'linkTarget', text: 'linkText', target: 'targetType' } },
  ShadListView: {
    events: { onRowClicked: 'onRecordClicked' },
    exposed: { selectedRow: 'selectedRecord', selectedRowId: 'selectedRecordId' },
  },
  ShadMap: {
    events: { onMapClick: 'onMapClicked', onShapeClick: 'onShapeClicked', onLocationPick: 'onLocationPicked' },
  },
  ShadMultiselect: { events: { onChange: 'onSelect' } },
  ShadNavigation: {
    events: { onSelect: 'onClick' },
    actions: { setActive: 'selectItem' },
    exposed: { activeItem: 'selectedItem' },
  },
  ShadPhoneInput: { actions: { setCountry: 'setCountryCode' } },
  ShadNumberInput: { actions: { setValue: 'setText' } },
  ShadProgressList: { events: { onItemClick: 'onItemClicked' } },
  ShadQuestionnaire: { events: { onStepChange: 'onStepChanged' } },
  ShadRadioGroup: { events: { onChange: 'onSelectionChange' } },
  ShadRecordList: {
    events: { onRowClicked: 'onItemClicked', onRecordClicked: 'onItemClicked' },
    exposed: {
      selectedRecord: 'selectedItem',
      selectedRow: 'selectedItem',
      selectedRecordId: 'selectedItemId',
      selectedRowId: 'selectedItemId',
    },
  },
  ShadSchedule: { events: { onBookingClick: 'onBookingClicked', onSlotClick: 'onSlotClicked' } },
  ShadSelect: { events: { onChange: 'onSelect' } },
  ShadSteps: { actions: { setDisabled: 'setDisable' }, properties: { schema: 'steps' } },
  ShadTable: { properties: { pageSize: 'rowsPerPage' } },
  ShadTags: { events: { onTagClick: 'onTagClicked' } },
  ShadTagsInput: {
    events: { onTagRemoved: 'onTagDeleted' },
    exposed: { tags: 'values', value: 'values', selectedTags: 'values' },
  },
  ShadTimePicker: { ...PICKER, actions: { setTime: 'setValue', clear: 'clearValue' } },
  ShadTimeline: { events: { onItemClick: 'onItemClicked' } },
  ShadToggleGroup: { exposed: { selected: 'value' } },
};

/** The renames for one widget type (its own plus the common ones), or null for a type that is not a UI 2.0 widget. */
export const renamesFor = (type: string): Required<Ui2Renames> | null => {
  if (!type || !type.startsWith('Shad')) return null;
  const own = UI2_RENAMES[type] ?? {};
  return {
    events: { ...own.events },
    actions: { ...UI2_COMMON_RENAMES.actions, ...own.actions },
    exposed: { ...own.exposed },
    properties: { ...own.properties },
  };
};

// ---------------------------------------------------------------------------------------------------------------
// Pure rewrites of saved app data. No database access: callers load rows, apply these, and write what changed.
// ---------------------------------------------------------------------------------------------------------------

/** Renames keyed by how a binding names a component: its id (always unique) and its name (only when unique). */
export type Ui2RenamesByComponentRef = Record<string, Required<Ui2Renames>>;

type ComponentLike = { id: string; name?: string; type?: string };

const isPlainObject = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Applies `fn` to every string anywhere inside a JSON value (object values and array items; keys are kept). */
export const rewriteStringsDeep = <T>(value: T, fn: (text: string) => string): T => {
  if (typeof value === 'string') return fn(value) as unknown as T;
  if (Array.isArray(value)) return value.map((item) => rewriteStringsDeep(item, fn)) as unknown as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) out[key] = rewriteStringsDeep(item, fn);
    return out as T;
  }
  return value;
};

/**
 * Builds the lookup rewriteReferences needs. Saved bindings name a component by id (`components.<uuid>.value`, what
 * the editor stores inside `{{ }}`) or by name (RunJS code, older apps, hand-written imports). Every Shad* component
 * is keyed by its id; it is keyed by its name only when no other component in the version has that name, since a
 * name reference to a shared name cannot be told apart. Shared names are reported through `onSharedName`.
 */
export const buildRenamesByComponentRef = (
  components: ComponentLike[],
  onSharedName?: (name: string, ids: string[]) => void
): Ui2RenamesByComponentRef => {
  const idsByName = new Map<string, string[]>();
  for (const component of components) {
    if (!component?.name) continue;
    const ids = idsByName.get(component.name) ?? [];
    ids.push(component.id);
    idsByName.set(component.name, ids);
  }

  const byRef: Ui2RenamesByComponentRef = {};
  for (const component of components) {
    const renames = renamesFor(component?.type);
    if (!renames) continue;
    if (component.id) byRef[component.id] = renames;
    if (!component.name) continue;
    const ids = idsByName.get(component.name) ?? [];
    if (ids.length === 1) byRef[component.name] = renames;
    else if (ids[0] === component.id) onSharedName?.(component.name, ids);
  }
  return byRef;
};

const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
const IDENT = '[A-Za-z_$][\\w$]*';
// components.<ref> | components?.<ref> | components['<ref>'] | components?.["<ref>"], where <ref> is a uuid (what the
// editor stores) or a name; then any list-view row index ([0]); then the member: .<key> | ?.<key> | ['<key>'].
// Groups: 1 dot ref, 3 bracket ref, 4 the whole member, 5 dot prefix, 6 dot key, 7 bracket prefix, 8 quote, 9 key.
const REFERENCE = new RegExp(
  `(?<![\\w$.])components` +
    `(?:\\??\\.(${UUID}|${IDENT})|(?:\\?\\.)?\\[\\s*(['"\`])([^'"\`\\]\\s]+)\\2\\s*\\])` +
    `(?:(?:\\?\\.)?\\[\\d+\\])*` +
    `((\\??\\.)(${IDENT})|((?:\\?\\.)?\\[)(['"])(${IDENT})\\8\\])`,
  'g'
);
const CALL_AHEAD = /^\s*(?:\?\.)?\s*\(/;
const own = (map: Record<string, string>, key: string) =>
  Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;

/**
 * Rewrites references to renamed exposed values and actions inside any string. `components.x.selectedRow` becomes
 * `components.x.selectedRecord` for a ShadListView `x`; `components.x.disable(true)` becomes
 * `components.x.setDisable(true)`. Action names are renamed only where they are called, exposed names only where they
 * are not, so a value that shares an old action's name is left alone. The whole member name must match (`selectedRowId`
 * is its own entry, never a prefix hit of `selectedRow`). A path target (`lastCardMovement.card`) is inserted as is.
 */
export const rewriteReferences = (text: string, renamesByComponentName: Ui2RenamesByComponentRef): string => {
  if (typeof text !== 'string' || !text.includes('components')) return text;
  const re = new RegExp(REFERENCE.source, 'g');
  let out = '';
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const [whole, dotRef, , bracketRef, member, dotPrefix, dotKey, bracketPrefix, quote, bracketKey] = match;
    const renames = renamesByComponentName[dotRef ?? bracketRef];
    const key = dotKey ?? bracketKey;
    if (!renames || !key) continue;

    const isCall = CALL_AHEAD.test(text.slice(match.index + whole.length));
    const target = isCall ? own(renames.actions, key) : own(renames.exposed, key);
    if (!target || target === key) continue;

    const newMember =
      dotKey !== undefined
        ? `${dotPrefix}${target}`
        : `${bracketPrefix}${target
            .split('.')
            .map((part) => `${quote}${part}${quote}`)
            .join('][')}]`;
    out += text.slice(last, match.index) + whole.slice(0, whole.length - member.length) + newMember;
    last = match.index + whole.length;
  }
  return last === 0 ? text : out + text.slice(last);
};

/**
 * The Ant Design card surface is gone: a FlexContainer drawn as `antCard` becomes the shadcn card. Applies to every
 * app, UI 2.0 widgets or not. Returns the properties unchanged when the rule does not apply.
 */
export const migrateFlexContainerCardStyle = <T extends Record<string, any>>(propertiesJson: T, type: string): T => {
  if (type !== 'FlexContainer' || !isPlainObject(propertiesJson)) return propertiesJson;
  const cardStyle = propertiesJson.cardStyle;
  if (!isPlainObject(cardStyle) || cardStyle.value !== 'antCard') return propertiesJson;
  return { ...propertiesJson, cardStyle: { ...cardStyle, value: 'shadcnCard' } };
};

/**
 * Renames one event handler's `event` JSON. The event id is renamed when the handler's source is a Shad* type with a
 * mapping; a `control-component` action on a Shad* target is renamed by the target's type. Returns the same object
 * when nothing applies. References inside strings are not touched here: run rewriteStringsDeep with rewriteReferences.
 */
export const renameEventHandler = (
  event: Record<string, any>,
  sourceType: string | undefined,
  componentTypesById: Record<string, string>
): Record<string, any> => {
  if (!isPlainObject(event)) return event;
  let out: Record<string, any> = event;

  if (event.actionId === 'control-component' && typeof event.componentSpecificActionHandle === 'string') {
    const targetRenames = renamesFor(componentTypesById?.[event.componentId]);
    const handle = event.componentSpecificActionHandle;
    const renamed = targetRenames ? own(targetRenames.actions, handle) : undefined;
    if (renamed && renamed !== handle) out = { ...out, componentSpecificActionHandle: renamed };
  }

  const sourceRenames = renamesFor(sourceType);
  const eventId = event.eventId;
  const renamed = sourceRenames && typeof eventId === 'string' ? own(sourceRenames.events, eventId) : undefined;
  if (renamed && renamed !== eventId) out = { ...out, eventId: renamed };
  return out;
};

/**
 * Renames one saved handler row: its event JSON (renameEventHandler, then references in every string) and its `name`
 * when the name was the old event id. Returns the same object when nothing changed.
 */
export const renameEventHandlerRow = <H extends { name?: string; event: any }>(
  handler: H,
  sourceType: string | undefined,
  componentTypesById: Record<string, string>,
  rewrite: (text: string) => string
): H => {
  const event = rewriteStringsDeep(renameEventHandler(handler.event, sourceType, componentTypesById), rewrite);
  if (JSON.stringify(event) === JSON.stringify(handler.event)) return handler;
  const oldEventId = handler.event?.eventId;
  const name = handler.name && handler.name === oldEventId ? event?.eventId : handler.name;
  return { ...handler, name, event };
};

/** Renames property keys per the type's table. A key moves only when its new name is absent; values are kept as is. */
export const renameProperties = <T extends Record<string, any>>(propertiesJson: T, type: string): T => {
  const renames = renamesFor(type)?.properties;
  if (!isPlainObject(propertiesJson) || !renames || Object.keys(renames).length === 0) return propertiesJson;
  let out: Record<string, any> | null = null;
  for (const [oldKey, newKey] of Object.entries(renames)) {
    const source = out ?? propertiesJson;
    if (!(oldKey in source) || newKey in source) continue;
    out = out ?? { ...propertiesJson };
    out[newKey] = out[oldKey];
    delete out[oldKey];
  }
  return (out ?? propertiesJson) as T;
};

const hasAntCard = (c: Record<string, any>) =>
  c?.type === 'FlexContainer' && migrateFlexContainerCardStyle(c.properties, c.type) !== c.properties;

/**
 * Applies every rename to an exported app's normalized arrays, in place, before they are saved. Cheap when the app
 * has no Shad* component and no Ant card: it returns at once.
 */
export const applyUi2RenamesToImport = (data: {
  pages?: Array<{ id: string; appVersionId?: string }>;
  components?: Array<Record<string, any>>;
  events?: Array<Record<string, any>>;
  dataQueries?: Array<Record<string, any>>;
}): void => {
  const components = data.components ?? [];
  for (const c of components) {
    if (hasAntCard(c)) c.properties = migrateFlexContainerCardStyle(c.properties, c.type);
  }
  if (!components.some((c) => typeof c?.type === 'string' && c.type.startsWith('Shad'))) return;

  const versionByPage = new Map((data.pages ?? []).map((p) => [p.id, p.appVersionId]));
  const versionOf = (c: Record<string, any>) => versionByPage.get(c.pageId);

  for (const versionId of new Set(components.map(versionOf))) {
    const versionComponents = components.filter((c) => versionOf(c) === versionId);
    if (!versionComponents.some((c) => typeof c?.type === 'string' && c.type.startsWith('Shad'))) continue;

    const byRef = buildRenamesByComponentRef(versionComponents as ComponentLike[]);
    const rewrite = (text: string) => rewriteReferences(text, byRef);
    const typesById: Record<string, string> = {};
    for (const c of versionComponents) typesById[c.id] = c.type;

    for (const c of versionComponents) {
      if (c.type?.startsWith('Shad')) c.properties = renameProperties(c.properties, c.type);
      for (const column of ['properties', 'general', 'styles', 'generalStyles', 'validation']) {
        if (c[column] != null) c[column] = rewriteStringsDeep(c[column], rewrite);
      }
    }

    for (const q of data.dataQueries ?? []) {
      if (q.appVersionId === versionId && q.options != null) q.options = rewriteStringsDeep(q.options, rewrite);
    }

    for (const h of data.events ?? []) {
      if (h.appVersionId !== undefined && h.appVersionId !== versionId) continue;
      const next = renameEventHandlerRow(h as { name?: string; event: any }, typesById[h.sourceId], typesById, rewrite);
      if (next !== h) Object.assign(h, { name: next.name, event: next.event });
    }
  }
};
