import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillAppCoRelationId1773400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: For app_versions with NULL co_relation_id, copy from a sibling version
    // of the same app that already has it set (e.g. a branch version that was pulled).
    const versionResult = await queryRunner.query(`
      UPDATE app_versions av
      SET co_relation_id = sibling.co_relation_id
      FROM (
        SELECT DISTINCT ON (app_id) app_id, co_relation_id
        FROM app_versions
        WHERE co_relation_id IS NOT NULL
      ) sibling
      WHERE av.app_id = sibling.app_id
        AND av.co_relation_id IS NULL;
    `);
    console.log(`[BackfillAppCoRelationId] Updated ${versionResult?.[1] ?? 'unknown'} app_versions from sibling versions`);

    // Step 2: For apps with NULL co_relation_id, copy from any of their versions
    // that has co_relation_id set.
    const appResult = await queryRunner.query(`
      UPDATE apps a
      SET co_relation_id = v.co_relation_id
      FROM (
        SELECT DISTINCT ON (app_id) app_id, co_relation_id
        FROM app_versions
        WHERE co_relation_id IS NOT NULL
      ) v
      WHERE a.id = v.app_id
        AND a.co_relation_id IS NULL;
    `);
    console.log(`[BackfillAppCoRelationId] Updated ${appResult?.[1] ?? 'unknown'} apps from their versions`);

    // Step 3: For remaining apps still with NULL co_relation_id (no versions have it),
    // fall back to apps.id. These are apps that were never pushed to git.
    const fallbackResult = await queryRunner.query(`
      UPDATE apps
      SET co_relation_id = id
      WHERE co_relation_id IS NULL;
    `);
    console.log(`[BackfillAppCoRelationId] Fallback: updated ${fallbackResult?.[1] ?? 'unknown'} apps with co_relation_id = id`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op: we can't distinguish which apps originally had null co_relation_id
  }
}
