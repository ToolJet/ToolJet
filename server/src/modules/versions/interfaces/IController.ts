import { User as UserEntity } from '@entities/user.entity';
import { App as AppEntity } from '@entities/app.entity';
import { VersionCreateDto } from '../dto';
import { LibraryPin } from '@modules/data-queries/library/library-query.util';
export interface IVersionController {
  fetchVersions(user: UserEntity, app: AppEntity, includeDefaultBranchVersions?: string): Promise<any>;
  getLibraryPins(user: UserEntity, app: AppEntity, versionId: string): Promise<{ pins: LibraryPin[] }>;
  createVersion(user: UserEntity, app: AppEntity, versionCreateDto: VersionCreateDto): Promise<any>;
  deleteVersion(user: UserEntity, app: AppEntity): Promise<any>;
}
