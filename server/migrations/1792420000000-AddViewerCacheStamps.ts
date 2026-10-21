import { MigrationInterface, QueryRunner } from 'typeorm';

// The released-app viewer caches an app's response in the browser and fetches again when the
// app's stamp moves. Triggers move it when something changes what the released app shows without
// a new release: its page/component/query permissions, the workspace theme, a module it embeds
// being released, or the slug of an app it links to. No backfill: an app without a row has
// simply never changed. Statement-level triggers, so a change to many rows does one update.

// How a changed permission row maps to the app version it belongs to (`r` is the changed row).
const PERMISSION_TABLES: Record<string, string> = {
  page_permissions: 'SELECT p.app_version_id FROM {rows} r JOIN pages p ON p.id = r.page_id',
  page_users: `SELECT p.app_version_id FROM {rows} r
    JOIN page_permissions pp ON pp.id = r.page_permissions_id JOIN pages p ON p.id = pp.page_id`,
  component_permissions: `SELECT p.app_version_id FROM {rows} r
    JOIN components c ON c.id = r.component_id JOIN pages p ON p.id = c.page_id`,
  component_users: `SELECT p.app_version_id FROM {rows} r
    JOIN component_permissions cp ON cp.id = r.component_permissions_id
    JOIN components c ON c.id = cp.component_id JOIN pages p ON p.id = c.page_id`,
  query_permissions: 'SELECT dq.app_version_id FROM {rows} r JOIN data_queries dq ON dq.id = r.query_id',
  query_users: `SELECT dq.app_version_id FROM {rows} r
    JOIN query_permissions qp ON qp.id = r.query_permissions_id JOIN data_queries dq ON dq.id = qp.query_id`,
};

const ALL_TABLES = [...Object.keys(PERMISSION_TABLES), 'organization_themes', 'apps', 'app_versions'];

const rowsOf = (mapping: string, rows: string) => mapping.replace('{rows}', rows);

// Postgres allows only one event per trigger when it uses transition tables.
function statementTriggers(table: string, events: Array<'INSERT' | 'UPDATE' | 'DELETE'>): string[] {
  const referencing = {
    INSERT: 'REFERENCING NEW TABLE AS new_rows',
    UPDATE: 'REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows',
    DELETE: 'REFERENCING OLD TABLE AS old_rows',
  };
  return events.map(
    (event) => `CREATE TRIGGER tj_viewer_cache_${table}_${event.toLowerCase()} AFTER ${event} ON ${table}
      ${referencing[event]} FOR EACH STATEMENT EXECUTE FUNCTION tj_viewer_cache_on_${table}()`
  );
}

