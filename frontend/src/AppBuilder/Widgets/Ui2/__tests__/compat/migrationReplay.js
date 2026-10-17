// Runs saved-app fixtures through the two paths that rewrite apps saved under an earlier release, so the compat spec
// loads what a customer's app becomes after an upgrade:
//  - import (server/src/modules/apps/services/ui2-legacy-names.ts, applyUi2RenamesToImport), for exported apps and git
//    sync;
//  - the data migrations (server/data-migrations/*Ui2*.ts, in timestamp order), for apps already in the database. They
//    run unchanged against a small stand-in for the database that understands the queries they send.
import fs from 'fs';
import path from 'path';
import { applyUi2RenamesToImport } from '../../../../../../../server/src/modules/apps/services/ui2-legacy-names';

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

/** An exported app's arrays as database rows (snake_case columns, JSON as the driver returns it). */
const toTables = (app) => {
  const versionByPage = Object.fromEntries(app.pages.map((p) => [p.id, p.appVersionId]));
  return {
    versionByPage,
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
  const shadVersions = () => [...new Set(db.components.filter((c) => c.type.startsWith('Shad')).map(versionOf))].sort();
  const byId = (table, id) => db[table].find((r) => r.id === id);
  const routes = [
    [
      /^SELECT c\.id, c\.properties, p\.app_version_id FROM components c JOIN pages p ON p\.id = c\.page_id WHERE c\.type = 'FlexContainer' AND c\.properties::text LIKE '%antCard%'$/,
      () =>
        db.components
          .filter((c) => c.type === 'FlexContainer' && JSON.stringify(c.properties).includes('antCard'))
          .map((c) => ({ id: c.id, properties: clone(c.properties), app_version_id: versionOf(c) })),
    ],
    [
      /^SELECT COUNT\(DISTINCT p\.app_version_id\) AS count FROM components c JOIN pages p ON p\.id = c\.page_id WHERE c\.type LIKE 'Shad%'$/,
      () => [{ count: String(shadVersions().length) }],
    ],
    [
      /^SELECT DISTINCT p\.app_version_id FROM components c JOIN pages p ON p\.id = c\.page_id WHERE c\.type LIKE 'Shad%' ORDER BY p\.app_version_id LIMIT \$1 OFFSET \$2$/,
      ([limit, offset]) =>
        shadVersions()
          .slice(offset, offset + limit)
          .map((v) => ({ app_version_id: v })),
    ],
    [
      /^SELECT c\.id, c\.name, c\.type, c\.page_id, c\.properties, c\.general_properties, c\.styles, c\.general_styles, c\.display_preferences, c\.validation FROM components c JOIN pages p ON p\.id = c\.page_id WHERE p\.app_version_id = \$1$/,
      ([version]) => clone(db.components.filter((c) => versionOf(c) === version)),
    ],
    [
      // The rename clears undo/redo history for versions whose history names a UI 2.0 type; the fixtures carry none.
      /^SELECT DISTINCT app_version_id FROM app_history WHERE created_at >= \$1 AND \(change_payload::text ~ \$2 OR change_payload::text ~ \$3\)$/,
      () => [],
    ],
    [
      /^UPDATE components SET (.+) WHERE id = \$(\d+)$/,
      (params, [, assignments]) => {
        const columns = assignments.split(', ').map((a) => a.split(' = ')[0]);
        const row = byId('components', params[columns.length]);
        columns.forEach((col, i) => (row[col] = JSON.parse(params[i])));
        return [];
      },
    ],
    [
      /^SELECT id, name, event, source_id FROM event_handlers WHERE app_version_id = \$1$/,
      ([version]) =>
        clone(db.event_handlers.filter((e) => e.app_version_id === version)).map(({ id, name, event, source_id }) => ({
          id,
          name,
          event,
          source_id,
        })),
    ],
    [
      /^UPDATE event_handlers SET name = \$1, event = \$2 WHERE id = \$3$/,
      ([name, event, id]) => {
        Object.assign(byId('event_handlers', id), { name, event: JSON.parse(event) });
        return [];
      },
    ],
    [
      /^SELECT id, options FROM data_queries WHERE app_version_id = \$1$/,
      ([version]) =>
        clone(db.data_queries.filter((q) => q.app_version_id === version)).map(({ id, options }) => ({ id, options })),
    ],
    [
      /^UPDATE data_queries SET options = \$1 WHERE id = \$2$/,
      ([options, id]) => {
        byId('data_queries', id).options = JSON.parse(options);
        return [];
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

/** The app after import's rename, in its exported shape. */
export function importRename(app) {
  const out = clone(app);
  applyUi2RenamesToImport(out);
  return out;
}
