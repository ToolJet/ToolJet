import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropGroupPermissionsOlderRelatedTables1720513124281 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query('DROP TABLE group_permissions, user_group_permissions, app_group_permissions CASCADE;');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
