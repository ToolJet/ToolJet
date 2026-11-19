import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSSHBranchColumn1748501592120 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.hasColumn('organization_git_ssh', 'git_branch');
    if (!columnExists) {
      await queryRunner.addColumn(
        'organization_git_ssh',
        new TableColumn({
          name: 'git_branch',
          type: 'varchar',
          default: "'main'",
          isNullable: false,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> { }
}