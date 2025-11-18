import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAppVersionResourceMapping1731513700000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'app_version_resource_mappings',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'app_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'app_version_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'resource_type',
                        type: 'enum',
                        enum: [
                            'defaultDataSourceIdMapping',
                            'dataQueryMapping',
                            'appVersionMapping',
                            'appEnvironmentMapping',
                            'appDefaultEnvironmentMapping',
                            'pagesMapping',
                            'componentsMapping',
                        ],
                        enumName: 'app_version_resource_mapping_type',
                        isNullable: false,
                    },
                    {
                        name: 'resource_mappings',
                        type: 'jsonb',
                        isNullable: false,
                        comment: 'Stores mappings for data queries, components, pages, environments, etc.',
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                        isNullable: false,
                    },
                ],
            }),
            true
        );

        // Check and create foreign key for app_id if it doesn't exist
        const appForeignKey = await queryRunner.getTable('app_version_resource_mappings');
        const hasAppForeignKey = appForeignKey?.foreignKeys.some(
            (fk) => fk.columnNames.includes('app_id') && fk.referencedTableName === 'apps'
        );

        if (!hasAppForeignKey) {
            await queryRunner.createForeignKey(
                'app_version_resource_mappings',
                new TableForeignKey({
                    name: 'fk_app_version_resource_mappings_app',
                    columnNames: ['app_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'apps',
                    onDelete: 'CASCADE',
                })
            );
        }

        // Check and create foreign key for app_version_id if it doesn't exist
        const hasAppVersionForeignKey = appForeignKey?.foreignKeys.some(
            (fk) => fk.columnNames.includes('app_version_id') && fk.referencedTableName === 'app_versions'
        );

        if (!hasAppVersionForeignKey) {
            await queryRunner.createForeignKey(
                'app_version_resource_mappings',
                new TableForeignKey({
                    name: 'fk_app_version_resource_mappings_app_version',
                    columnNames: ['app_version_id'],
                    referencedColumnNames: ['id'],
                    referencedTableName: 'app_versions',
                    onDelete: 'CASCADE',
                })
            );
        }

        // Review if we need to add indexes in this table later for performance optimization
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('app_version_resource_mappings');
        await queryRunner.query(`DROP TYPE IF EXISTS "app_version_resource_mapping_type"`);
    }
}