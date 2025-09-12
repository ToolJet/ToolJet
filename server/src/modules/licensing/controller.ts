import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ILicenseController } from './interfaces/IController';
import { Terms } from './interfaces/terms';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { LicenseUpdateDto } from './dto';
import { FeatureAbilityGuard } from './ability/guard';
import { FEATURE_KEY } from './constants';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { User as UserEntity } from '@entities/user.entity';
import { User } from '@modules/app/decorators/user.decorator';

@InitModule(MODULES.LICENSING)
@Controller('license')
export class LicenseController implements ILicenseController {
  getLicense(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @UseGuards(FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.GET_ACCESS)
  @Get('access')
  getFeatureAccess(@Req() req: Request): Promise<Terms> {
    return Promise.resolve({
      expiry: '',
      licenseStatus: {
        isLicenseValid: false,
        isExpired: false,
      },
    });
  }
  getDomains(@Req() req: Request): Promise<{ domains: any; licenseStatus: any }> {
    throw new Error('Method not implemented.');
  }
  getLicenseTerms(@Req() req: Request): Promise<{ terms: Terms }> {
    throw new Error('Method not implemented.');
  }
  updateLicense(licenseUpdateDto: LicenseUpdateDto, @User() user: UserEntity): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
