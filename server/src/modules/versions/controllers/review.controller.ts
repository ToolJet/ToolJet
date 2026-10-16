import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { ValidAppGuard } from '@modules/apps/guards/valid-app.guard';
import { User } from '@modules/app/decorators/user.decorator';
import { User as UserEntity } from '@entities/user.entity';
import { App as AppEntity } from '@entities/app.entity';
import { AppDecorator as App } from '@modules/app/decorators/app.decorator';
import { FeatureAbilityGuard } from '../ability/guard';
import { FEATURE_KEY } from '../constants';
import { VersionReviewService } from '../reviews/version-review.service';

// Review requests on versions. Builders open and comment; approving needs the
// right to promote; releasing without approval is an admin override with a
// reason on the record.
@InitModule(MODULES.VERSION)
@Controller({
  path: 'apps',
  version: '2',
})
export class VersionReviewController {
  constructor(protected readonly reviews: VersionReviewService) {}

  @InitFeature(FEATURE_KEY.COMPARE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/reviews')
  list(@App() app: AppEntity, @Query('status') status?: string, @Query('brief') brief?: string) {
    return this.reviews.list(app, status, brief === '1');
  }

  @InitFeature(FEATURE_KEY.COMPARE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/versions/:versionId/reviews')
  open(@User() user: UserEntity, @App() app: AppEntity, @Param('versionId') versionId: string, @Body() body) {
    return this.reviews.open(app, user, versionId, body ?? {});
  }

  @InitFeature(FEATURE_KEY.COMPARE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/versions/:versionId/release-gate')
  gate(@App() app: AppEntity, @Param('versionId') versionId: string) {
    return this.reviews.gateFor(app, versionId);
  }

  @InitFeature(FEATURE_KEY.COMPARE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/reviews/:reviewId')
  get(@App() app: AppEntity, @Param('reviewId') reviewId: string) {
    return this.reviews.get(app, reviewId);
  }

  @InitFeature(FEATURE_KEY.COMPARE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/reviews/:reviewId/comments')
  comment(@User() user: UserEntity, @App() app: AppEntity, @Param('reviewId') reviewId: string, @Body() body) {
    return this.reviews.comment(app, user, reviewId, body ?? {});
  }

  @InitFeature(FEATURE_KEY.REVIEW_APPROVE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/reviews/:reviewId/decision')
  decide(@User() user: UserEntity, @App() app: AppEntity, @Param('reviewId') reviewId: string, @Body() body) {
    return this.reviews.decide(app, user, reviewId, body ?? {});
  }

  @InitFeature(FEATURE_KEY.REVIEW_OVERRIDE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/reviews/:reviewId/override')
  override(@User() user: UserEntity, @App() app: AppEntity, @Param('reviewId') reviewId: string, @Body() body) {
    return this.reviews.override(app, user, reviewId, body ?? {});
  }

  @InitFeature(FEATURE_KEY.COMPARE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/reviews/:reviewId/close')
  close(@User() user: UserEntity, @App() app: AppEntity, @Param('reviewId') reviewId: string) {
    return this.reviews.close(app, user, reviewId);
  }

  @InitFeature(FEATURE_KEY.COMPARE)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/reviews/:reviewId/reopen')
  reopen(@User() user: UserEntity, @App() app: AppEntity, @Param('reviewId') reviewId: string) {
    return this.reviews.close(app, user, reviewId, true);
  }
}
