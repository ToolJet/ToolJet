import { MigrationInterface, QueryRunner } from 'typeorm';

// No FK: billing history outlives users. Spend indexes are built CONCURRENTLY by ops, outside this transaction.
export class AddUserIdToAiCreditHistory1791305815686 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization_ai_credit_history ADD COLUMN IF NOT EXISTS user_id uuid;
      ALTER TABLE selfhost_customers_ai_credit_history
        ADD COLUMN IF NOT EXISTS user_id uuid,
        ADD COLUMN IF NOT EXISTS organization_id uuid;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization_ai_credit_history DROP COLUMN IF EXISTS user_id;
      ALTER TABLE selfhost_customers_ai_credit_history
        DROP COLUMN IF EXISTS user_id,
        DROP COLUMN IF EXISTS organization_id;
    `);
  }
}
