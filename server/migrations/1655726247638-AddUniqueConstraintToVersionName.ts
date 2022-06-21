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
    const versions = await entityManager.find(AppVersion);
    return (async () => {
      const versionsChanged = [];
      for (const version of versions) {
        const { appId, name, id } = version;
        if (versionsChanged.includes(id)) continue;
        const sameVersions = await entityManager.find(AppVersion, {
          where: { appId, name },
        });
        const versionsNeedToChange = sameVersions.filter((sameVersion) => sameVersion.id !== id);
        await (async () => {
          for (const versionToChange of versionsNeedToChange) {
            const result = await entityManager.update(
              AppVersion,
              { id: versionToChange.id },
              { name: `${versionToChange.name}_${Date.now()}` }
            );
            result.affected == 1 && versionsChanged.push(versionToChange.id);
          }
        })();
      }
    })();
  }
}
