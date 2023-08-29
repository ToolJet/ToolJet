import { WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';
import { MigrationProgress } from 'src/helpers/utils.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class organizationUsersRemoveDuplicates1693288308041 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const duplicates = await entityManager.query(
      'select sub_query.organization_id, sub_query.user_id from (select count(*) as org_user_count, organization_id, user_id from organization_users group by organization_id, user_id) sub_query where org_user_count > 1'
    );
    if (duplicates && duplicates.length) {
      const migrationProgress = new MigrationProgress(
        'organizationUsersRemoveDuplicates1693288308041',
        duplicates.length
      );

      console.log(`found ${duplicates.length} duplicates in organization_users table`);
      for (const duplicate of duplicates) {
        let idToKeep;
        const duplicatesWithStatus = await entityManager.query(
          'select id, status from organization_users where organization_id=$1 and user_id=$2',
          [duplicate.organization_id, duplicate.user_id]
        );

        if (duplicatesWithStatus && duplicatesWithStatus.length > 0) {
          // Keeping record with status active
          idToKeep = duplicatesWithStatus.find((e) => e.status === WORKSPACE_USER_STATUS.ACTIVE)?.id;

          if (!idToKeep) {
            // Keeping random record
            idToKeep = duplicatesWithStatus[0].id;
          }
        }
        if (idToKeep) {
          await entityManager.query(
            'delete from organization_users where id!=$1 and organization_id=$2 and user_id=$3',
            [idToKeep, duplicate.organization_id, duplicate.user_id]
          );
        }
        migrationProgress.show();
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
