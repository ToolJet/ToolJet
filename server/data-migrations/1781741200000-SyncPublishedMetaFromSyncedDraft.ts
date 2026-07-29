import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncPublishedMetaFromSyncedDraft1781741200000 implements MigrationInterface {
  // Tighten sync_published_app_version_metadata_from_draft so a PUBLISHED version row
  // pulls its metadata from the SYNCED draft only (is_synced = true), rather than from
  // whichever draft sorts first. PUBLISHED version_type='version' rows are only ever
  // created/updated under gitsync, where a gitsync-origin (is_synced = true) DRAFT
  // exists — so the stricter source is always available and feature-branch / locally
  // created (is_synced = false) drafts can't drive a published snapshot's metadata.
  //
  // Only the function body changes; the BEFORE trigger
  // trg_app_versions_0_sync_published_meta_from_draft (from 1781741000000) keeps
  // pointing at it. Depends on that migration having created the function/trigger.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sync_published_app_version_metadata_from_draft()
      RETURNS TRIGGER AS $$
      DECLARE
        d RECORD;
      BEGIN
        -- excluded for stubs; only a non-stub PUBLISHED version row pulls from draft
        IF NEW.version_type::text <> 'version' OR NEW.status::text <> 'PUBLISHED' OR NEW.is_stub THEN
          RETURN NEW;
        END IF;

        -- source of truth is the SYNCED (gitsync-origin) NON-STUB DRAFT version row
        SELECT app_name, slug, is_public, icon INTO d
        FROM app_versions
        WHERE app_id = NEW.app_id
          AND version_type = 'version'
          AND status = 'DRAFT'
          AND is_stub = false
          AND is_synced = true
        ORDER BY is_synced DESC, updated_at DESC
        LIMIT 1;

        IF FOUND THEN
          NEW.app_name  := d.app_name;
          NEW.slug      := d.slug;
          NEW.is_public := d.is_public;
          NEW.icon      := d.icon;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the original body (sources from any non-stub DRAFT version row).
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sync_published_app_version_metadata_from_draft()
      RETURNS TRIGGER AS $$
      DECLARE
        d RECORD;
      BEGIN
        IF NEW.version_type::text <> 'version' OR NEW.status::text <> 'PUBLISHED' OR NEW.is_stub THEN
          RETURN NEW;
        END IF;

        SELECT app_name, slug, is_public, icon INTO d
        FROM app_versions
        WHERE app_id = NEW.app_id
          AND version_type = 'version'
          AND status = 'DRAFT'
          AND is_stub = false
        ORDER BY is_synced DESC, updated_at DESC
        LIMIT 1;

        IF FOUND THEN
          NEW.app_name  := d.app_name;
          NEW.slug      := d.slug;
          NEW.is_public := d.is_public;
          NEW.icon      := d.icon;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }
}
