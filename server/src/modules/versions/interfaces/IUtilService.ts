import { AppVersion } from '@entities/app_version.entity';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { EntityManager } from 'typeorm';

export interface IVersionUtilService {
  updateVersion(appVersion: AppVersion, appVersionUpdateDto: AppVersionUpdateDto): Promise<void>;
  deleteVersionGit(app: App, user: User, manager?: EntityManager): Promise<void>;
}
