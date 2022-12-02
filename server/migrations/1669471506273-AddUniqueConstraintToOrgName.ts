import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintToOrgName1669471506273 implements MigrationInterface {
  name = 'AddUniqueConstraintToOrgName1669471506273';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD CONSTRAINT "UQ_9b7ca6d30b94fef571cff876884" UNIQUE ("name")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organizations" DROP CONSTRAINT "UQ_9b7ca6d30b94fef571cff876884"`);
  }
}
