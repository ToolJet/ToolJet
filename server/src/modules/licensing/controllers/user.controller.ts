import { Controller, UseGuards, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { LIMIT_TYPE } from '@modules/users/constants/lifecycle';
import { LicenseUserService } from '../services/user.service';
import { ILicenseUserController } from '../interfaces/IController';
import { FeatureAbilityGuard } from '../ability/guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '../constants';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';

@Controller('license/users')
@InitModule(MODULES.LICENSING)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class LicenseUserController implements ILicenseUserController {
  constructor(protected readonly licenseUserService: LicenseUserService) {}

  @InitFeature(FEATURE_KEY.GET_USER_LIMITS)
  @Get('limits/:type')
  async getUserLimits(@Param('type') type: LIMIT_TYPE) {
    return await this.licenseUserService.getUserLimitsByType(type);
  }
}
