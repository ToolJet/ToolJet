import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPageHeaderColumnToPagesTable1767700000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'pages',
            new TableColumn({
                name: 'page_header',
                type: 'jsonb',
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('pages', 'page_header');
    }
}
