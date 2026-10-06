import { Body, Controller, Get, Param, Put, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { VersionService } from './service';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { ValidAppGuard } from '@modules/apps/guards/valid-app.guard';
import { FeatureAbilityGuard } from './ability/guard';
import { ValidModuleByCorrelationGuard } from './guards/valid-module-by-correlation.guard';
import { User as UserEntity } from '@entities/user.entity';
import { User } from '@modules/app/decorators/user.decorator';
import { App as AppEntity } from '@entities/app.entity';
import { AppDecorator as App } from '@modules/app/decorators/app.decorator';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { PromoteVersionDto } from './dto';
import { IVersionControllerV2 } from './interfaces/IControllerV2';
import { AppVersionStatus } from '@entities/app_version.entity';

// A day is plenty — PUBLISHED versions are immutable (editing creates a new version id), so
// staleness isn't a real concern here; this just bounds how long a browser trusts the entry
// before it re-validates at all.
const PUBLISHED_VERSION_CACHE_MAX_AGE_SECONDS = 24 * 60 * 60;

@InitModule(MODULES.VERSION)
@Controller({
  path: 'apps',
  version: '2',
})
export class VersionControllerV2 implements IVersionControllerV2 {
  constructor(protected readonly versionService: VersionService) {}

  @InitFeature(FEATURE_KEY.GET_ONE)
  @UseGuards(JwtAuthGuard, ValidModuleByCorrelationGuard, FeatureAbilityGuard)
  @Get('module/by-correlation/:coRelationId/version')
  getModuleVersionByStableIds(
    @User() user: UserEntity,
    @Param('coRelationId') coRelationId: string,
    @Query('ref') ref?: string,
    @Query('mode') mode?: string
  ) {
    // `ref` is the version's module_reference_id (uuid). Empty/missing → unpinned;
    // resolver returns the latest non-stub version on the consumer's branch.
    return this.versionService.getVersionByStableIds(coRelationId, ref, user, mode, user.branchId);
  }

  @InitFeature(FEATURE_KEY.GET_ONE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/versions/:versionId')
  async getVersion(
    @User() user: UserEntity,
    @App() app: AppEntity,
    @Query('mode') mode: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.versionService.getVersion(app, user, mode);

    // Only published versions are safe to cache client-side — editing creates a new version id,
    // so this exact response body for this exact versionId will never change again. Draft/preview
    // versions mutate on every edit and must always be revalidated live.
    if (result?.editing_version?.status === AppVersionStatus.PUBLISHED && result?.editing_version?.id) {
      res.set({
        'Cache-Control': `private, max-age=${PUBLISHED_VERSION_CACHE_MAX_AGE_SECONDS}, immutable`,
        ETag: `"v-${result.editing_version.id}"`,
      });
    }

    return result;
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
