import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class CreateOrganizationThemes1716885935683 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organization_themes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'definition',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'is_default',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'is_basic',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'organization_themes',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createUniqueConstraint(
      'organization_themes',
      new TableUnique({
        name: 'organization_id_app_theme_name_unique',
        columnNames: ['organization_id', 'name'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('app_themes');
  }
}
