import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAppVersionEntity1758793442012 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add parent_version_id column
        await queryRunner.addColumn(
            'app_versions',
            new TableColumn({
                name: 'parent_version_id',
                type: 'uuid',
                isNullable: true,
            })
        );

        // Create enum type for version status if it doesn't exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'version_status_enum') THEN
                    CREATE TYPE version_status_enum AS ENUM ('DRAFT', 'PUBLISHED');
                END IF;
            END$$;
        `);
        // Add Version status column
        await queryRunner.addColumn(
            'app_versions',
            new TableColumn({
                name: 'status',
                type: 'version_status_enum',
                isNullable: true,
            })
        );
        // Add description column
        await queryRunner.addColumn(
            'app_versions',
            new TableColumn({
                name: 'description',
                type: 'varchar',
                length: '500',
                isNullable: true,
            })
        );

        // Add published_at column
        await queryRunner.addColumn(
            'app_versions',
            new TableColumn({
                name: 'published_at',
                type: 'timestamp',
                isNullable: true,
            })
        );

        // Add released_at column
        await queryRunner.addColumn(
            'app_versions',
            new TableColumn({
                name: 'released_at',
                type: 'timestamp',
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the columns and enum from the app_versions table
        await queryRunner.dropColumn('app_versions', 'released_at');
        await queryRunner.dropColumn('app_versions', 'published_at');
        await queryRunner.dropColumn('app_versions', 'description');
        await queryRunner.dropColumn('app_versions', 'status');
        await queryRunner.dropColumn('app_versions', 'parent_version_id');
        await queryRunner.query(`DROP TYPE IF EXISTS version_status_enum;`);
    }
}