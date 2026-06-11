import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEnabledFlagAppGit1744630818000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'app_git_sync',
      new TableColumn({
        name: 'allow_editing',
        type: 'boolean',
        isNullable: false,
        default: false,
      })
    );
    await queryRunner.query(`
      UPDATE app_git_sync
      SET allow_editing = true
      WHERE app_id IN (
        SELECT id FROM apps WHERE creation_mode = 'DEFAULT'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
