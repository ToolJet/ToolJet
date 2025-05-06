import { Controller, Get, UseGuards, Post, Param, Body } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../session/guards/jwt-auth.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { AppGitService } from './service';
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
  constructor(private appGitService: AppGitService) {}

  @RequireFeature(LICENSE_FIELD.GIT_SYNC)
  @InitFeature(FEATURE_KEY.GIT_GET_APPS)
  @UseGuards(JwtAuthGuard)
  @Get('gitpull')
  async getAppsMetaFile(@User() user) {
    const result = await this.appGitService.gitPullAppInfo(user);
    return decamelizeKeys(result);
  }

  @RequireFeature(LICENSE_FIELD.GIT_SYNC)
  @InitFeature(FEATURE_KEY.GIT_SYNC_APP)
  @UseGuards(JwtAuthGuard)
  @Post('gitpush/:appGitId/:versionId')
  async gitSyncApp(@User() user, @Param('appGitId') appGitId: string, @Body() appGitPushBody: AppGitPushDto) {
    await this.appGitService.syncApp(appGitPushBody, user, appGitId);
  }

  @RequireFeature(LICENSE_FIELD.GIT_SYNC)
  @InitFeature(FEATURE_KEY.GIT_GET_APP)
  @UseGuards(JwtAuthGuard)
  @Get('gitpull/app/:appId')
  async getAppMetaFile(@User() user, @Param('appId') appId: string) {
    const result = await this.appGitService.gitPullAppInfo(user, appId);
    return decamelizeKeys(result);
  }

  @RequireFeature(LICENSE_FIELD.GIT_SYNC)
  @InitFeature(FEATURE_KEY.GIT_GET_APP_CONFIG)
  @UseGuards(JwtAuthGuard)
  @Get(':workspaceId/app/:versionId')
  async getAppConfig(
    @User() user,
    @Param('workspaceId') organizationId: string,
    @Param('versionId') versionId: string
  ) {
    const appGit = await this.appGitService.checkSyncApp(user, versionId, organizationId);
    return decamelizeKeys({ appGit });
  }

  @RequireFeature(LICENSE_FIELD.GIT_SYNC)
  @InitFeature(FEATURE_KEY.GIT_CREATE_APP)
  @UseGuards(JwtAuthGuard)
  @Post('gitpull/app')
  async createGitApp(@User() user, @Body() appData: AppGitPullDto) {
    const app = await this.appGitService.createGitApp(user, appData);
    return decamelizeKeys({ app });
  }

  @RequireFeature(LICENSE_FIELD.GIT_SYNC)
  @InitFeature(FEATURE_KEY.GIT_UPDATE_APP)
  @UseGuards(JwtAuthGuard)
  @Post('gitpull/app/:appId')
  async pullGitAppChanges(@User() user, @Param('appId') appId, @Body() appData: AppGitPullUpdateDto) {
    const app = await this.appGitService.pullGitAppChanges(user, appData, appId);
    return decamelizeKeys({ app });
  }
}
