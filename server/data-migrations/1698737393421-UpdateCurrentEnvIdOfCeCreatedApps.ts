import { MigrationInterface, QueryRunner } from 'typeorm';
import { updateCurrentEnvironmentId } from '@helpers/migration.helper';

/* This migration file will only work for the customers who are migrating from CE to EE */
export class UpdateCurrentEnvIdOfCeCreatedApps1698737393421 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    /* Check for first user or super-admin  */
    const query = `
    SELECT
      COUNT(*) AS total_users,
      COUNT(CASE WHEN user_type = 'instance' THEN 1 ELSE NULL END) AS instance_users
    FROM users
  `;
    const countResult = await manager.query(query);
    const count = countResult[0];
    if (count?.total_users > 0 && count?.instance_users > 0) {
      console.log('Skipping the migration -- UpdateCurrentEnvIdOfCeCreatedApps1698737393421');
      return;
    }
    /* There is no super admin yet. Means, the customer is using the same CE DB for upgaring to the EE */
    await updateCurrentEnvironmentId(manager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
