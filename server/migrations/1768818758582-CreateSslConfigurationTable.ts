import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSslConfigurationTable1768818758582 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ssl_configurations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            default: "''",
            isNullable: false,
          },
          {
            name: 'staging',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'domain',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'fullchain_pem',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'privkey_pem',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cert_pem',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'chain_pem',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'acquired_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
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
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ssl_configurations');
  }
}
