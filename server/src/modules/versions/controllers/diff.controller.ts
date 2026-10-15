import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { User as UserEntity } from '@entities/user.entity';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { ValidAppGuard } from '@modules/apps/guards/valid-app.guard';
import { App as AppEntity } from '@entities/app.entity';
import { AppDecorator as App } from '@modules/app/decorators/app.decorator';
import { FeatureAbilityGuard } from '../ability/guard';
import { FEATURE_KEY } from '../constants';
import { VersionDiffService } from '../diff/version-diff.service';

@InitModule(MODULES.VERSION)
@Controller({
  path: 'apps',
  version: '2',
})
export class VersionDiffController {
  constructor(protected readonly versionDiffService: VersionDiffService) {}

  // What changed from ?base to :versionId, grouped by page. Builders only:
  // the result carries every query and binding of both versions.
  @InitFeature(FEATURE_KEY.COMPARE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/versions/:versionId/diff')
  diff(
    @App() app: AppEntity,
    @Param('versionId') versionId: string,
    @Query('base') base: string,
    @Query('unchanged') unchanged?: string,
    @Query('baseSnapshot') baseSnapshot?: string
  ) {
    return this.versionDiffService.diff(app, versionId, base, unchanged === 'true' || unchanged === '1', baseSnapshot);
  }

  // Layout boxes for drawing a page without running it (blueprint mode).
  @InitFeature(FEATURE_KEY.COMPARE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/versions/:versionId/layout')
  versionLayout(@App() app: AppEntity, @Param('versionId') versionId: string, @Query('page') page?: string) {
    return this.versionDiffService.layout(app, { versionId }, page);
  }

  // Undo this turn. Needs the right to edit the app's versions.
  @InitFeature(FEATURE_KEY.APP_VERSION_UPDATE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/snapshots/:snapshotId/restore')
  restore(
    @User() user: UserEntity,
    @App() app: AppEntity,
    @Param('snapshotId') snapshotId: string,
    @Body() body: { expectedFingerprint?: string }
  ) {
    return this.versionDiffService.restore(app, user, snapshotId, body?.expectedFingerprint);
  }

  @InitFeature(FEATURE_KEY.COMPARE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/snapshots/:snapshotId/layout')
  snapshotLayout(@App() app: AppEntity, @Param('snapshotId') snapshotId: string, @Query('page') page?: string) {
    return this.versionDiffService.layout(app, { snapshotId }, page);
  }
}
