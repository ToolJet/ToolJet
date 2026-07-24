import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

@Injectable()
export class DataSourceBranchUtil {
  async cloneDataSourceVersions(
    _sourceBranchId: string,
    _targetBranchId: string,
    _manager: EntityManager
  ): Promise<void> {}

  async snapshotDataSourcesForVersion(
    _appVersionId: string,
    _branchId: string
  ): Promise<void> {}
}
