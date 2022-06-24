import { App } from 'src/entities/app.entity';
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
    const apps = await entityManager.find(App, { relations: ['appVersions'] });

    return (async () => {
      for (const app of apps) {
        const { appVersions } = app;
        await (async () => {
          for (const version of appVersions) {
            const { name, id } = version;
            const versionExists = await entityManager.findOne(AppVersion, { id, name });
            if (versionExists) {
              const versionsNeedToChange = appVersions.filter(
                (appVersion) => appVersion.id !== id && appVersion.name === name
              );
              await (async () => {
                for (const versionToChange of versionsNeedToChange) {
                  await entityManager.update(
                    AppVersion,
                    { id: versionToChange.id },
                    { name: `${versionToChange.name}_${Date.now()}` }
                  );
                }
              })();
            }
          }
        })();
      }
    })();
  }
}
