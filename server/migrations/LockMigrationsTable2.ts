import { MigrationInterface, QueryRunner } from 'typeorm';

export class LockMigrationsTable1234567891000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DELETE FROM migrations where name = 'LockMigrationsTable1234567890000'");
    await queryRunner.query('LOCK TABLE migrations;');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
