import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Relax app name uniqueness for GIT-created apps.
 *
 * With workspace branches, the same app (same co_relation_id) exists as
 * separate App entities on each branch — they legitimately share the same name.
 * Replace the blanket UNIQUE(name, org, type) constraint with a partial index
 * that only enforces uniqueness for DEFAULT-created apps.
 *
 * GIT app uniqueness is guaranteed by AppBranchState's
 * UNIQUE(organization_id, branch_id, co_relation_id).
 *
 * The index keeps the same name so existing catchDbException(APP_NAME_UNIQUE)
 * calls continue to work for DEFAULT apps.
 *
 * This lives in data-migrations/ (not migrations/) so it runs AFTER the older
 * data-migrations that create/modify the same constraint:
 *   - 1684157120658-AddUniqueConstraintToAppName
 *   - 1705379107714-AddAppNameAppTypeWorkspaceConstraint
 */
export class RelaxAppNameUniqueForGitApps1773100000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE apps DROP CONSTRAINT IF EXISTS app_name_organization_id_unique;
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS app_name_organization_id_unique;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX app_name_organization_id_unique
        ON apps (name, organization_id, type)
        WHERE creation_mode = 'DEFAULT';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS app_name_organization_id_unique;`);
    await queryRunner.query(`
      ALTER TABLE apps ADD CONSTRAINT app_name_organization_id_unique UNIQUE (name, organization_id, type);
    `);
  }
}
