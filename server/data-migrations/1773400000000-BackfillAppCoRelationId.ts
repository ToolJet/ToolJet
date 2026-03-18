import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillAppCoRelationId1773400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill co_relation_id = id for all apps that don't have one set.
    // Without this, findOrCreateStubApp (platform git pull) can't match
    // existing apps by co_relation_id and creates duplicates.
    const result = await queryRunner.query(`
      UPDATE apps
      SET co_relation_id = id
      WHERE co_relation_id IS NULL;
    `);
    console.log(`[BackfillAppCoRelationId] Updated ${result?.[1] ?? 'unknown'} apps with co_relation_id = id`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op: we can't distinguish which apps originally had null co_relation_id
  }
}
