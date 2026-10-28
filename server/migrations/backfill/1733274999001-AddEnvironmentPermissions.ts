import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEnvironmentPermissions1733274999001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting migration: Adding environment permissions to apps_group_permissions');

    // Add the four new environment permission columns
    await queryRunner.addColumn(
      'apps_group_permissions',
      new TableColumn({
        name: 'can_access_development',
        type: 'boolean',
        isNullable: false,
        default: true,
      })
    );

    await queryRunner.addColumn(
      'apps_group_permissions',
      new TableColumn({
        name: 'can_access_staging',
        type: 'boolean',
        isNullable: false,
        default: true,
      })
    );

    await queryRunner.addColumn(
      'apps_group_permissions',
      new TableColumn({
        name: 'can_access_production',
        type: 'boolean',
        isNullable: false,
        default: true,
      })
    );

    await queryRunner.addColumn(
      'apps_group_permissions',
      new TableColumn({
        name: 'can_access_released',
        type: 'boolean',
        isNullable: false,
        default: true,
      })
    );

    console.log('Environment permission columns added successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Rolling back migration: Removing environment permissions from apps_group_permissions');

    await queryRunner.dropColumn('apps_group_permissions', 'can_access_released');
    await queryRunner.dropColumn('apps_group_permissions', 'can_access_production');
    await queryRunner.dropColumn('apps_group_permissions', 'can_access_staging');
    await queryRunner.dropColumn('apps_group_permissions', 'can_access_development');

    console.log('Environment permission columns removed successfully');
  }
}
