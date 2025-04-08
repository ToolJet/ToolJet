import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSelfhostCustomers1740400726507 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'selfhost_customers',
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
            length: '255',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'license_key',
            type: 'varchar',
            length: '10000',
          },
          {
            name: 'host_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'subpath',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'license_type',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'expiry_date',
            type: 'timestamp',
          },
          {
            name: 'users',
            type: 'int',
          },
          {
            name: 'builders',
            type: 'int',
          },
          {
            name: 'end_users',
            type: 'int',
          },
          {
            name: 'super_admin',
            type: 'int',
          },
          {
            name: 'license_details',
            type: 'json',
          },
          {
            name: 'other_data',
            type: 'json',
          },
          {
            name: 'metadata_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('selfhost_customers');
  }
}
