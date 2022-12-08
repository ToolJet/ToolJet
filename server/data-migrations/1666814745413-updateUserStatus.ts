import { SOURCE, USER_STATUS } from 'src/helpers/user_lifecycle';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateUserStatus1666814745413 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    await entityManager.query('update users set status = $1, source = $2 where invitation_token IS NULL;', [
      USER_STATUS.ACTIVE,
      SOURCE.INVITE,
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
