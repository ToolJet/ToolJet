import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPromoteAndReleaseAppColumn1749810303901 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('permission_groups', [
      new TableColumn({
        name: 'app_promote',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
      new TableColumn({
        name: 'app_release',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    ]);

    // Admin default groups: always true
    await queryRunner.query(`
      UPDATE permission_groups
      SET app_promote = true, app_release = true
      WHERE type = 'default' AND name = 'admin'
    `);

    // Builder default groups: match existing app_create or app_delete
    await queryRunner.query(`
      UPDATE permission_groups
      SET app_promote = (app_create OR app_delete),
          app_release = (app_create OR app_delete)
      WHERE type = 'default' AND name = 'builder'
    `);

    // Custom groups: match existing app_create or app_delete
    await queryRunner.query(`
      UPDATE permission_groups
      SET app_promote = (app_create OR app_delete),
          app_release = (app_create OR app_delete)
      WHERE type = 'custom'
    `);

    // end-user default groups: already false from column default, no update needed
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('permission_groups', 'app_release');
    await queryRunner.dropColumn('permission_groups', 'app_promote');
  }
}