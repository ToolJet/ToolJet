import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFirstUserAsSuperAdminForCEInstances1698843356891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (getTooljetEdition() !== TOOLJET_EDITIONS.EE) {
      console.log('Skipping migration as it is not EE edition');
      return;
    }
    const manager = queryRunner.manager;
    /* Check for first user or super-admin  */
    const query = `
            WITH FirstUser AS (
              SELECT id
              FROM users
              WHERE NOT EXISTS (
                SELECT 1 FROM users WHERE user_type = 'instance'
              )
              ORDER BY created_at
              LIMIT 1
            )
            
            UPDATE users
            SET user_type = 'instance'
            FROM FirstUser
            WHERE users.id = FirstUser.id
            RETURNING email;
          `;

    const result = await manager.query(query);
    if (result[0][0]) console.log(`--- converted the first user ${result[0][0].email} to super admin ----`);
    else console.log(`--- Instance already has super admins. Skipping migration ----`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