export class AddViewerCacheStamps1792420000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE app_viewer_cache_stamps (
        app_id uuid PRIMARY KEY REFERENCES apps(id) ON DELETE CASCADE,
        updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
      )`);
    // Permission changes look up whether their version is the released one.
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_apps_current_version_id
      ON apps (current_version_id) WHERE current_version_id IS NOT NULL`);

    // Marks released apps changed, plus the released apps embedding any of them as a module.
    // Selecting through apps keeps the foreign key valid while an app is being deleted, and id
    // order makes concurrent updates take row locks in the same order.
    await queryRunner.query(`
      CREATE FUNCTION tj_viewer_cache_touch_apps(app_ids uuid[]) RETURNS void LANGUAGE plpgsql AS $$
      BEGIN
        IF coalesce(cardinality(app_ids), 0) = 0 THEN RETURN; END IF;
        INSERT INTO app_viewer_cache_stamps (app_id, updated_at)
          SELECT a.id, clock_timestamp() FROM apps a
           WHERE a.id = ANY (app_ids) AND a.current_version_id IS NOT NULL
           ORDER BY a.id
        ON CONFLICT (app_id) DO UPDATE SET updated_at = EXCLUDED.updated_at;
        IF EXISTS (SELECT 1 FROM apps WHERE id = ANY (app_ids) AND type = 'module') THEN
          INSERT INTO app_viewer_cache_stamps (app_id, updated_at)
            SELECT consumer.id, clock_timestamp() FROM apps consumer
             WHERE consumer.current_version_id IS NOT NULL
               AND EXISTS (
                 SELECT 1 FROM apps m
                   JOIN pages p ON p.app_version_id = consumer.current_version_id
                   JOIN components c ON c.page_id = p.id
                  WHERE m.id = ANY (app_ids) AND m.type = 'module'
                    AND m.organization_id = consumer.organization_id
                    AND c.type = 'ModuleViewer'
                    AND c.properties -> 'moduleAppId' ->> 'value' = m.co_relation_id::text)
             ORDER BY consumer.id
          ON CONFLICT (app_id) DO UPDATE SET updated_at = EXCLUDED.updated_at;
        END IF;
      END $$`);
    await queryRunner.query(`
      CREATE FUNCTION tj_viewer_cache_touch_versions(version_ids uuid[]) RETURNS void LANGUAGE plpgsql AS $$
      BEGIN
        IF coalesce(cardinality(version_ids), 0) = 0 THEN RETURN; END IF;
        PERFORM tj_viewer_cache_touch_apps(ARRAY(
          SELECT a.id FROM apps a WHERE a.current_version_id = ANY (version_ids)));
      END $$`);
    await queryRunner.query(`
      CREATE FUNCTION tj_viewer_cache_touch_workspaces(organization_ids uuid[]) RETURNS void LANGUAGE plpgsql AS $$
      BEGIN
        IF coalesce(cardinality(organization_ids), 0) = 0 THEN RETURN; END IF;
        INSERT INTO app_viewer_cache_stamps (app_id, updated_at)
          SELECT a.id, clock_timestamp() FROM apps a
           WHERE a.organization_id = ANY (organization_ids) AND a.current_version_id IS NOT NULL
           ORDER BY a.id
        ON CONFLICT (app_id) DO UPDATE SET updated_at = EXCLUDED.updated_at;
      END $$`);

    // Permissions: only changes on the released version count, so draft edits refresh nothing.
    for (const [table, mapping] of Object.entries(PERMISSION_TABLES)) {
      await queryRunner.query(`
        CREATE FUNCTION tj_viewer_cache_on_${table}() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF TG_OP = 'INSERT' THEN
            PERFORM tj_viewer_cache_touch_versions(ARRAY(${rowsOf(mapping, 'new_rows')}));
          ELSIF TG_OP = 'DELETE' THEN
            PERFORM tj_viewer_cache_touch_versions(ARRAY(${rowsOf(mapping, 'old_rows')}));
          ELSE
            PERFORM tj_viewer_cache_touch_versions(ARRAY(
              ${rowsOf(mapping, 'new_rows')} UNION ${rowsOf(mapping, 'old_rows')}));
          END IF;
          RETURN NULL;
        END $$`);
    }

    // Every app in the workspace renders with the workspace theme.
    await queryRunner.query(`
      CREATE FUNCTION tj_viewer_cache_on_organization_themes() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN
          PERFORM tj_viewer_cache_touch_workspaces(ARRAY(SELECT DISTINCT organization_id FROM old_rows));
        ELSE
          PERFORM tj_viewer_cache_touch_workspaces(ARRAY(SELECT DISTINCT organization_id FROM new_rows));
        END IF;
        RETURN NULL;
      END $$`);

    // A release changes the app and the apps embedding it as a module. Links to an app check
    // whether it is released, so releasing or unreleasing an app refreshes its workspace.
    await queryRunner.query(`
      CREATE FUNCTION tj_viewer_cache_on_apps() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        PERFORM tj_viewer_cache_touch_apps(ARRAY(
          SELECT n.id FROM new_rows n JOIN old_rows o ON o.id = n.id
           WHERE n.current_version_id IS DISTINCT FROM o.current_version_id));
        PERFORM tj_viewer_cache_touch_workspaces(ARRAY(
          SELECT DISTINCT n.organization_id FROM new_rows n JOIN old_rows o ON o.id = n.id
           WHERE n.slug IS DISTINCT FROM o.slug
              OR (n.current_version_id IS NULL) <> (o.current_version_id IS NULL)));
        RETURN NULL;
      END $$`);

    // Links to an app use its slug, which lives on its versions.
    await queryRunner.query(`
      CREATE FUNCTION tj_viewer_cache_on_app_versions() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        PERFORM tj_viewer_cache_touch_workspaces(ARRAY(
          SELECT DISTINCT a.organization_id FROM new_rows n
            JOIN old_rows o ON o.id = n.id JOIN apps a ON a.id = n.app_id
           WHERE n.slug IS DISTINCT FROM o.slug));
        RETURN NULL;
      END $$`);

    const triggers = [
      ...Object.keys(PERMISSION_TABLES).flatMap((table) => statementTriggers(table, ['INSERT', 'UPDATE', 'DELETE'])),
      ...statementTriggers('organization_themes', ['INSERT', 'UPDATE', 'DELETE']),
      ...statementTriggers('apps', ['UPDATE']),
      ...statementTriggers('app_versions', ['UPDATE']),
    ];
    for (const trigger of triggers) await queryRunner.query(trigger);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ALL_TABLES) {
      for (const event of ['insert', 'update', 'delete']) {
        await queryRunner.query(`DROP TRIGGER IF EXISTS tj_viewer_cache_${table}_${event} ON ${table}`);
      }
      await queryRunner.query(`DROP FUNCTION IF EXISTS tj_viewer_cache_on_${table}()`);
    }
    for (const fn of ['touch_apps', 'touch_versions', 'touch_workspaces']) {
      await queryRunner.query(`DROP FUNCTION IF EXISTS tj_viewer_cache_${fn}(uuid[])`);
    }
    await queryRunner.query('DROP INDEX IF EXISTS idx_apps_current_version_id');
    await queryRunner.query('DROP TABLE IF EXISTS app_viewer_cache_stamps');
  }
}
