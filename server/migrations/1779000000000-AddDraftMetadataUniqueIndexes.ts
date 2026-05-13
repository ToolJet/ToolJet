import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds an instance-wide partial unique index on app_versions.slug for
 * default-branch DRAFT rows:
 *
 *   UNIQUE (slug) WHERE status = 'DRAFT' AND branch_id IS NOT NULL
 *                       AND version_type = 'version'
 *
 * Rationale: slug-only lookups (no branch context) fall back to the workspace's
 * default branch via AppsRepository.findAppBySlug / findBySlug. Default-branch
 * editor rows are version_type='version' + branch_id IS NOT NULL + status=DRAFT.
 * Making the slug globally unique among those rows guarantees the fallback
 * resolves to exactly one row, regardless of which workspace owns it.
 *
 * Sub-branch DRAFT rows (version_type='branch') keep their per-branch uniqueness
 * via the existing app_versions_slug_branch_id_unique index. Tags / releases
 * (status PUBLISHED/RELEASED) are intentionally excluded — historical snapshots
 * can carry duplicated slugs.
 *
 * Before creating the index, dedupe any pre-existing rows that would violate it
 * (same algorithm as Step 4a in AddMetadataColumnsToAppVersions1778000000000,
 * but partitioning by slug alone instead of (slug, branch_id)).
 */
export class AddDraftMetadataUniqueIndexes1779000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Dedupe slug globally among default-branch DRAFT rows.
    // Keep the oldest row's slug; rename later duplicates with _N suffixes.
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_value VARCHAR;
        suffix INT;
      BEGIN
        FOR rec IN
          SELECT id, slug
          FROM (
            SELECT id, slug,
                   ROW_NUMBER() OVER (
                     PARTITION BY slug
                     ORDER BY created_at ASC, id ASC
                   ) AS rn
            FROM app_versions
            WHERE status = 'DRAFT'
              AND branch_id IS NOT NULL
              AND version_type = 'version'
              AND slug IS NOT NULL
          ) ranked
          WHERE rn > 1
        LOOP
          suffix := 1;
          LOOP
            new_value := rec.slug || '_' || suffix;
            EXIT WHEN NOT EXISTS (
              SELECT 1 FROM app_versions
              WHERE status = 'DRAFT'
                AND branch_id IS NOT NULL
                AND version_type = 'version'
                AND slug = new_value
            );
            suffix := suffix + 1;
          END LOOP;
          UPDATE app_versions SET slug = new_value WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    // Step 2: Create the instance-wide partial unique index — duplicates resolved above.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "app_versions_slug_default_branch_unique"
      ON app_versions (slug)
      WHERE status = 'DRAFT'
        AND branch_id IS NOT NULL
        AND version_type = 'version'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "app_versions_slug_default_branch_unique"`);
  }
}
