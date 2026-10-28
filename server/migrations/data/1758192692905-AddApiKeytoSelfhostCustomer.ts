import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApiKeytoSelfhostCustomer1758192692905 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1 Add new column to selfhost_customers with default NULL
    await queryRunner.query(`
      ALTER TABLE "selfhost_customers"
      ADD COLUMN "ai_api_key" varchar(255) DEFAULT NULL
    `);

    await queryRunner.query(`
      UPDATE "selfhost_customers" sc
      SET "ai_api_key" = f.api_key
      FROM "selfhost_customers_ai_feature" f
      WHERE sc.id = f.selfhost_customer_id
    `);

    // 2 Drop the api_key column from selfhost_customers_ai_feature
    await queryRunner.query(`
      ALTER TABLE "selfhost_customers_ai_feature"
      DROP COLUMN "api_key"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
