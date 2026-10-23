import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'StampFlexLayoutVersionOnUi2Containers';
const BATCH_SIZE = 2000;

// FROZEN COPY of what a new FlexContainer is created with (the widget's default definition, 2026-10-19). Nothing here
// is exported: TypeORM loads every export of a migration file as a migration class.
const NEW_CONTAINER_PROPERTIES = { layoutVersion: { value: '2' }, equalHeights: { value: '{{true}}' } };

// FlexContainers without a layout version, in UI 2.0 versions. The library test mirrors componentLibraryFor
// (src/helpers/component_library.helper.ts): a saved 'ui1' or 'ui2' wins; without one, a version with any Shad* widget
// is UI 2.0. A property bag that is not an object (ToolJet never writes one) is left alone.
const SELECT_BATCH = `
  SELECT c.id, p.app_version_id
    FROM components c
    JOIN pages p ON p.id = c.page_id
    JOIN app_versions av ON av.id = p.app_version_id
   WHERE c.type = 'FlexContainer'
     AND c.properties -> 'layoutVersion' IS NULL
     AND (c.properties IS NULL OR json_typeof(c.properties) = 'object')
     AND (
       av.global_settings ->> 'componentLibrary' = 'ui2'
       OR (
         COALESCE(av.global_settings ->> 'componentLibrary', '') NOT IN ('ui1', 'ui2')
         AND EXISTS (
           SELECT 1
             FROM components s
             JOIN pages sp ON sp.id = s.page_id
            WHERE sp.app_version_id = av.id
              AND s.type ~ '^Shad[A-Z]'
         )
       )
     )
     AND c.id > $1
   ORDER BY c.id
   LIMIT $2`;

// The column is json, which keeps key order, and stays json: a jsonb round trip would sort every container's keys.
// The saved keys keep their order and the new ones go after them; a key the container already has (Equal heights set
// by hand) keeps its value.
const UPDATE_BATCH = `
  UPDATE components c
     SET properties = (
           SELECT json_object_agg(e.key, e.value ORDER BY e.part, e.ord)
             FROM (
               SELECT 0 AS part, saved.key, saved.value, saved.ord
                 FROM json_each(COALESCE(c.properties, '{}'::json)) WITH ORDINALITY AS saved(key, value, ord)
               UNION ALL
               SELECT 1 AS part, added.key, added.value, added.ord
                 FROM json_each($1::json) WITH ORDINALITY AS added(key, value, ord)
                WHERE COALESCE(c.properties, '{}'::json) -> added.key IS NULL
             ) e
         ),
         updated_at = now()
   WHERE c.id = ANY($2::uuid[])
     AND c.properties -> 'layoutVersion' IS NULL`;

/**
 * FlexContainers in UI 2.0 apps keep the UI 2.0 layout. A FlexContainer gets that layout only when its definition
 * carries layoutVersion '2' (frontend: AppBuilder/_helpers/flexLayoutVersion.js), which new containers are created
 * with; containers saved before the flag (released on lts-3.16) keep the lts-3.16 layout. Containers built in UI 2.0
 * apps before the flag existed have the new layout already, so they get the flag, and Equal heights on as a new
 * container does. UI 1.0 versions, and containers that already have a layout version, are not touched, so a re-run
 * changes nothing. Undo history of the changed versions is cleared, so an older entry cannot bring a container back
 * without the flag.
 */
export class StampFlexLayoutVersionOnUi2Containers1792180000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const added = JSON.stringify(NEW_CONTAINER_PROPERTIES);
    const versionIds = new Set<string>();
    let lastId = '00000000-0000-0000-0000-000000000000';
    let total = 0;

    for (;;) {
      const rows: Array<{ id: string; app_version_id: string }> = await queryRunner.query(SELECT_BATCH, [
        lastId,
        BATCH_SIZE,
      ]);
      if (rows.length === 0) break;
      lastId = rows[rows.length - 1].id;
      await queryRunner.query(UPDATE_BATCH, [added, rows.map((row) => row.id)]);
      rows.forEach((row) => versionIds.add(row.app_version_id));
      total += rows.length;
      console.log(`[${MIGRATION_NAME}] Stamped ${total} FlexContainers`);
    }

    console.log(`[${MIGRATION_NAME}] Done: ${total} FlexContainers in ${versionIds.size} app versions`);
    if (total > 0)
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: [...versionIds] },
        MIGRATION_NAME
      );
  }

  public async down(): Promise<void> {
    // No-op: a container with the flag renders the layout it was built with, so there is nothing to undo, and removing
    // the flag could not tell these containers from ones created with it.
  }
}
