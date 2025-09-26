import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncreaseWhiteLabellingLogoFaviconSize1722729600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE white_labelling 
      ALTER COLUMN logo TYPE varchar(1024),
      ALTER COLUMN favicon TYPE varchar(1024)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> { }
}