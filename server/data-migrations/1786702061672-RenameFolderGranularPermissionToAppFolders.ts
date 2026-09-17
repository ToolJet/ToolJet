import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameFolderGranularPermissionToAppFolders1786702061672 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename the plain 'folder' granular permission (app folders) to 'App folders' so it reads
    // distinctly from 'Workflow folders' / 'Module folders'. Scoped to the exact prior seed value
    // so any org that already customized this name is left untouched.
    await queryRunner.query(`
      UPDATE granular_permissions
      SET name = 'App folders'
      WHERE type = 'folder' AND name = 'Folders';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE granular_permissions
      SET name = 'Folders'
      WHERE type = 'folder' AND name = 'App folders';
    `);
  }
}
