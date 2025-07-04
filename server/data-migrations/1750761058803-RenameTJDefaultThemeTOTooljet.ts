import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameTJDefaultThemeTOTooljet1750761058803 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
                UPDATE organization_themes SET name='Tooljet' WHERE name='TJ default';
            `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
                UPDATE organization_themes SET name='TJ default' WHERE name='Tooljet';
            `
        );
    }

}
