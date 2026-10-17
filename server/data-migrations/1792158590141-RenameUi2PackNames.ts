import { MigrationProgress, deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'RenameUi2PackNames';

// ---------------------------------------------------------------------------------------------------------------
// FROZEN COPY. A migration must keep doing what it did the day it shipped, so the rename table and the rewrites
// below are copied from src/modules/apps/services/ui2-legacy-names.ts (2026-10-16) rather than imported. Do not
// edit them to follow later renames: write a new migration. Nothing here is exported, because TypeORM loads every
// exported function in data-migrations/ as a migration class.
// ---------------------------------------------------------------------------------------------------------------

type Ui2Renames = {
  events?: Record<string, string>;
  actions?: Record<string, string>;
  exposed?: Record<string, string>;
  properties?: Record<string, string>;
};

/** Applies to every UI 2.0 widget type: the older control actions. */
const UI2_COMMON_RENAMES: Ui2Renames = {
  actions: { visibility: 'setVisibility', disable: 'setDisable', loading: 'setLoading' },
};

const CHART: Ui2Renames = { exposed: { clickedDatum: 'clickedDataPoint' } };
const PICKER: Ui2Renames = { events: { onChange: 'onSelect' }, actions: { clear: 'clearValue' } };

const UI2_RENAMES: Record<string, Ui2Renames> = {
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
const renamesFor = (type: string): Required<Ui2Renames> | null => {
  if (typeof type !== 'string' || !type.startsWith('Shad')) return null;
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
type Ui2RenamesByComponentRef = Record<string, Required<Ui2Renames>>;

type ComponentLike = { id: string; name?: string; type?: string };

const isPlainObject = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Applies `fn` to every string anywhere inside a JSON value (object values and array items; keys are kept). */
const rewriteStringsDeep = <T>(value: T, fn: (text: string) => string): T => {
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
const buildRenamesByComponentRef = (
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

  // No prototype: a reference to `components.constructor` (or a component named `__proto__`) is just a key.
  const byRef: Ui2RenamesByComponentRef = Object.create(null);
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
const rewriteReferences = (text: string, renamesByComponentName: Ui2RenamesByComponentRef): string => {
  if (typeof text !== 'string' || !text.includes('components')) return text;
  const re = new RegExp(REFERENCE.source, 'g');
  let out = '';
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const [whole, dotRef, , bracketRef, member, dotPrefix, dotKey, bracketPrefix, quote, bracketKey] = match;
    const ref = dotRef ?? bracketRef;
    // Own keys only: plain text naming `components.constructor.name` must not reach Object.prototype.
    const renames = Object.prototype.hasOwnProperty.call(renamesByComponentName, ref)
      ? renamesByComponentName[ref]
      : undefined;
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
const migrateFlexContainerCardStyle = <T extends Record<string, any>>(propertiesJson: T, type: string): T => {
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
const renameEventHandler = (
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
const renameEventHandlerRow = <H extends { name?: string; event: any }>(
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
const renameProperties = <T extends Record<string, any>>(propertiesJson: T, type: string): T => {
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

// ---------------------------------------------------------------------------------------------------------------

type ComponentRow = {
  id: string;
  name: string;
  type: string;
  page_id: string;
  properties: any;
  general_properties: any;
  styles: any;
  general_styles: any;
  display_preferences: any;
  validation: any;
};
type EventRow = { id: string; name: string; event: any; source_id: string };

const JSON_COLUMNS = [
  'properties',
  'general_properties',
  'styles',
  'general_styles',
  'display_preferences',
  'validation',
] as const;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const BATCH_SIZE = 100;
// Undo/redo history (app_history.change_payload, jsonb) that names a UI 2.0 widget type or the removed Ant card. A
// version whose history mentions either can restore pre-rename contracts, even when its current rows needed no rewrite
// or the widget has since been deleted. Every component a delta touches appears with its type in the version's base
// snapshot or in its create delta, so matching the type is enough to find the version.
const HISTORY_PATTERNS = ['"(type|componentType)":\\s*"Shad', '"antCard"'];
// No UI 2.0 widget type or Ant card existed before this date, so older history rows cannot name one. Bounds the
// text scan to recent rows (app_history has no index that could narrow it).
const HISTORY_SINCE = '2026-10-01';

export class RenameUi2PackNames1792158590141 implements MigrationInterface {
  /**
   * ToolJet UI 2.0's widget pack (component types starting with `Shad`) settled its names: event ids, control actions,
   * exposed values and a few property keys each got one name (frontend Widgets/Ui2/legacyNames.ts). Apps saved
   * before that still carry the old names, which the widgets no longer fire, run or expose. For every app version
   * with a Shad* component this rewrites, in place:
   *  - event handlers: a Shad* source's event id (and the handler name when it was that id); a control-component
   *    action on a Shad* target, from any source;
   *  - references in every string of event JSON, component properties/general/styles/general styles/display
   *    preferences/validation and data query options: `components.<id or name>.<old exposed>` and `components.<id or name>.<old action>(`. The
   *    editor stores `{{ }}` bindings by component id; RunJS code and older apps use the name, which is rewritten only
   *    when exactly one component in the version has it;
   *  - Shad* property keys, only where the new key is absent.
   * Separately, for every app: a FlexContainer drawn with the removed Ant Design card (`cardStyle: { value: 'antCard' }`)
   * becomes the shadcn card.
   * Then undo/redo history is cleared for every version with a UI 2.0 widget or an Ant card, now or in its history.
   * Only rows that change are written, and every rewrite maps old names to names that are never old names of the same
   * type, so a second run changes nothing.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Versions whose undo/redo history is cleared at the end: every version with a UI 2.0 widget or an Ant card, now
    // or in its history.
    const touchedVersionIds = new Set<string>();

    await this.migrateAntCards(queryRunner, touchedVersionIds);

    const countResult = await queryRunner.query(
      `SELECT COUNT(DISTINCT p.app_version_id) AS count
         FROM components c JOIN pages p ON p.id = c.page_id
        WHERE c.type LIKE 'Shad%'`
    );
    const totalVersions = parseInt(countResult[0].count, 10);
    if (totalVersions === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] No app version uses a UI 2.0 widget. | Total: 0`);
    } else {
      console.log(`${MIGRATION_NAME}: [START] Rename UI 2.0 widget names | Total versions: ${totalVersions}`);
      const progress = new MigrationProgress(MIGRATION_NAME, totalVersions);
      let offset = 0;
      for (;;) {
        // The selection does not depend on anything this migration writes, so offset paging is stable.
        const versions: { app_version_id: string }[] = await queryRunner.query(
          `SELECT DISTINCT p.app_version_id
             FROM components c JOIN pages p ON p.id = c.page_id
            WHERE c.type LIKE 'Shad%'
            ORDER BY p.app_version_id
            LIMIT $1 OFFSET $2`,
          [BATCH_SIZE, offset]
        );
        if (versions.length === 0) break;
        for (const { app_version_id } of versions) {
          await this.migrateVersion(queryRunner, app_version_id);
          touchedVersionIds.add(app_version_id);
          progress.show();
        }
        offset += BATCH_SIZE;
      }
    }

    // Event ids, action handles and property keys move: an undo/redo entry saved before this migration would restore
    // the old names (and the Ant card) on top of the rewritten rows. History is not rewritten (a delta holds only the
    // fields it changed, so it cannot be renamed reliably); it is cleared for every version that has a UI 2.0 widget
    // or an Ant card now, or whose history names one (a widget since deleted, a card already moved). History is
    // per version and is not carried by import, export or a new version, so this covers every restore path.
    const fromHistory: { app_version_id: string }[] = await queryRunner.query(
      `SELECT DISTINCT app_version_id FROM app_history
        WHERE created_at >= $1 AND (change_payload::text ~ $2 OR change_payload::text ~ $3)`,
      [HISTORY_SINCE, ...HISTORY_PATTERNS]
    );
    for (const { app_version_id } of fromHistory) touchedVersionIds.add(app_version_id);
    if (touchedVersionIds.size > 0) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: Array.from(touchedVersionIds) },
        MIGRATION_NAME
      );
    }
    console.log(`${MIGRATION_NAME}: [SUCCESS] Checked ${touchedVersionIds.size} app versions.`);
  }

  /** FlexContainer `antCard` -> `shadcnCard`, in every app. `properties` is `json`, so the filter is a text match. */
  private async migrateAntCards(queryRunner: QueryRunner, touchedVersionIds: Set<string>): Promise<void> {
    const rows: { id: string; properties: any; app_version_id: string }[] = await queryRunner.query(
      `SELECT c.id, c.properties, p.app_version_id
         FROM components c JOIN pages p ON p.id = c.page_id
        WHERE c.type = 'FlexContainer' AND c.properties::text LIKE '%antCard%'`
    );
    let updated = 0;
    for (const row of rows) {
      const next = migrateFlexContainerCardStyle(row.properties, 'FlexContainer');
      if (next === row.properties) continue;
      await queryRunner.query(`UPDATE components SET properties = $1 WHERE id = $2`, [JSON.stringify(next), row.id]);
      touchedVersionIds.add(row.app_version_id);
      updated++;
    }
    console.log(`${MIGRATION_NAME}: Ant card surfaces moved to the shadcn card: ${updated}`);
  }

  /** Rewrites one app version. Returns whether any row changed. */
  private async migrateVersion(queryRunner: QueryRunner, versionId: string): Promise<boolean> {
    let changed = false;
    const components: ComponentRow[] = await queryRunner.query(
      `SELECT c.id, c.name, c.type, c.page_id, c.properties, c.general_properties, c.styles, c.general_styles,
              c.display_preferences, c.validation
         FROM components c JOIN pages p ON p.id = c.page_id
        WHERE p.app_version_id = $1`,
      [versionId]
    );

    const byRef = buildRenamesByComponentRef(components, (name, ids) =>
      console.log(
        `${MIGRATION_NAME}: version ${versionId}: name "${name}" belongs to ${ids.length} components; ` +
          `references by that name are left alone (references by id are still rewritten)`
      )
    );
    const rewrite = (text: string) => rewriteReferences(text, byRef);
    const typesById: Record<string, string> = {};
    for (const c of components) typesById[c.id] = c.type;

    // Components of every type: a Text or Table binding may read a Shad* widget's value.
    for (const component of components) {
      const updates: Record<string, any> = {};
      for (const column of JSON_COLUMNS) {
        let value = component[column];
        if (value == null) continue;
        if (column === 'properties' && component.type?.startsWith('Shad'))
          value = renameProperties(value, component.type);
        value = rewriteStringsDeep(value, rewrite);
        if (!same(value, component[column])) updates[column] = value;
      }
      const columns = Object.keys(updates);
      if (columns.length === 0) continue;
      await queryRunner.query(
        `UPDATE components SET ${columns.map((col, i) => `${col} = $${i + 1}`).join(', ')} WHERE id = $${columns.length + 1}`,
        [...columns.map((col) => JSON.stringify(updates[col])), component.id]
      );
      changed = true;
    }

    // Event handlers of every source (components, pages, queries).
    const handlers: EventRow[] = await queryRunner.query(
      `SELECT id, name, event, source_id FROM event_handlers WHERE app_version_id = $1`,
      [versionId]
    );
    for (const handler of handlers) {
      const next = renameEventHandlerRow(handler, typesById[handler.source_id], typesById, rewrite);
      if (next === handler) continue;
      await queryRunner.query(`UPDATE event_handlers SET name = $1, event = $2 WHERE id = $3`, [
        next.name,
        JSON.stringify(next.event),
        handler.id,
      ]);
      changed = true;
    }

    // Data queries: RunJS code, params, any string in options.
    const queries: { id: string; options: any }[] = await queryRunner.query(
      `SELECT id, options FROM data_queries WHERE app_version_id = $1`,
      [versionId]
    );
    for (const query of queries) {
      if (query.options == null) continue;
      const next = rewriteStringsDeep(query.options, rewrite);
      if (same(next, query.options)) continue;
      await queryRunner.query(`UPDATE data_queries SET options = $1 WHERE id = $2`, [JSON.stringify(next), query.id]);
      changed = true;
    }

    return changed;
  }

  /**
   * No-op. The old names are dead in the current widgets (they fire, run and expose only the new ones), so restoring
   * them would break the apps; and a renamed name cannot be told apart from one the builder chose after the release
   * (several old names also map to one new name), so the rewrite is not reversible.
   */
  public async down(): Promise<void> {}
}
