import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserType1744038323831 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.hasColumn('users', 'user_type');

    if (columnExists) {
      return;
    }
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'user_type',
        type: 'enum',
        enumName: 'user_type',
        enum: ['instance', 'workspace'],
        default: `'workspace'`,
        isNullable: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.hasColumn('users', 'user_type');

    if (columnExists) {
      return;
    }
    await queryRunner.dropColumns('users', ['user_type']);
  }
}
