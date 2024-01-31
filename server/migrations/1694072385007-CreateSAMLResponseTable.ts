import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSSOResponseTable1694072385007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sso_responses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'sso',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'response',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'config_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'expiry',
            type: 'timestamp',
            default: `CURRENT_TIMESTAMP + INTERVAL '15 minutes'`,
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
    await queryRunner.dropTable('sso_responses');
  }
}
