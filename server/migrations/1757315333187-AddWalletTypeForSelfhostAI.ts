import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWalletTypeForSelfhostAI1757315333187 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop old unique constraints on selfhost_customer_id
    await queryRunner.query(`
      ALTER TABLE "selfhost_customers_ai_feature" 
      DROP CONSTRAINT IF EXISTS "UQ_88db42f668de2132f13b5720a49",
      DROP CONSTRAINT IF EXISTS "selfhost_customers_ai_feature_selfhost_customer_id_key"
    `);

    // 2. Drop old unique index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_UNIQUE_SELFHOST_CUSTOMER_AI_FEATURE"`
    );

    // 3. Drop old columns
    await queryRunner.dropColumn(
      'selfhost_customers_ai_feature',
      'ai_credit_fixed'
    );
    await queryRunner.dropColumn(
      'selfhost_customers_ai_feature',
      'ai_credit_multiplier'
    );

    // 4. Rename renew_date -> expiry_date (nullable)
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" RENAME COLUMN "renew_date" TO "expiry_date"`
    );
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" ALTER COLUMN "expiry_date" DROP NOT NULL`
    );

    // 5. Add wallet_type column (nullable first so we can backfill)
    await queryRunner.addColumn(
      'selfhost_customers_ai_feature',
      new TableColumn({
        name: 'wallet_type',
        type: 'wallet_type_enum', //Reusing the enum from organizations_ai_feature
        isNullable: true,
      })
    );

    // 6. Backfill existing rows with default value
    await queryRunner.query(
      `UPDATE "selfhost_customers_ai_feature" SET "wallet_type" = 'recurring' WHERE "wallet_type" IS NULL`
    );

    // 7. Set NOT NULL
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" ALTER COLUMN "wallet_type" SET NOT NULL`
    );

    // 8. Add composite unique constraint (selfhost_customer_id, wallet_type)
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" ADD CONSTRAINT "UQ_selfhost_customer_wallet_type" UNIQUE ("selfhost_customer_id", "wallet_type")`
    );

    // 9. Update balance column type to float
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" ALTER COLUMN "balance" TYPE numeric(12,2) USING balance::numeric`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop composite unique constraint
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" DROP CONSTRAINT IF EXISTS "UQ_selfhost_customer_wallet_type"`
    );

    // 2. Remove wallet_type
    await queryRunner.dropColumn('selfhost_customers_ai_feature', 'wallet_type');
    await queryRunner.query(`DROP TYPE IF EXISTS "wallet_type_enum" CASCADE`);

    // 3. Rename expiry_date back to renew_date (NOT NULL)
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" RENAME COLUMN "expiry_date" TO "renew_date"`
    );
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" ALTER COLUMN "renew_date" SET NOT NULL`
    );

    // 4. Re-add old columns
    await queryRunner.addColumn(
      'selfhost_customers_ai_feature',
      new TableColumn({
        name: 'ai_credit_fixed',
        type: 'int',
      })
    );

    await queryRunner.addColumn(
      'selfhost_customers_ai_feature',
      new TableColumn({
        name: 'ai_credit_multiplier',
        type: 'int',
      })
    );

    // 5. Restore unique constraint on selfhost_customer_id
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" ADD CONSTRAINT "selfhost_customers_ai_feature_selfhost_customer_id_key" UNIQUE ("selfhost_customer_id")`
    );

    // 6. Restore unique index
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_UNIQUE_SELFHOST_CUSTOMER_AI_FEATURE" ON "selfhost_customers_ai_feature" ("selfhost_customer_id")`
    );
  }
}
