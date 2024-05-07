import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpdatedAtColumnToLayouts1709794417386 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE layouts ADD COLUMN "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE layouts DROP COLUMN "updated_at"');
  }
}
