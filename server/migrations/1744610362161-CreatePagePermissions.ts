import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';

export class CreatePagePermissions1744610362161 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (getTooljetEdition() === TOOLJET_EDITIONS.CE) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'page_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'page_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['SINGLE', 'GROUP'],
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'page_permissions',
      new TableForeignKey({
        columnNames: ['page_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pages',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('page_permissions');
  }
}
