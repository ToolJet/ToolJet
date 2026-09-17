import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoRelationIdToAppEntities1743997765065 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE components ADD COLUMN IF NOT EXISTS "co_relation_id" uuid DEFAULT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE components DROP COLUMN IF EXISTS "co_relation_id"`);
  }

}
