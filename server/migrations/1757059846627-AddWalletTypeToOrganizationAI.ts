import { MigrationInterface, QueryRunner, TableColumn} from 'typeorm';

export class AddWalletTypeToOrganizationAI1757059846627 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop unique constraints on organization_id
    await queryRunner.query(`
      ALTER TABLE "organizations_ai_feature" 
      DROP CONSTRAINT IF EXISTS "UQ_95399755b73980d4cfabd03ff32",
      DROP CONSTRAINT IF EXISTS "organizations_ai_feature_organization_id_key"
    `);

    // 2. Drop unique indexes on organization_id
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_UNIQUE_ORG_AI_FEATURE";
      DROP INDEX IF EXISTS "IDX_organizations_ai_feature_organization_id_unique";
    `);

    // 3. Drop old columns
    await queryRunner.dropColumn(
      'organizations_ai_feature',
      'ai_credit_fixed'
    );
    await queryRunner.dropColumn(
      'organizations_ai_feature',
      'ai_credit_multiplier'
    );

    // 4. Rename renew_date -> expiry_date (nullable)
    await queryRunner.query(
      `ALTER TABLE "organizations_ai_feature" RENAME COLUMN "renew_date" TO "expiry_date"`
    );
    await queryRunner.query(
      `ALTER TABLE "organizations_ai_feature" ALTER COLUMN "expiry_date" DROP NOT NULL`
    );

    // 5. Create enum for wallet_type
    await queryRunner.query(`DROP TYPE IF EXISTS "wallet_type_enum" CASCADE`);
    await queryRunner.query(
      `CREATE TYPE "wallet_type_enum" AS ENUM ('recurring', 'topup', 'fixed')`
    );

    // 6. Add wallet_type column (nullable first so we can backfill)
    await queryRunner.addColumn(
      'organizations_ai_feature',
      new TableColumn({
        name: 'wallet_type',
        type: 'wallet_type_enum',
        isNullable: true,
      })
    );

    // 7. Backfill existing rows with default value
    await queryRunner.query(
      `UPDATE "organizations_ai_feature" SET "wallet_type" = 'recurring' WHERE "wallet_type" IS NULL`
    );

    // 8. Set NOT NULL constraint
    await queryRunner.query(
      `ALTER TABLE "organizations_ai_feature" ALTER COLUMN "wallet_type" SET NOT NULL`
    );

    // 9. Add unique constraint (organization_id, wallet_type)
    await queryRunner.query(
      `ALTER TABLE "organizations_ai_feature" ADD CONSTRAINT "UQ_org_wallet_type" UNIQUE ("organization_id", "wallet_type")`
    );

    // 10. Update balance column type to float
    await queryRunner.query(
      `ALTER TABLE "organizations_ai_feature" ALTER COLUMN "balance" TYPE numeric(12,2) USING balance::numeric`
    );

    // 11.Add new totalAmount column with default 0
    await queryRunner.addColumn(
      'organizations_ai_feature',
      new TableColumn({
        name: 'total_amount',
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop unique constraint (org_id, wallet_type)
    await queryRunner.query(
      `ALTER TABLE "organizations_ai_feature" DROP CONSTRAINT IF EXISTS "UQ_org_wallet_type"`
    );

    // 2. Remove wallet_type column
    await queryRunner.dropColumn('organizations_ai_feature', 'wallet_type');
    await queryRunner.query(`DROP TYPE IF EXISTS "wallet_type_enum"`);

    // 3. Rename expiry_date back to renew_date (NOT NULL)
    await queryRunner.query(
      `ALTER TABLE "organizations_ai_feature" RENAME COLUMN "expiry_date" TO "renew_date"`
    );
    await queryRunner.query(
      `ALTER TABLE "organizations_ai_feature" ALTER COLUMN "renew_date" SET NOT NULL`
    );

    // 4. Re-add old columns
    await queryRunner.addColumn(
      'organizations_ai_feature',
      new TableColumn({
        name: 'ai_credit_fixed',
        type: 'int',
      })
    );

    await queryRunner.addColumn(
      'organizations_ai_feature',
      new TableColumn({
        name: 'ai_credit_multiplier',
        type: 'int',
      })
    );

    // 5. Restore unique constraint on organization_id
    await queryRunner.query(
      `ALTER TABLE "organizations_ai_feature" ADD CONSTRAINT "organizations_ai_feature_organization_id_key" UNIQUE ("organization_id")`
    );

    // 6. Restore unique index on organization_id
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_UNIQUE_ORG_AI_FEATURE" ON "organizations_ai_feature" ("organization_id")`
    );
  }
}
