import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModuleToResourceTypeEnum1781869753341 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Backs `granular_permissions.type`. Postgres ALTER TYPE ... ADD VALUE is non-rollbackable;
        // IF NOT EXISTS keeps it idempotent. The value is consumed by the data migration (separate run).
        await queryRunner.query(`SET LOCAL lock_timeout = '5s';`);
        await queryRunner.query(`
            ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'module';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}

}
