import { TJDefaultTheme } from '@modules/organization-themes/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppThemsv2Fields1724060238202 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        UPDATE organization_themes set definition=$1 where name='TJ default'
      `,
      [TJDefaultTheme]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
