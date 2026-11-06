import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Cloud: records when an account used its one trial. Null = never claimed. */
export class AddTrialClaimedAtToUser1792000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'trial_claimed_at',
        type: 'timestamptz',
        isNullable: true,
      })
    );

    // Backfill existing trial users: past trials store the user's id in terms.meta.customerId.
    await queryRunner.query(`
      UPDATE users u
      SET    trial_claimed_at = ol.created_at
      FROM   organization_license ol
      WHERE  ol.terms->'meta'->>'customerId' = u.id::text
        AND  u.trial_claimed_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'trial_claimed_at');
  }
}
