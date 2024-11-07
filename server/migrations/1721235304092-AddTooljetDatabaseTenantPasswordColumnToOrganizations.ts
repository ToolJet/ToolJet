import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddTooljetDatabaseTenantPasswordColumnToOrganizations1721235304092 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organization_tjdb_configurations',
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
            isUnique: true,
          },
          {
            name: 'pg_user',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'pg_password',
            type: 'varchar',
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
      })
    );

    await queryRunner.createForeignKey(
      'organization_tjdb_configurations',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('organization_tjdb_configurations', true, true, true);
  }
}
