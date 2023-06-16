import { AppVersion } from 'src/entities/app_version.entity';
import { EntityManager, MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class AddUniqueConstraintToVersionName1655726247638 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    await this.migrateVersions(entityManager);
    await queryRunner.createUniqueConstraint(
      'app_versions',
      new TableUnique({
        name: 'name_app_id_app_versions_unique',
        columnNames: ['name', 'app_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint('app_versions', 'name_app_id_app_versions_unique');
  }

  private async migrateVersions(entityManager: EntityManager) {
    const appVersions = await entityManager.find(AppVersion, {
      select: ['name', 'appId', 'id'],
    });
    for (const version of appVersions) {
      const { name, appId, id } = version;
      const versionsWithSameName = await entityManager.find(AppVersion, {
        where: {
          appId,
          name,
        },
        select: ['name', 'appId', 'id'],
      });
      if (versionsWithSameName.length > 1) {
        const versionsNeedToChange = versionsWithSameName.filter((appVersion) => appVersion.id !== id);
        for (const versionToChange of versionsNeedToChange) {
          await entityManager.update(
            AppVersion,
            { id: versionToChange.id },
            { name: `${versionToChange.name}_${Date.now()}` }
          );
        }
      }
    }
  }
}
