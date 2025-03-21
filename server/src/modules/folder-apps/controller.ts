import { Controller, Param, Post, Put, UseGuards, Get, Query, Body } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FolderAppsService } from './service';
import { User } from '@modules/app/decorators/user.decorator';
import { FeatureAbilityGuard } from './ability/guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constants';
@InitModule(MODULES.FOLDER_APPS)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
@Controller('folder-apps')
export class FolderAppsController {
  constructor(protected folderAppsService: FolderAppsService) {}

  @InitFeature(FEATURE_KEY.GET_FOLDERS)
  @Get()
  async index(@User() user, @Query() query) {
    return await this.folderAppsService.getFolders(user, query);
  }

  @InitFeature(FEATURE_KEY.CREATE_FOLDER_APP)
  @Post()
  async create(@Body() createBody: { folder_id: string; app_id: string }) {
    const { folder_id: folderId, app_id: appId } = createBody;

    const folder = await this.folderAppsService.create(folderId, appId);
    return decamelizeKeys(folder);
  }

  @InitFeature(FEATURE_KEY.DELETE_FOLDER_APP)
  @Put('/:folderId')
  async remove(@Body('app_id') appId: string, @Param('folderId') folderId: string) {
    await this.folderAppsService.remove(folderId, appId);
  }
}
