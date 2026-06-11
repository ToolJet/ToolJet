import { Controller, Get, UseGuards } from '@nestjs/common';
import { LicenseService } from '../service';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '../constants';
import { ILicensePlansController } from '../interfaces/IController';
import { FeatureAbilityGuard } from '../ability/guard';

@InitModule(MODULES.LICENSING)
@UseGuards(FeatureAbilityGuard)
@Controller('license')
export class LicensePlansController implements ILicensePlansController {
  constructor(protected readonly licenseService: LicenseService) {}

  @InitFeature(FEATURE_KEY.GET_PLANS)
  /* Public API */
  @Get('plans')
  async plans(): Promise<any> {
    return await this.licenseService.plans();
  }
}
