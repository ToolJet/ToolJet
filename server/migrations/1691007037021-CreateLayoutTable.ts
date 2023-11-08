import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateLayoutTable1691007037021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'layouts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'type',
            type: 'enum',
            enumName: 'layput_type',
            enum: ['desktop', 'mobile'],
            isNullable: false,
          },
          {
            name: 'top',
            type: 'double precision',
            isNullable: false,
          },
          {
            name: 'left',
            type: 'double precision',
            isNullable: false,
          },
          {
            name: 'width',
            type: 'double precision',
            isNullable: false,
          },
          {
            name: 'height',
            type: 'double precision',
            isNullable: false,
          },
          {
            name: 'component_id',
            type: 'uuid',
            isNullable: false,
          },
        ],
      })
    );

    // Add foreign key to relate Layout with Component
    await queryRunner.createForeignKey(
      'layouts',
      new TableForeignKey({
        columnNames: ['component_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'components',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('layouts');
  }
}
