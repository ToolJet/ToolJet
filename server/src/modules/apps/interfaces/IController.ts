import { UserEntity } from '@modules/app/decorators/user.decorator';
import { AppCreateDto, AppUpdateDto } from '../dto';
import { App as AppEntity } from '@entities/app.entity';
import { VersionReleaseDto } from '../dto';
import { AppAbility } from '@modules/app/decorators/ability.decorator';

export interface IAppsController {
  create(user: UserEntity, appCreateDto: AppCreateDto): Promise<any>;

  validatePrivateAppAccess(
    versionName: string,
    environmentName: string,
    versionId: string,
    envId: string,
    ability: AppAbility,
    app: AppEntity
  ): Promise<any>;

  validateReleasedAppAccess(ability: AppAbility, app: AppEntity): any;

  update(user: UserEntity, app: AppEntity, appUpdateDto: AppUpdateDto): Promise<any>;

  delete(user: UserEntity, app: AppEntity): Promise<any>;

  index(
    user: UserEntity,
    query: {
      page: number;
      folderId: string;
      searchKey: string;
      type: string;
    }
  ): Promise<any>;

  updateIcon(user: UserEntity, app: AppEntity, icon: string): Promise<void>;

  tables(user: UserEntity, app: AppEntity): Promise<{ tables: any[] }>;

  show(user: UserEntity, app: AppEntity): Promise<any>;

  appFromSlug(user: UserEntity, app: AppEntity): Promise<any>;

  releaseVersion(user: UserEntity, app: AppEntity, versionReleaseDto: VersionReleaseDto): Promise<any>;
}
