import { User } from '@entities/user.entity';
import { App } from '@entities/app.entity';
import { AppCreateDto, AppUpdateDto, AppListDto } from '../dto';
import { ValidateAppAccessDto, ValidateAppAccessResponseDto } from '../dto';
import { AppAbility } from '@modules/casl/casl-ability.factory';

export interface IAppsService {
  create(user: User, appCreateDto: AppCreateDto): Promise<any>;
  validatePrivateAppAccess(
    app: App,
    ability: AppAbility,
    validateAppAccessDto: ValidateAppAccessDto
  ): Promise<ValidateAppAccessResponseDto>;
  validateReleasedApp(ability: any, app: App): { id: string; slug: string };
  update(app: App, appUpdateDto: AppUpdateDto, user: User): Promise<any>;
  delete(app: App, user: User): Promise<void>;
  getAllApps(user: User, appListDto: AppListDto): Promise<any>;
  findTooljetDbTables(appId: string): Promise<{ table_id: string }[]>;
  getOne(app: App, user: User): Promise<any>;
  getBySlug(app: App, user: User): Promise<any>;
}
