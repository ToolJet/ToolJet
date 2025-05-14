import { Controller, Get, UseGuards, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../session/guards/jwt-auth.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { AppGitPullDto, AppGitPullUpdateDto, AppGitPushDto } from '@modules/app-git/dto';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { RequireFeature } from '@modules/app/decorators/require-feature.decorator';
import { FEATURE_KEY } from './constants';

@InitModule(MODULES.APP_GIT)
@Controller('gitsync')
export class AppGitController {
  constructor() {}

  @RequireFeature(LICENSE_FIELD.GIT_SYNC)
  @InitFeature(FEATURE_KEY.GIT_GET_APPS)
  @UseGuards(JwtAuthGuard)
  @Get('gitpull')
  async getAppsMetaFile(@User() user): Promise<any> {
    throw new NotFoundException();
  }

  @RequireFeature(LICENSE_FIELD.GIT_SYNC)
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

  @RequireFeature(LICENSE_FIELD.GIT_SYNC)
  @InitFeature(FEATURE_KEY.GIT_GET_APP)
  @UseGuards(JwtAuthGuard)
  @Get('gitpull/app/:appId')
  async getAppMetaFile(@User() user, @Param('appId') appId: string): Promise<any> {
    throw new NotFoundException();
  }

  @RequireFeature(LICENSE_FIELD.GIT_SYNC)
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

  @RequireFeature(LICENSE_FIELD.GIT_SYNC)
  @InitFeature(FEATURE_KEY.GIT_CREATE_APP)
  @UseGuards(JwtAuthGuard)
  @Post('gitpull/app')
  async createGitApp(@User() user, @Body() appData: AppGitPullDto): Promise<any> {
    throw new NotFoundException();
  }

  @RequireFeature(LICENSE_FIELD.GIT_SYNC)
  @InitFeature(FEATURE_KEY.GIT_UPDATE_APP)
  @UseGuards(JwtAuthGuard)
  @Post('gitpull/app/:appId')
  async pullGitAppChanges(@User() user, @Param('appId') appId, @Body() appData: AppGitPullUpdateDto): Promise<any> {
    throw new NotFoundException();
  }
}
