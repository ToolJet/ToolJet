import { AppVersion } from '@entities/app_version.entity';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { EntityManager } from 'typeorm';

export interface IVersionUtilService {
  updateVersion(appVersion: AppVersion, appVersionUpdateDto: AppVersionUpdateDto): Promise<void>;
  publishVersionWithEnvironment(
    appVersion: AppVersion,
    currentEnvironmentId: string,
    manager?: EntityManager,
    extraParams?: Partial<Pick<AppVersion, 'name'>>
  ): Promise<void>;
  deleteVersionGit(app: App, version: AppVersion, manager?: EntityManager): Promise<void>;
  fetchVersions(appId: string): Promise<AppVersion[]>;
}
