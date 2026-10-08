import { Controller, UseGuards, Get, Req } from '@nestjs/common';
import { LicensePageService } from '../interfaces/IService';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbilityGuard } from '../ability/guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '../constants';

@Controller('license/pages')
@InitModule(MODULES.LICENSING)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class LicensePagesController {
  constructor(protected readonly licensePageService: LicensePageService) {}

  @InitFeature(FEATURE_KEY.GET_PAGE_LIMITS)
  @Get('limits')
  getLimits(@Req() req: Request) {
    const organizationId =
      typeof req.headers['tj-workspace-id'] === 'object'
        ? req.headers['tj-workspace-id'][0]
        : req.headers['tj-workspace-id'];
    return this.licensePageService.getPagesLimit(organizationId);
  }
}
