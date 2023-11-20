import { AppVersion } from 'src/entities/app_version.entity';
import { Organization } from 'src/entities/organization.entity';
import { EntityManager } from 'typeorm';

export function addWait(milliseconds) {
  const date = Date.now();
  let currentDate;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

export class MigrationProgress {
  private progress = 0;
  constructor(private fileName: string, private totalCount: number) {}

  show() {
    this.progress++;
    console.log(`${this.fileName} Progress ${Math.round((this.progress / this.totalCount) * 100)} %`);
  }
}

export const updateCurrentEnvironmentId = async (manager: EntityManager, migrationName = '') => {
  const organizations = await manager.find(Organization, {
    select: ['id', 'appEnvironments'],
    relations: ['appEnvironments'],
  });

  const migrationProgress = new MigrationProgress(migrationName, organizations.length);

  for (const organization of organizations) {
    const productionEnvironment = organization.appEnvironments.find((appEnvironment) => appEnvironment.isDefault);
    const developmentEnvironment = organization.appEnvironments.find((appEnvironment) => appEnvironment.priority === 1);
    const apps = await manager.query('select id, current_version_id from apps where organization_id = $1', [
      organization.id,
    ]);

    for (const { current_version_id, id } of apps) {
      const appVersions = await manager.query('select id from app_versions where app_id = $1', [id]);
      for (const appVersion of appVersions) {
        console.log('Updating app version =>', appVersion.id);
        let envToUpdate = developmentEnvironment.id;

        if (current_version_id && current_version_id === appVersion.id) {
          envToUpdate = productionEnvironment.id;
        }
        await manager.update(
          AppVersion,
          { id: appVersion.id },
          {
            currentEnvironmentId: envToUpdate,
          }
        );
      }
    }
    migrationProgress.show();
  }
};
