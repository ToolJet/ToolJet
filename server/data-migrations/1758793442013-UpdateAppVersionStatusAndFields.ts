import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersionStatus } from 'src/entities/app_version.entity';
export class UpdateAppVersionStatusAndFields1758793442013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const allVersions = await queryRunner.query(`
        SELECT id FROM app_versions
    `);
    const allDevelopmentVersionIds = await queryRunner.query(`
            SELECT av.id
            FROM app_versions av
            INNER JOIN app_environments ae ON av.current_environment_id = ae.id
            WHERE ae.name = 'development'
        `);
    const developmentVersionIds = allDevelopmentVersionIds.map((row) => row.id);
    const nonDevelopmentVersionIDs = allVersions
      .filter((version) => !developmentVersionIds.includes(version.id))
      .map((row) => row.id);
    if (nonDevelopmentVersionIDs && nonDevelopmentVersionIDs.length) {
      await queryRunner.query(
        `UPDATE app_versions SET status = '${AppVersionStatus.PUBLISHED}' WHERE id = ANY($1::uuid[])`,
        [nonDevelopmentVersionIDs]
      );
    }
    if (developmentVersionIds && developmentVersionIds.length) {
      await queryRunner.query(
        `UPDATE app_versions SET status = '${AppVersionStatus.DRAFT}' WHERE id = ANY($1::uuid[])`,
        [developmentVersionIds]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
// For older versions: Set status based on environment
// - Non-development versions → PUBLISHED (they are already in a non-editable state)
// - Development versions → DRAFT (they are still in development and users may need to edit them)
