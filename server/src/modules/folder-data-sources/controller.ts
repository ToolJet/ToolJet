import { Controller, Param, Post, Put, UseGuards, Query, Body, Get } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FolderDataSourcesService } from './service';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import { FeatureAbilityGuard } from './ability/guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constants';

@InitModule(MODULES.FOLDER_DATA_SOURCES)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
@Controller('folder-data-sources')
export class FolderDataSourcesController {
  constructor(protected folderDataSourcesService: FolderDataSourcesService) {}

  @InitFeature(FEATURE_KEY.GET_FOLDERS)
  @Get()
  async index(@User() user: UserEntity, @Query() query) {
    // Raw branch_id query param — absent for non-git workspaces; the service resolves the org's
    // default branch in that case. searchKey filters on the data source's branch name (dsv.name).
    return await this.folderDataSourcesService.getFolders(user, {
      searchKey: query.searchKey,
      branchId: query.branch_id,
    });
  }

  @InitFeature(FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE)
  @Post()
  async create(
    @Body() createBody: { folder_id: string; data_source_id?: string; data_source_ids?: string[] },
    // Raw branch_id query param. Absent for non-git workspaces; the service resolves the org's
    // default branch when absent so every row gets a non-null branch_id.
    @Query('branch_id') branchId?: string,
    @User() user?: UserEntity
  ) {
    const { folder_id: folderId, data_source_id: dataSourceId, data_source_ids: dataSourceIds } = createBody;

    if (dataSourceIds?.length) {
      return this.folderDataSourcesService.bulkCreate(folderId, dataSourceIds, branchId, user?.organizationId);
    }
    const folderDataSource = await this.folderDataSourcesService.create(
      folderId,
      dataSourceId,
      branchId,
      user?.organizationId
    );
    return decamelizeKeys(folderDataSource);
  }

  @InitFeature(FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE)
  @Put('/:folderId')
  async remove(
    @Body('data_source_id') dataSourceId: string,
    @Param('folderId') folderId: string,
    @Query('branch_id') branchId?: string,
    @User() user?: UserEntity
  ) {
    await this.folderDataSourcesService.remove(folderId, dataSourceId, branchId, user?.organizationId);
  }
}
