import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'SeedMissingAppEnvironments1787563359142';

// TJDB environments H0 (DEV-84): every organization needs the 3 app_environments rows
// (development/staging/production) to have anything to key an internal_table_relations row
// against later. Organizations created through a path that bypasses
// SetupOrganizationsUtilService.create() (see seedOrgEnvironmentsAndDefaultBranch,
// src/helpers/utils.helper.ts) can have zero rows here. Mirrors the shape of the sibling
// EnsureDefaultBranchForAllOrganizations1781740800000 migration, which already backfills the
// default branch unconditionally for every org — this does the same for environments.
export class SeedMissingAppEnvironments1787563359142 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`
      SELECT COUNT(*) FROM organizations o
      WHERE NOT EXISTS (SELECT 1 FROM app_environments ae WHERE ae.organization_id = o.id)
    `);
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Organizations missing app_environments: ${total}`);

    if (total > 0) {
      await queryRunner.query(`
        INSERT INTO app_environments (organization_id, name, "default", priority)
        SELECT o.id, e.name, e.is_default, e.priority
        FROM organizations o
        CROSS JOIN (
          VALUES ('development', false, 1), ('staging', false, 2), ('production', true, 3)
        ) AS e(name, is_default, priority)
        WHERE NOT EXISTS (
          SELECT 1 FROM app_environments ae WHERE ae.organization_id = o.id
        )
        ON CONFLICT (organization_id, name) DO NOTHING;
      `);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfilled app_environments for ${total} organization(s).`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Deliberately a no-op. This migration only ever inserted for an org that had zero
    // app_environments rows — by the time down() runs, that org's 3 rows are indistinguishable
    // from any other org's normally-seeded 3 rows (same names, same priorities). Deleting by
    // shape would delete every org's environments, not just the backfilled ones — same trade-off
    // the sibling EnsureDefaultBranchForAllOrganizations1781740800000 migration accepts for the
    // branch side. Reversing this migration means restoring from a pre-migration backup.
  }
}
