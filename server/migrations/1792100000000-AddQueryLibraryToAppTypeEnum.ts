import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQueryLibraryToAppTypeEnum1792100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ALTER TYPE ... ADD VALUE is non-rollbackable; IF NOT EXISTS keeps it idempotent. Kept as a literal
    // statement so run-all-migrations' planEnumAdditions can pre-commit it on upgrades.
    // lock_timeout fails fast on this hot column; restore it because all migrations share one transaction.
    const [{ lock_timeout: previousLockTimeout }] = await queryRunner.query(`SHOW lock_timeout`);
    await queryRunner.query(`SET LOCAL lock_timeout = '5s'`);
    await queryRunner.query(`ALTER TYPE "app_type" ADD VALUE IF NOT EXISTS 'query_library'`);
    await queryRunner.query(`SELECT set_config('lock_timeout', $1, true)`, [previousLockTimeout]);
  }

  public async down(): Promise<void> {}
}
