import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSourceTagToAppVersions20251211120000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'app_versions',
            new TableColumn({
                name: 'source_tag',
                type: 'varchar',
                length: '256',
                isNullable: true,
                default: null,
            })
        );
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('app_versions', 'source_tag');
    }
}