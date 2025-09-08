import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWalletTypeForSelfhostAI1757315333187 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop unique constraint on selfhost_customer_id (from isUnique: true in initial migration)
    await queryRunner.query(`
        ALTER TABLE "selfhost_customers_ai_feature" 
        DROP CONSTRAINT IF EXISTS "UQ_88db42f668de2132f13b5720a49",
        DROP CONSTRAINT IF EXISTS "selfhost_customers_ai_feature_selfhost_customer_id_key"
      `);

    // 2. Drop unique index on selfhost_customer_id (created explicitly in initial migration)
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

    // 4. Make renew_date nullable
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" ALTER COLUMN "renew_date" DROP NOT NULL`
    );

    // 5. Create enum for wallet_type
    await queryRunner.query(
      `CREATE TYPE "wallet_type_enum_selfhost" AS ENUM ('recurring', 'topup', 'fixed')`
    );

    // 6. Add wallet_type column (nullable first so we can backfill)
    await queryRunner.addColumn(
      'selfhost_customers_ai_feature',
      new TableColumn({
        name: 'wallet_type',
        type: 'wallet_type_enum_selfhost',
        isNullable: true,
      })
    );

    // 7. Backfill existing rows with default value
    await queryRunner.query(
      `UPDATE "selfhost_customers_ai_feature" SET "wallet_type" = 'recurring'`
    );

    // 8. Set NOT NULL constraint
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" ALTER COLUMN "wallet_type" SET NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remove wallet_type
    await queryRunner.dropColumn('selfhost_customers_ai_feature', 'wallet_type');
    await queryRunner.query(`DROP TYPE "wallet_type_enum_selfhost"`);

    // 2. Revert renew_date back to NOT NULL
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" ALTER COLUMN "renew_date" SET NOT NULL`
    );

    // 3. Re-add old columns
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

    // 4. Restore unique constraint on selfhost_customer_id
    await queryRunner.query(
      `ALTER TABLE "selfhost_customers_ai_feature" ADD CONSTRAINT "selfhost_customers_ai_feature_selfhost_customer_id_key" UNIQUE ("selfhost_customer_id")`
    );

    // 5. Restore unique index on selfhost_customer_id
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_UNIQUE_SELFHOST_CUSTOMER_AI_FEATURE" ON "selfhost_customers_ai_feature" ("selfhost_customer_id")`
    );
  }
}
