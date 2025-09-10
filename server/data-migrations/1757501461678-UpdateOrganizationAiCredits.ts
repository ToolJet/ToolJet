import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrganizationAiCredits1757501461678 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fetch all recurring wallets with license info
    const result = await queryRunner.query(`
      SELECT 
        oaf.*,
        ol.expiry_with_grace_period,
        ol.terms,
        ol.plan
      FROM organizations_ai_feature oaf
      LEFT JOIN organization_license ol ON ol.organization_id = oaf.organization_id
      WHERE oaf.wallet_type = 'recurring'
    `);

    if (!result?.length) return;

    const updates: { id: string; newBalance: number; orgId: string }[] = [];
    const now = new Date();

    for (const row of result) {
      let newBalance = 300; // default balance for free plan
      if (row?.expiry_with_grace_period) {
        const isLicenseExpired = new Date(row.expiry_with_grace_period).toISOString() <= now.toISOString();
        if (!isLicenseExpired) {
          const users = row?.terms?.users;
          const plan = row?.plan;

          if (plan === 'team' && users?.editor > 0) {
            newBalance = users.editor * 2000;
          } else if (plan === 'pro' && users?.editor > 0) {
            newBalance = users.editor * 800;
          }
        }
      }
      //If No credits used skip top up
      if (newBalance !== row.balance) {
        updates.push({
          id: row.id,
          newBalance,
          orgId: row.organization_id,
        });
      }
    }

    // Bulk update balances only
    const ids = updates.map((u) => u.id);
    const balances = updates.map((u) => u.newBalance);

    await queryRunner.query(
      `
      UPDATE organizations_ai_feature AS oaf
      SET balance = u.new_balance
      FROM (
        SELECT 
          unnest($1::uuid[]) AS id,
          unnest($2::numeric[]) AS new_balance
      ) AS u(id, new_balance)
      WHERE oaf.id = u.id
    `,
      [ids, balances]
    );

    // Insert into credit history row by row
    for (const u of updates) {
      await queryRunner.query(
        `
        INSERT INTO organization_ai_credit_history (
          id,
          organization_id,
          amount,
          ai_credits,
          operation,
          wallet_type,
          transaction_type,
          status,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          NULL,
          $2,
          'recurring add on',
          'recurring',
          'credit',
          'success',
          NOW(),
          NOW()
        )
      `,
        [u.orgId, u.newBalance]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove credit history for this operation
    await queryRunner.query(`
      DELETE FROM organization_ai_credit_history
      WHERE operation = 'recurring add on'
        AND wallet_type = 'recurring'
    `);
  }
}
