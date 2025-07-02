import { Controller, UseGuards, Get, Req } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { LicenseOrganizationService } from '../services/organization.service';
import { ILicenseOrganizationController } from '../interfaces/IController';
import { FeatureAbilityGuard } from '../ability/guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '../constants';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';

@Controller('license/organizations')
@InitModule(MODULES.LICENSING)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class LicenseOrganizationController implements ILicenseOrganizationController {
  constructor(protected readonly licenseOrganizationService: LicenseOrganizationService) {}

  @InitFeature(FEATURE_KEY.GET_ORGANIZATION_LIMITS)
  @Get('limits')
  async getLimits(@Req() req: Request) {
    const organizationId =
      typeof req.headers['tj-workspace-id'] === 'object'
        ? req.headers['tj-workspace-id'][0]
        : req.headers['tj-workspace-id'];
    return await this.licenseOrganizationService.limit(organizationId);
  }
}
