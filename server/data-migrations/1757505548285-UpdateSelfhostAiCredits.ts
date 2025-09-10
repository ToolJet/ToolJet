import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSelfhostAiCredits1757505548285 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Select all features with joined customer data
    const result: any[] = await queryRunner.query(`
      SELECT 
        scaf.id,
        scaf.balance,
        scaf.wallet_type,
        scaf.selfhost_customer_id,
        sc.expiry_date,
        sc.builders,
        sc.license_details
      FROM selfhost_customers_ai_feature scaf
      LEFT JOIN selfhost_customers sc ON sc.id = scaf.selfhost_customer_id
      WHERE scaf.wallet_type = 'recurring';
    `);

    if (!result?.length) {
      return;
    }

    const now = new Date();
    const updates: { id: string; newBalance: number; selfhostCustomerId: string; walletType: string }[] = [];

    for (const row of result) {
      let newBalance = 300; // default balance for free plan

      if (row?.expiry_date) {
        const isLicenseExpired = new Date(row.expiry_date).toISOString() <= now.toISOString();
        if (!isLicenseExpired) {
          const builders = row?.builders || 0;

          if (row.license_details?.plan?.name === 'team' && builders > 0) {
            newBalance = builders * 2000;
          } else if (row.license_details?.plan?.name === 'pro' && builders > 0) {
            newBalance = builders * 800;
          }
        }
      }

      //If No credits used skip top up
      if (newBalance !== row.balance) {
        updates.push({
          id: row.id,
          newBalance,
          selfhostCustomerId: row.selfhost_customer_id,
          walletType: row.wallet_type,
        });
      }
    }

    if (!updates.length) {
      return;
    }

    // 2. Bulk update balances only
    await queryRunner.query(
      `
      UPDATE selfhost_customers_ai_feature AS scaf
      SET balance = u.new_balance
      FROM (
        SELECT 
          unnest($1::uuid[]) as id,
          unnest($2::numeric[]) as new_balance
      ) AS u(id, new_balance)
      WHERE scaf.id = u.id
    `,
      [updates.map((u) => u.id), updates.map((u) => u.newBalance)]
    );

    // 3. Insert into credit history row-by-row
    for (const update of updates) {
      await queryRunner.query(
        `
        INSERT INTO selfhost_customers_ai_credit_history (
          id,
          amount,
          ai_credits,
          operation,
          wallet_type,
          transaction_type,
          status,
          selfhost_customer_id,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          NULL,
          $1, -- new ai_credits balance
          $2, -- operation
          $3, -- wallet type
          $4, -- transaction type
          $5, -- status
          $6, -- selfhost_customer_id
          NOW(),
          NOW()
        )
      `,
        [update.newBalance, 'recurring add on', 'recurring', 'credit', 'success', update.selfhostCustomerId]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No rollback for balances/history
  }
}
