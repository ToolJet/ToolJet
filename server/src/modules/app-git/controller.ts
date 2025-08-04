import { Controller, Get, UseGuards, Post, Param, Body, NotFoundException, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../session/guards/jwt-auth.guard';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import {
  AppGitPullDto,
  AppGitPullUpdateDto,
  AppGitPushDto,
  AppGitUpdateDto,
  RenameAppOrVersionDto,
} from '@modules/app-git/dto';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';

@InitModule(MODULES.APP_GIT)
@Controller('gitsync')
export class AppGitController {
  constructor() {}

  @InitFeature(FEATURE_KEY.GIT_GET_APPS)
  @UseGuards(JwtAuthGuard)
  @Get('gitpull')
  async getAppsMetaFile(@User() user): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_SYNC_APP)
  @UseGuards(JwtAuthGuard)
  @Post('gitpush/:appGitId/:versionId')
  async gitSyncApp(
    @User() user,
    @Param('appGitId') appGitId: string,
    @Body() appGitPushBody: AppGitPushDto
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_GET_APP)
  @UseGuards(JwtAuthGuard)
  @Get('gitpull/app/:appId')
  async getAppMetaFile(@User() user, @Param('appId') appId: string): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_GET_APP_CONFIG)
  @UseGuards(JwtAuthGuard)
  @Get(':workspaceId/app/:versionId')
  async getAppConfig(
    @User() user,
    @Param('workspaceId') organizationId: string,
    @Param('versionId') versionId: string
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_CREATE_APP)
  @UseGuards(JwtAuthGuard)
  @Post('gitpull/app')
  async createGitApp(@User() user, @Body() appData: AppGitPullDto): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_UPDATE_APP)
  @UseGuards(JwtAuthGuard)
  @Post('gitpull/app/:appId')
  async pullGitAppChanges(@User() user, @Param('appId') appId, @Body() appData: AppGitPullUpdateDto): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_APP_VERSION_RENAME)
  @Put('app/:appId/rename')
  async renameAppOrVersion(
    @User() user: UserEntity,
    @Param('appId') appId: string,
    @Body() renameAppOrVersionDto: RenameAppOrVersionDto
  ) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.GIT_APP_CONFIGS_UPDATE)
  @Put(':appId/configs')
  async updateAppGitConfigs(
    @User() user: UserEntity,
    @Param('appId') appId: string,
    @Body() updateAppGitDto: AppGitUpdateDto
  ) {
    throw new NotFoundException();
  }

  @Get(':workspaceId/app/:versionId/configs')
  async getAppGitConfigs(
    @User() user,
    @Param('workspaceId') organizationId: string,
    @Param('versionId') versionId: string
  ) {
    throw new NotFoundException();
  }
}
