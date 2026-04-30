import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Translate ModuleViewer pin refs from cross-instance keys to local DB ids.
 *
 * Until now, two ModuleViewer property fields stored cross-instance keys:
 *   - properties.moduleAppId.value     held apps.co_relation_id
 *   - properties.moduleVersionId.value held app_versions.module_reference_id
 *
 * Under the boundary-only model these fields hold local DB ids, with the
 * cross-instance translation done by AppSnapshot at every push/pull/import/
 * export. This migration rewrites existing rows so the resolver — which is
 * about to flip from `where: { co_relation_id }` to `where: { id }` — keeps
 * resolving the same target row.
 *
 * Naturally idempotent: re-running joins against co_relation_id, but
 * post-translation the field holds apps.id, so the join misses and no row
 * is touched. Same logic for moduleVersionId.
 *
 * Orphans (cor_id with no matching local row) are left intact. The resolver's
 * orphan fallback ("latest saved on default branch") still handles them.
 */
export class TranslateModuleViewerRefsToLocalIds1777300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.translateModuleAppId(queryRunner);
    await this.translateModuleVersionId(queryRunner);
  }

  /**
   * properties.moduleAppId.value: apps.co_relation_id → apps.id, scoped to
   * the parent app's organization so cross-org cor_id collisions can't bleed.
   */
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

  /**
   * properties.moduleVersionId.value: app_versions.module_reference_id → app_versions.id.
   * Scoped to the same module_app the ModuleViewer points at, so a stray
   * cross-app collision (very unlikely with UUIDs) can't redirect the pin.
   * The moduleAppId translation above must run first — by the time we get
   * here, properties.moduleAppId.value already holds the local apps.id.
   */
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

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Original cor_ids cannot be reconstructed from local ids alone — the
    // mapping is lossy in this direction. A revert would require snapshotting
    // every (component_id, original_value) before up(), which isn't worth it.
  }
}
