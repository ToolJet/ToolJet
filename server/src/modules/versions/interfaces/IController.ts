import { User as UserEntity } from '@entities/user.entity';
import { App as AppEntity } from '@entities/app.entity';
import { CreateVersionResponseDto, VersionCreateDto } from '../dto';
export interface IVersionController {
  fetchVersions(user: UserEntity, app: AppEntity): Promise<any>;
  createVersion(
    user: UserEntity,
    app: AppEntity,
    versionCreateDto: VersionCreateDto
  ): Promise<CreateVersionResponseDto>;
  deleteVersion(user: UserEntity, app: AppEntity): Promise<any>;
}
