import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { AppVersion } from '@entities/app_version.entity';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { PromoteVersionDto, VersionCreateDto } from '../dto';

export interface IVersionService {
  getAllVersions(app: App): Promise<{ versions: Array<AppVersion> }>;

  createVersion(app: App, user: User, versionCreateDto: VersionCreateDto): Promise<any>;

  deleteVersion(app: App, user: User): Promise<void>;

  getVersion(app: App, user: User): Promise<any>;

  update(app: App, user: User, appVersionUpdateDto: AppVersionUpdateDto): Promise<void>;

  updateSettings(app: App, user: User, appVersionUpdateDto: AppVersionUpdateDto): Promise<void>;

  promoteVersion(app: App, user: User, promoteVersionDto: PromoteVersionDto): Promise<any>;
}
