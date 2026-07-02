import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Switch app_name uniqueness from case-insensitive (LOWER) to case-sensitive.
 *
 * Previously, enforce_app_versions_app_name_branch_unique() used
 * LOWER(av.app_name) = LOWER(NEW.app_name), which prevented apps named
 * "MyApp" and "myapp" from coexisting on the same branch.
 *
 * This migration replaces the function body to use exact (case-sensitive)
 * comparison: av.app_name = NEW.app_name. The advisory lock key is also
 * updated to use the raw app_name instead of LOWER(app_name) so that
 * case-different names acquire separate locks.
 *
 * Backward compatibility:
 * - Existing data is unaffected because all current app names are already
 *   unique under the stricter case-insensitive rule.
 * - No data migration is required.
 * - The trigger body is replaced in-place; the existing trigger
 *   (trg_app_versions_app_name_branch_unique) picks up the new function
 *   automatically.
 */
export class MakeAppNameUniqueCaseSensitive1780000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_app_name_branch_unique()
      RETURNS TRIGGER AS $$
      DECLARE
        v_app_type varchar;
      BEGIN
        IF NEW.app_name IS NULL
           OR NOT (
             NEW.version_type::text = 'branch'
             OR (NEW.version_type::text = 'version' AND NEW.branch_id IS NOT NULL)
           ) THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        -- Advisory lock keyed on the exact (case-sensitive) app_name so that
        -- concurrent inserts of the same name serialise, while case-different
        -- names ("MyApp" vs "myapp") acquire independent locks.
        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avn:' || COALESCE(NEW.branch_id::text, '') || '|' || v_app_type || '|' || NEW.app_name,
          0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE (
              av.version_type::text = 'branch'
              OR (av.version_type::text = 'version' AND av.branch_id IS NOT NULL)
            )
            AND av.app_name = NEW.app_name
            AND av.branch_id IS NOT DISTINCT FROM NEW.branch_id
            AND a.type = v_app_type
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_app_name_branch_id_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the case-insensitive (LOWER) version from 1779700000000.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_app_versions_app_name_branch_unique()
      RETURNS TRIGGER AS $$
      DECLARE
        v_app_type varchar;
      BEGIN
        IF NEW.app_name IS NULL
           OR NOT (
             NEW.version_type::text = 'branch'
             OR (NEW.version_type::text = 'version' AND NEW.branch_id IS NOT NULL)
           ) THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avn:' || COALESCE(NEW.branch_id::text, '') || '|' || v_app_type || '|' || LOWER(NEW.app_name),
          0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE (
              av.version_type::text = 'branch'
              OR (av.version_type::text = 'version' AND av.branch_id IS NOT NULL)
            )
            AND LOWER(av.app_name) = LOWER(NEW.app_name)
            AND av.branch_id IS NOT DISTINCT FROM NEW.branch_id
            AND a.type = v_app_type
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_app_name_branch_id_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }
}
