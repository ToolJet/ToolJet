import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAutoCommitColumnToOrgGitTable1708320592518 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organization_git_sync',
      new TableColumn({
        name: 'auto_commit',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
