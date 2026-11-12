import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Cloud: per-user workspace limit set by the team. Null = default limit. */
export class AddWorkspaceLimitToUser1794466880798 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'workspace_limit',
        type: 'integer',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'workspace_limit');
  }
}
