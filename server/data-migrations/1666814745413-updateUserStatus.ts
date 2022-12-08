import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateUserStatus1666814745413 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    await entityManager.query(
      "update users set status = 'invited', source = 'invite' where invitation_token IS NOT NULL;"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
