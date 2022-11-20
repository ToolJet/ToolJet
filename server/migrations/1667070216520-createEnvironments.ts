import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class createEnvironments1667070216520 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'app_environments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'app_version_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: true,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'app_environments',
      new TableForeignKey({
        columnNames: ['app_version_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_versions',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createUniqueConstraint(
      'app_environments',
      new TableUnique({
        name: 'version_env_name_app_environments_unique',
        columnNames: ['app_version_id', 'name'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('app_environments');
  }
}
