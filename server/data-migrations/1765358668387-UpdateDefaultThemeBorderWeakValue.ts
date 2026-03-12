import { MigrationInterface, QueryRunner } from 'typeorm';
import { TJDefaultTheme } from '@modules/organization-themes/constants';

export class UpdateDefaultThemeBorderWeakValue1765358668387 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
               UPDATE organization_themes set definition=$1 where name='ToolJet'
             `,
      [TJDefaultTheme]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
