import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class addUserStatusAndSource1666763190092 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'status',
        type: 'enum',
        enumName: 'status',
        enum: ['invited', 'verified', 'active', 'archived'],
        default: `'invited'`,
        isNullable: false,
      }),
      new TableColumn({
        name: 'source',
        type: 'enum',
        enumName: 'source',
        enum: ['signup', 'invite', 'google', 'git', 'openid'],
        default: `'invite'`,
        isNullable: false,
      }),
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
    await queryRunner.dropColumns('users', ['status', 'source', 'user_type']);
  }
}
