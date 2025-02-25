import { User as UserEntity } from '@entities/user.entity';
import { App as AppEntity } from '@entities/app.entity';
import { VersionCreateDto } from '../dto';
export interface IVersionController {
  fetchVersions(app: AppEntity): Promise<any>;
  createVersion(user: UserEntity, app: AppEntity, versionCreateDto: VersionCreateDto): Promise<any>;
  deleteVersion(user: UserEntity, app: AppEntity): Promise<any>;
}
