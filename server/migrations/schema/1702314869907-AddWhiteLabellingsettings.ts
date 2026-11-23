import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class AddWhiteLabellingsettings1702314869907 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'white_labelling',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'text',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'logo',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'favicon',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'INACTIVE'],
            isNullable: false,
            default: `'ACTIVE'`,
          },
        ],
      }),
      true
    );

    await queryRunner.createUniqueConstraint(
      'white_labelling',
      new TableUnique({
        columnNames: ['organizationId'],
      })
    );

    await queryRunner.createForeignKey(
      'white_labelling',
      new TableForeignKey({
        columnNames: ['organizationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('white_labelling');
  }
}
