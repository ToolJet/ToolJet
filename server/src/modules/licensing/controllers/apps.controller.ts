import { Controller, UseGuards, Get } from '@nestjs/common';
import { LicenseAppsService } from '../services/apps.service';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { ILicenseAppsController } from '../interfaces/IController';
import { FeatureAbilityGuard } from '../ability/guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '../constants';

@Controller('license/apps')
@InitModule(MODULES.LICENSING)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class LicenseAppsController implements ILicenseAppsController {
  constructor(protected readonly licenseAppsService: LicenseAppsService) {}

  @InitFeature(FEATURE_KEY.GET_APP_LIMITS)
  @Get('limits')
  getLimits() {
    return this.licenseAppsService.getAppsLimit();
  }
}
