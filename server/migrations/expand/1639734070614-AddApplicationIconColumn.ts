import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationIconColumn1639734070614 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "apps" ADD COLUMN IF NOT EXISTS "icon" VARCHAR(255) DEFAULT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
