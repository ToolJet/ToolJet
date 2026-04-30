import { Body, Controller, Get, Headers, Param, Put, Query, UseGuards } from '@nestjs/common';
import { VersionService } from './service';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { ValidAppGuard } from '@modules/apps/guards/valid-app.guard';
import { FeatureAbilityGuard } from './ability/guard';
import { ValidModuleByIdGuard } from './guards/valid-module-by-id.guard';
import { User as UserEntity } from '@entities/user.entity';
import { User } from '@modules/app/decorators/user.decorator';
import { App as AppEntity } from '@entities/app.entity';
import { AppDecorator as App } from '@modules/app/decorators/app.decorator';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { PromoteVersionDto } from './dto';
import { IVersionControllerV2 } from './interfaces/IControllerV2';

@InitModule(MODULES.VERSION)
@Controller({
  path: 'apps',
  version: '2',
})
export class VersionControllerV2 implements IVersionControllerV2 {
  constructor(protected readonly versionService: VersionService) {}

  @InitFeature(FEATURE_KEY.GET_ONE)
  @UseGuards(JwtAuthGuard, ValidModuleByIdGuard, FeatureAbilityGuard)
  @Get('modules/:moduleAppId/version')
  getModuleVersion(
    @User() user: UserEntity,
    @Param('moduleAppId') moduleAppId: string,
    @Query('ref') ref?: string,
    @Query('mode') mode?: string,
    @Headers('x-branch-id') branchId?: string
  ) {
    // Path param is the module's local apps.id; `ref` is the pinned version's
    // local app_versions.id. Both are local primary keys at runtime — AppSnapshot
    // translates cor_id ↔ local at every boundary. Empty/missing `ref` → unpinned;
    // resolver returns the latest non-stub version on the consumer's branch.
    return this.versionService.getVersionByStableIds(moduleAppId, ref, user, mode, branchId);
  }

  @InitFeature(FEATURE_KEY.GET_ONE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/versions/:versionId')
  getVersion(@User() user: UserEntity, @App() app: AppEntity, @Query('mode') mode?: string) {
    return this.versionService.getVersion(app, user, mode);
  }

  @InitFeature(FEATURE_KEY.APP_VERSION_UPDATE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put(':id/versions/:versionId')
  updateVersion(@User() user, @App() app: AppEntity, @Body() appVersionUpdateDto: AppVersionUpdateDto) {
    return this.versionService.update(app, user, appVersionUpdateDto);
  }

  @InitFeature(FEATURE_KEY.UPDATE_SETTINGS)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put([':id/versions/:versionId/global_settings', ':id/versions/:versionId/page_settings'])
  updateGlobalSettings(
    @User() user: UserEntity,
    @App() app: AppEntity,
    @Body() appVersionUpdateDto: AppVersionUpdateDto
  ) {
    return this.versionService.updateSettings(app, user, appVersionUpdateDto);
  }

  @InitFeature(FEATURE_KEY.PROMOTE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put(':id/versions/:versionId/promote')
  promoteVersion(@User() user: UserEntity, @App() app: AppEntity, @Body() promoteVersionDto: PromoteVersionDto) {
    return this.versionService.promoteVersion(app, user, promoteVersionDto);
  }
}
