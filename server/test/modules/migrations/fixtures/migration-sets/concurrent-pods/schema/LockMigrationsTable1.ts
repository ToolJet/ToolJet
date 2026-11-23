import { MigrationInterface, QueryRunner } from 'typeorm';

// ToolJet runs migrations when the app boots up in containerized environments
// Apart from db migrations we also do data manipulations using migrations which may not be idempotent
// Therefore we need to introduce lock to handle concurrency issues
// https://github.com/typeorm/typeorm/issues/3400
//
// We are thus creating two migrations that ensure at least one will be run
// NOTE: The expectation is that migrations are to be run in a single transaction
// such that when the transaction has ended the lock will be released
export class LockMigrationsTable1234567890000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DELETE FROM migrations where name = 'LockMigrationsTable1234567891000'");
    await queryRunner.query('LOCK TABLE migrations;');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
