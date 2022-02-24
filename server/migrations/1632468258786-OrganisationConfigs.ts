import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class OrganisationConfigs1632468258786 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('organizations', [
      new TableColumn({
        name: 'auto_assign',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'enable_sign_up',
        type: 'boolean',
        default: true,
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'sso_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'sso',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'configs',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'disable'",
            isNullable: false,
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
      'sso_configs',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
