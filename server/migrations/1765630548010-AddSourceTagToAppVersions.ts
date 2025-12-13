import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSourceTagToAppVersions1765630548010 implements MigrationInterface {
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
/**
 * Adds source_tag column to track version's sync state with GitHub tags:
 * - null: Version created locally, not synced → creates GitHub tag on save
 * - "{app_name}/{version_name}": Version synced with this tag (updated on every pull) → no tag created on save
 */