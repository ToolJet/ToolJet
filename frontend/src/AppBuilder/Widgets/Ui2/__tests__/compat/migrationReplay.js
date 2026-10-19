// Runs saved-app fixtures through the UI 2.0 data migrations (server/data-migrations/*Ui2*.ts, in timestamp order), so
// the compat spec loads what a customer's app becomes after an upgrade. They run unchanged against a small stand-in for
// the database that understands the queries they send.
import fs from 'fs';
import path from 'path';

const MIGRATIONS = path.resolve(__dirname, '../../../../../../../server/data-migrations');

/** The UI 2.0 pack's data migrations, oldest first. Name a new one with `Ui2` in it so it is replayed here. */
export const ui2Migrations = () =>
  fs
    .readdirSync(MIGRATIONS)
    .filter((f) => /Ui2/.test(f) && f.endsWith('.ts'))
    .sort()
    .map((f) => {
      // eslint-disable-next-line import/no-dynamic-require
      const exported = Object.values(require(path.join(MIGRATIONS, f)));
      const Migration = exported.find((e) => typeof e === 'function' && typeof e.prototype?.up === 'function');
      if (!Migration) throw new Error(`${f} exports no migration class`);
      return { file: f, Migration };
    });

const clone = (v) => JSON.parse(JSON.stringify(v));

/** A route that matches one statement exactly (whitespace collapsed), for SQL too long to read as a regex. */
const exactly = (statement) => new RegExp(`^${statement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

/** An exported app's arrays as database rows (snake_case columns, JSON as the driver returns it). */
const toTables = (app) => {
  const versionByPage = Object.fromEntries(app.pages.map((p) => [p.id, p.appVersionId]));
  return {
    versionByPage,
    // app_versions.global_settings, when the payload carries its versions (a saved-app fixture usually does not).
    globalSettingsByVersion: Object.fromEntries((app.appVersions ?? []).map((v) => [v.id, v.globalSettings ?? null])),
    components: app.components.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      page_id: c.pageId,
      properties: clone(c.properties ?? null),
      general_properties: clone(c.general ?? null),
      styles: clone(c.styles ?? null),
      general_styles: clone(c.generalStyles ?? null),
      display_preferences: clone(c.displayPreferences ?? null),
      validation: clone(c.validation ?? null),
    })),
    event_handlers: app.events.map((e) => ({
      id: e.id,
      name: e.name,
      event: clone(e.event),
      source_id: e.sourceId,
      app_version_id: e.appVersionId,
    })),
    data_queries: app.dataQueries.map((q) => ({
      id: q.id,
      options: clone(q.options ?? null),
      app_version_id: q.appVersionId,
    })),
  };
};

/** Just enough of TypeORM's QueryRunner for the queries the UI 2.0 migrations send; anything else fails loudly. */
function standInQueryRunner(db) {
  const versionOf = (c) => db.versionByPage[c.page_id];
  const byId = (table, id) => db[table].find((r) => r.id === id);
  // componentLibraryFor (server/src/helpers/component_library.helper.ts): a saved library wins; without one, a version
  // with any Shad* widget is UI 2.0.
  const libraryOf = (version) => {
    const saved = db.globalSettingsByVersion[version]?.componentLibrary;
    if (saved === 'ui1' || saved === 'ui2') return saved;
    return db.components.some((c) => versionOf(c) === version && /^Shad[A-Z]/.test(c.type)) ? 'ui2' : 'ui1';
  };
  const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const needsFlexLayoutVersion = (c) =>
    c.type === 'FlexContainer' &&
    (c.properties === null || isObject(c.properties)) &&
    c.properties?.layoutVersion === undefined &&
    libraryOf(versionOf(c)) === 'ui2';
  const routes = [
    [
      // StampFlexLayoutVersionOnUi2Containers: FlexContainers in UI 2.0 versions without a layout version, by id.
      exactly(
        "SELECT c.id, p.app_version_id FROM components c JOIN pages p ON p.id = c.page_id JOIN app_versions av ON av.id = p.app_version_id WHERE c.type = 'FlexContainer' AND c.properties -> 'layoutVersion' IS NULL AND (c.properties IS NULL OR json_typeof(c.properties) = 'object') AND ( av.global_settings ->> 'componentLibrary' = 'ui2' OR ( COALESCE(av.global_settings ->> 'componentLibrary', '') NOT IN ('ui1', 'ui2') AND EXISTS ( SELECT 1 FROM components s JOIN pages sp ON sp.id = s.page_id WHERE sp.app_version_id = av.id AND s.type ~ '^Shad[A-Z]' ) ) ) AND c.id > $1 ORDER BY c.id LIMIT $2"
      ),
      ([lastId, limit]) =>
        db.components
          .filter((c) => needsFlexLayoutVersion(c) && c.id > lastId)
          .sort((a, b) => (a.id < b.id ? -1 : 1))
          .slice(0, limit)
          .map((c) => ({ id: c.id, app_version_id: versionOf(c) })),
    ],
    [
      // ...and the batch update: the new keys go after the saved ones, and a key already there keeps its value.
      exactly(
        "UPDATE components c SET properties = ( SELECT json_object_agg(e.key, e.value ORDER BY e.part, e.ord) FROM ( SELECT 0 AS part, saved.key, saved.value, saved.ord FROM json_each(COALESCE(c.properties, '{}'::json)) WITH ORDINALITY AS saved(key, value, ord) UNION ALL SELECT 1 AS part, added.key, added.value, added.ord FROM json_each($1::json) WITH ORDINALITY AS added(key, value, ord) WHERE COALESCE(c.properties, '{}'::json) -> added.key IS NULL ) e ), updated_at = now() WHERE c.id = ANY($2::uuid[]) AND c.properties -> 'layoutVersion' IS NULL"
      ),
      ([added, ids]) => {
        const rows = ids.map((id) => byId('components', id)).filter((c) => c.properties?.layoutVersion === undefined);
        for (const row of rows) {
          const saved = row.properties ?? {};
          const missing = Object.entries(JSON.parse(added)).filter(([key]) => saved[key] === undefined);
          row.properties = { ...saved, ...Object.fromEntries(missing) };
        }
        return [[], rows.length];
      },
    ],
  ];
  return {
    manager: {},
    async query(sql, params = []) {
      const text = sql.replace(/\s+/g, ' ').trim();
      for (const [re, run] of routes) {
        const match = re.exec(text);
        if (match) return run(params, match);
      }
      throw new Error(
        `A UI 2.0 data migration sent a query the compat spec's stand-in database does not know. Teach ` +
          `compat/migrationReplay.js to answer it:\n  ${text}`
      );
    },
  };
}

/** The app after every UI 2.0 data migration has run on it, in its exported shape. */
export async function migrate(app) {
  const db = toTables(app);
  const runner = standInQueryRunner(db);
  for (const { Migration } of ui2Migrations()) await new Migration().up(runner);
  const out = clone(app);
  for (const c of out.components) {
    const row = byIdIn(db.components, c.id);
    Object.assign(c, {
      properties: row.properties,
      general: row.general_properties,
      styles: row.styles,
      generalStyles: row.general_styles,
      ...(row.display_preferences !== null || 'displayPreferences' in c
        ? { displayPreferences: row.display_preferences }
        : {}),
      validation: row.validation,
    });
  }
  for (const e of out.events)
    Object.assign(e, { name: byIdIn(db.event_handlers, e.id).name, event: byIdIn(db.event_handlers, e.id).event });
  for (const q of out.dataQueries) q.options = byIdIn(db.data_queries, q.id).options;
  return out;
}
const byIdIn = (rows, id) => rows.find((r) => r.id === id);
