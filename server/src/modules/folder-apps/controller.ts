import { Controller, Param, Post, Put, UseGuards, Get, Query, Body, Headers } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FolderAppsService } from './service';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import { FeatureAbilityGuard } from './ability/guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constants';
import { UserPermissionsDecorator } from '@modules/app/decorators/user-permission.decorator';
import { UserPermissions } from '@modules/ability/types';
import { USER_ROLE } from '@modules/group-permissions/constants';
@InitModule(MODULES.FOLDER_APPS)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
@Controller('folder-apps')
export class FolderAppsController {
  constructor(protected folderAppsService: FolderAppsService) {}

  @InitFeature(FEATURE_KEY.GET_FOLDERS)
  @Get()
  async index(
    @User() user: UserEntity,
    @Query() query,
    @UserPermissionsDecorator() userPermissions: UserPermissions,
    @Headers('x-branch-id') branchId?: string // absent for non-git orgs and workflows
  ) {
    user.roleGroup = userPermissions.isEndUser ? USER_ROLE.END_USER : undefined;
    return await this.folderAppsService.getFolders(user, { ...query, branchId });
  }

  @InitFeature(FEATURE_KEY.CREATE_FOLDER_APP)
  @Post()
  async create(
    @Body() createBody: { folder_id: string; app_id?: string; app_ids?: string[] },
    @Headers('x-branch-id') branchId?: string
  ) {
    const { folder_id: folderId, app_id: appId, app_ids: appIds } = createBody;

    if (appIds?.length) {
      return this.folderAppsService.bulkCreate(folderId, appIds, branchId);
    }
    const folder = await this.folderAppsService.create(folderId, appId, branchId);
    return decamelizeKeys(folder);
  }

  @InitFeature(FEATURE_KEY.DELETE_FOLDER_APP)
  @Put('/:folderId')
  async remove(
    @Body('app_id') appId: string,
    @Param('folderId') folderId: string,
    @Headers('x-branch-id') branchId?: string
  ) {
    await this.folderAppsService.remove(folderId, appId, branchId);
  }
}
