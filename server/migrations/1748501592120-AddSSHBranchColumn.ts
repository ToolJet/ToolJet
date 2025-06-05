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
    // For older users: if the GITSYNC_TARGET_BRANCH environment variable is configured, use the branch from .env variable in all the workspaces of that instance
    // Otherwise, we default to 'master' since it was the default branch used previously.
    const branch_name = process.env.GITSYNC_TARGET_BRANCH;
    if (branch_name && branch_name !== 'master') {
      await queryRunner.query(`UPDATE organization_git_ssh SET git_branch = '${branch_name}'`);
    } else {
      await queryRunner.query(`UPDATE organization_git_ssh SET git_branch = 'master'`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
// Migration Dev testing pending