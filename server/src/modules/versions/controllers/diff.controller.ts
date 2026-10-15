import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
    @Query('unchanged') unchanged?: string
  ) {
    return this.versionDiffService.diff(app, versionId, base, unchanged === 'true' || unchanged === '1');
  }
}
