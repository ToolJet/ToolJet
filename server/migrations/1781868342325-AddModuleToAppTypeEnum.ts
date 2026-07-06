import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModuleToAppTypeEnum1781868342325 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Postgres ALTER TYPE ... ADD VALUE is non-rollbackable; IF NOT EXISTS keeps it idempotent.
        // The new value is not used within this migration (the data migration runs separately).
        // lock_timeout: fail fast instead of queuing behind a lock holder on this hot column.
        await queryRunner.query(`SET LOCAL lock_timeout = '5s';`);
        await queryRunner.query(`
            ALTER TYPE "app_type" ADD VALUE IF NOT EXISTS 'module';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}

}
