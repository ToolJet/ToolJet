import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ModuleViewer pin fields used to hold cross-instance keys
 * (`properties.moduleAppId.value` = `apps.co_relation_id`,
 *  `properties.moduleVersionId.value` = `app_versions.module_reference_id`).
 * Boundary-only model holds local DB ids instead; AppSnapshot translates at
 * every boundary. Idempotent — re-running joins against now-absent keys.
 * Orphans left intact for the resolver's fallback to handle.
 */
export class TranslateModuleViewerRefsToLocalIds1777300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.translateModuleAppId(queryRunner);
    await this.translateModuleVersionId(queryRunner);
    await this.reportOrphans(queryRunner);
  }

  // Scoped to the parent app's organization to keep cross-org cor_id
  // collisions from bleeding into each other.
  private async translateModuleAppId(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE components AS c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleAppId,value}',
        to_jsonb(target_app.id::text)
      )
      FROM pages p
      JOIN app_versions av ON av.id = p.app_version_id
      JOIN apps parent_app ON parent_app.id = av.app_id
      JOIN apps target_app
        ON target_app.co_relation_id::text = (c.properties::jsonb -> 'moduleAppId' ->> 'value')
        AND target_app.organization_id = parent_app.organization_id
        AND target_app.type = 'module'
      WHERE p.id = c.page_id
        AND c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleAppId' ->> 'value') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleAppId' ->> 'value') <> ''
    `);
  }

  // Must run AFTER translateModuleAppId — scopes to the same module the
  // ModuleViewer points at (which has been translated to local apps.id).
  private async translateModuleVersionId(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE components AS c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleVersionId,value}',
        to_jsonb(target_version.id::text)
      )
      FROM app_versions target_version
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') <> ''
        AND target_version.module_reference_id::text =
            (c.properties::jsonb -> 'moduleVersionId' ->> 'value')
        AND target_version.app_id::text =
            (c.properties::jsonb -> 'moduleAppId' ->> 'value')
    `);
  }

  // Diagnostic count of values that didn't translate (no local row matched
  // the pre-migration cross-instance key). Resolver fallback still handles
  // these at runtime; the log gives operators a cross-check number.
  private async reportOrphans(queryRunner: QueryRunner): Promise<void> {
    const [moduleAppOrphans] = await queryRunner.query(`
      SELECT COUNT(*)::int AS count
      FROM components c
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleAppId' ->> 'value') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleAppId' ->> 'value') <> ''
        AND NOT EXISTS (
          SELECT 1 FROM apps a
          WHERE a.id::text = (c.properties::jsonb -> 'moduleAppId' ->> 'value')
        )
    `);
    const [moduleVersionOrphans] = await queryRunner.query(`
      SELECT COUNT(*)::int AS count
      FROM components c
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') <> ''
        AND NOT EXISTS (
          SELECT 1 FROM app_versions av
          WHERE av.id::text = (c.properties::jsonb -> 'moduleVersionId' ->> 'value')
        )
    `);
    const appOrphans = moduleAppOrphans?.count ?? 0;
    const versionOrphans = moduleVersionOrphans?.count ?? 0;
    const tag = '[TranslateModuleViewerRefsToLocalIds1777300000000]';
    if (appOrphans > 0 || versionOrphans > 0) {
      console.log(`${tag} ${appOrphans} moduleAppId + ${versionOrphans} moduleVersionId orphan(s).`);
    } else {
      console.log(`${tag} all pin references resolve to local rows.`);
    }
  }

  // down() is intentionally empty — original cor_ids can't be reconstructed
  // from local ids; reverting would require snapshotting before up().
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
