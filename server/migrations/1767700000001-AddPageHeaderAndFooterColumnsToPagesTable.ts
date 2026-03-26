import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPageHeaderAndFooterColumnsToPagesTable1767700000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('pages', [
            new TableColumn({
                name: 'page_header',
                type: 'jsonb',
                isNullable: true,
            }),
            new TableColumn({
                name: 'page_footer',
                type: 'jsonb',
                isNullable: true,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('pages', 'page_footer');
        await queryRunner.dropColumn('pages', 'page_header');
    }
}
