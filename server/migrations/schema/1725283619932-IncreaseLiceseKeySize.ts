import { MigrationInterface, QueryRunner } from 'typeorm';
export class IncreaseLiceseKeySize1725283619932 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
