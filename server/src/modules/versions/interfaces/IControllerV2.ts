import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { User as UserEntity } from '@entities/user.entity';
import { App as AppEntity } from '@entities/app.entity';
import { PromoteVersionDto } from '../dto';

export interface IVersionControllerV2 {
  getVersion(user: UserEntity, app: AppEntity): Promise<any>;
  updateVersion(user: UserEntity, app: AppEntity, appVersionUpdateDto: AppVersionUpdateDto): Promise<any>;
  updateGlobalSettings(user: UserEntity, app: AppEntity, appVersionUpdateDto: AppVersionUpdateDto): Promise<any>;
  promoteVersion(user: UserEntity, app: AppEntity, promoteVersionDto: PromoteVersionDto): Promise<any>;
}
