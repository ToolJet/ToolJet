import { MigrationInterface, QueryRunner } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { filePathForEnvVars } from '../scripts/database-config-utils';

export class MigrateSSHBranchColumnData1754048735123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // For older users: if the GITSYNC_TARGET_BRANCH environment variable is configured, use the branch from .env variable in all the workspaces of that instance
    // Otherwise, we default to 'master' since it was the default branch used previously.
    let data: any = process.env;
    const envVarsFilePath = filePathForEnvVars(process.env.NODE_ENV);

    if (fs.existsSync(envVarsFilePath)) {
      const envFileContent = fs.readFileSync(envVarsFilePath);
      const parsedEnvVars = dotenv.parse(envFileContent);
      data = { ...data, ...parsedEnvVars };
    }

    const branch_name = data.GITSYNC_TARGET_BRANCH;

    if (branch_name && branch_name !== 'master') {
      const updateQuery = `UPDATE organization_git_ssh SET git_branch = '${branch_name}'`;
      await queryRunner.query(updateQuery);
    } else {
      const updateQuery = `UPDATE organization_git_ssh SET git_branch = 'master'`;
      await queryRunner.query(updateQuery);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
