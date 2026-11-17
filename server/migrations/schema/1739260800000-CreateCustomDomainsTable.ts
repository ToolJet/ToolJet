import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique, TableIndex } from 'typeorm';

export class CreateCustomDomainsTable1739260800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'custom_domains',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'domain',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'provider_hostname_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending_verification', 'pending_ssl', 'active', 'failed', 'deleted'],
            isNullable: false,
            default: `'pending_verification'`,
          },
          {
            name: 'ssl_status',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'verification_errors',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'cname_target',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
      true
    );

    await queryRunner.createUniqueConstraint(
      'custom_domains',
      new TableUnique({
        columnNames: ['organization_id'],
      })
    );

    await queryRunner.createUniqueConstraint(
      'custom_domains',
      new TableUnique({
        columnNames: ['domain'],
      })
    );

    await queryRunner.createForeignKey(
      'custom_domains',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createIndex(
      'custom_domains',
      new TableIndex({
        columnNames: ['status'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('custom_domains');
  }
}
