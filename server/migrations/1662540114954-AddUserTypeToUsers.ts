import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserTypeToUsers1662540114954 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'user_type',
        type: 'enum',
        enumName: 'user_type',
        enum: ['instance', 'workspace'],
        default: `'workspace'`,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'status',
        type: 'enum',
        enumName: 'status',
        enum: ['active', 'archived'],
        default: `'active'`,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'user_type');
    await queryRunner.dropColumn('users', 'status');
  }
}
