import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWalletTypeToOrganizationAI1757059846627 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop unique index on organization_id
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_UNIQUE_ORG_AI_FEATURE"`
    );

    // 2. Drop old columns
    await queryRunner.dropColumn(
      'organizations_ai_feature',
      'ai_credit_fixed'
    );
    await queryRunner.dropColumn(
      'organizations_ai_feature',
      'ai_credit_multiplier'
    );

    // 3. Make renew_date nullable
    await queryRunner.query(
      `ALTER TABLE "organizations_ai_feature" ALTER COLUMN "renew_date" DROP NOT NULL`
    );

    // 4. Create enum for wallet_type
    await queryRunner.query(
      `CREATE TYPE "wallet_type_enum" AS ENUM ('recurring', 'topup', 'fixed')`
    );

    // 5. Add wallet_type column (nullable first so we can backfill)
    await queryRunner.addColumn(
      'organizations_ai_feature',
      new TableColumn({
        name: 'wallet_type',
        type: 'wallet_type_enum',
        isNullable: true,
      })
    );

    // 6. Backfill existing rows with default value
    await queryRunner.query(
      `UPDATE "organizations_ai_feature" SET "wallet_type" = 'recurring'`
    );

    // 7. Set NOT NULL constraint
    await queryRunner.query(
      `ALTER TABLE "organizations_ai_feature" ALTER COLUMN "wallet_type" SET NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remove wallet_type
    await queryRunner.dropColumn('organizations_ai_feature', 'wallet_type');
    await queryRunner.query(`DROP TYPE "wallet_type_enum"`);

    // 2. Revert renew_date back to NOT NULL
    await queryRunner.query(
      `ALTER TABLE "organizations_ai_feature" ALTER COLUMN "renew_date" SET NOT NULL`
    );

    // 3. Re-add old columns
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

    // 4. Restore unique index on organization_id
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_UNIQUE_ORG_AI_FEATURE" ON "organizations_ai_feature" ("organization_id")`
    );
  }
}