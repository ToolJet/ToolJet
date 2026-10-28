import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTooljetThemeToToolJet1752298708040 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
                UPDATE organization_themes SET name='ToolJet' WHERE name='Tooljet';
            `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
                UPDATE organization_themes SET name='Tooljet' WHERE name='ToolJet';
            `
    );
  }
}
