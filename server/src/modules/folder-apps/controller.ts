import { Controller, Param, Post, Put, UseGuards, Get, Query, Body } from '@nestjs/common';
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
  async index(@User() user: UserEntity, @Query() query, @UserPermissionsDecorator() userPermissions: UserPermissions) {
    user.roleGroup = userPermissions.isEndUser ? USER_ROLE.END_USER : undefined;
    // Read the raw branch_id query param (NOT the default-filled user.branchId). Absent for
    // non-git orgs and workflows; getFolders resolves the org's default branch in that case,
    // since folder_apps.branch_id is now mandatory (no NULL rows).
    return await this.folderAppsService.getFolders(user, { ...query, branchId: query.branch_id });
  }

  @InitFeature(FEATURE_KEY.CREATE_FOLDER_APP)
  @Post()
  async create(
    @Body() createBody: { folder_id: string; app_id?: string; app_ids?: string[] },
    // Raw branch_id query param, absent for workflows and non-git-workspace FRONT_END/MODULE
    // apps. The service resolves the org's default branch when absent so every row gets a
    // non-null branch_id.
    @Query('branch_id') branchId?: string,
    @User() user?: UserEntity
  ) {
    const { folder_id: folderId, app_id: appId, app_ids: appIds } = createBody;

    if (appIds?.length) {
      return this.folderAppsService.bulkCreate(folderId, appIds, branchId, user?.organizationId);
    }
    const folder = await this.folderAppsService.create(folderId, appId, branchId, user?.organizationId);
    return decamelizeKeys(folder);
  }

  @InitFeature(FEATURE_KEY.DELETE_FOLDER_APP)
  @Put('/:folderId')
  async remove(
    @Body('app_id') appId: string,
    @Param('folderId') folderId: string,
    // Raw branch_id query param, absent for workflows / non-git orgs; the service resolves the
    // org's default branch when absent.
    @Query('branch_id') branchId?: string,
    @User() user?: UserEntity
  ) {
    await this.folderAppsService.remove(folderId, appId, branchId, user?.organizationId);
  }
}
