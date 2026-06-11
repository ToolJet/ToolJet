import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bumps `app_versions.updated_at` whenever a child entity (page, component, layout,
 * data_query, event_handler) is inserted or updated. The apps-listing query orders
 * by `app_versions.updated_at` per branch, so without this propagation a user
 * editing a component on branch A wouldn't push the parent app to the top of
 * branch A's listing — the AppVersion row itself wasn't touched.
 *
 * Implemented as DB triggers because TypeORM EntitySubscriber callbacks do NOT
 * fire reliably for `manager.update()` / queryBuilder `.update().execute()`,
 * which is how most component / layout / page updates flow in the editor.
 *
 * Recursion guard: triggers don't fire on app_versions itself (would loop with
 * the AppsSubscriber afterUpdate which mirrors the bump to apps.updated_at).
 *
 * Resolution per table:
 *   - pages / data_queries / event_handlers → app_version_id is on the row.
 *   - components → join pages via component.page_id.
 *   - layouts    → join components → pages via layout.component_id.
 */
export class BumpAppVersionUpdatedAtOnChildWrites1779100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Direct-FK trigger function (pages, data_queries, event_handlers) ──────
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION bump_app_version_updated_at_direct()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.app_version_id IS NOT NULL THEN
          UPDATE app_versions SET updated_at = NOW() WHERE id = NEW.app_version_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ── Component trigger (page_id → pages.app_version_id) ────────────────────
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION bump_app_version_updated_at_via_page()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.page_id IS NOT NULL THEN
          UPDATE app_versions
          SET updated_at = NOW()
          WHERE id = (SELECT app_version_id FROM pages WHERE id = NEW.page_id);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ── Layout trigger (component_id → components.page_id → pages.app_version_id)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION bump_app_version_updated_at_via_component()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.component_id IS NOT NULL THEN
          UPDATE app_versions
          SET updated_at = NOW()
          WHERE id = (
            SELECT p.app_version_id
            FROM components c
            JOIN pages p ON p.id = c.page_id
            WHERE c.id = NEW.component_id
          );
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ── Attach triggers ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TRIGGER trg_pages_bump_app_version_updated_at
      AFTER INSERT OR UPDATE ON pages
      FOR EACH ROW EXECUTE FUNCTION bump_app_version_updated_at_direct();
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_data_queries_bump_app_version_updated_at
      AFTER INSERT OR UPDATE ON data_queries
      FOR EACH ROW EXECUTE FUNCTION bump_app_version_updated_at_direct();
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_event_handlers_bump_app_version_updated_at
      AFTER INSERT OR UPDATE ON event_handlers
      FOR EACH ROW EXECUTE FUNCTION bump_app_version_updated_at_direct();
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_components_bump_app_version_updated_at
      AFTER INSERT OR UPDATE ON components
      FOR EACH ROW EXECUTE FUNCTION bump_app_version_updated_at_via_page();
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_layouts_bump_app_version_updated_at
      AFTER INSERT OR UPDATE ON layouts
      FOR EACH ROW EXECUTE FUNCTION bump_app_version_updated_at_via_component();
    `);

    // ── Mirror to apps.updated_at so the non-branch fallback listing stays accurate ──
    // Triggers above bypass TypeORM, so the AppsSubscriber afterUpdate hook never
    // fires for trigger-driven app_versions updates. This trigger closes that gap.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION bump_app_updated_at_from_version()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.app_id IS NOT NULL THEN
          UPDATE apps SET updated_at = NOW() WHERE id = NEW.app_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_app_versions_bump_apps_updated_at
      AFTER INSERT OR UPDATE ON app_versions
      FOR EACH ROW EXECUTE FUNCTION bump_app_updated_at_from_version();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_app_versions_bump_apps_updated_at ON app_versions;`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_layouts_bump_app_version_updated_at ON layouts;`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_components_bump_app_version_updated_at ON components;`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_event_handlers_bump_app_version_updated_at ON event_handlers;`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_data_queries_bump_app_version_updated_at ON data_queries;`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_pages_bump_app_version_updated_at ON pages;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS bump_app_updated_at_from_version();`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS bump_app_version_updated_at_via_component();`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS bump_app_version_updated_at_via_page();`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS bump_app_version_updated_at_direct();`);
  }
}
