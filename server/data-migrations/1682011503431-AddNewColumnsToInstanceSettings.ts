import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddNewColumnsToInstanceSettings1682011503431 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('instance_settings', [
      new TableColumn({
        name: 'label',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'label_key',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'data_type',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'helper_text',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'helper_text_key',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'type',
        type: 'enum',
        enumName: 'settings_type',
        enum: ['user', 'system'],
        default: `'user'`,
        isNullable: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
