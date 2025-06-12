import { MigrationInterface, QueryRunner } from 'typeorm';
const isCloudEdition = process.env.TOOLJET_EDITION === 'cloud';

export class IncreaseLiceseKeySize1749614911505 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // If edition is not cloud, skip this migration
    if (!isCloudEdition) {
      console.log('Migration is only restricted for cloud edition.');
      return; // Exit the migration early
    }
    await queryRunner.query(`
                ALTER TABLE selfhost_customer_licenses 
                ALTER COLUMN license_key TYPE VARCHAR(20000)
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
                ALTER TABLE selfhost_customer_licenses 
                ALTER COLUMN license_key TYPE VARCHAR(2000)
            `);
  }
}
