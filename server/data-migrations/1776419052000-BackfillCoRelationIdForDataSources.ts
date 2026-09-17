import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillCoRelationIdForDataSources1776419052000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const backfillResult = await queryRunner.query(`
      UPDATE "data_sources"
      SET "co_relation_id" = "id"
      WHERE "co_relation_id" IS NULL;
    `);
    console.log(
      `[BackfillCoRelationIdForDataSources] Backfilled ${backfillResult?.[1] ?? 'unknown'} data_sources with co_relation_id = id`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op: we can't distinguish which rows originally had null co_relation_id
  }
}
