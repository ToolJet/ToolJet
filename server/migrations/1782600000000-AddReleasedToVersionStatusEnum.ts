import { MigrationInterface, QueryRunner } from 'typeorm';

// version_status_enum was created by AddAppVersionEntity1758793442012 with only
// ('DRAFT', 'PUBLISHED') -- 'RELEASED' was omitted even though AppVersionStatus.RELEASED
// (and the released_at column added in the same migration) have existed since that commit.
export class AddReleasedToVersionStatusEnum1782600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "version_status_enum" ADD VALUE IF NOT EXISTS 'RELEASED';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
