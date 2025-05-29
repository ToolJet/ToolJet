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
          default: "'master'",
          isNullable: false,
        })
      );
    }
    // need to test the env migrations -> pending
    const branch_name = process.env.GITSYNC_TARGET_BRANCH;
    if (branch_name && branch_name !== 'master') {
      await queryRunner.query(`UPDATE organization_git_ssh SET git_branch = '${branch_name}'`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
