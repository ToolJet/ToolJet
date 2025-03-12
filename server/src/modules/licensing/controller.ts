import { Controller, Get, UseGuards } from '@nestjs/common';
import { ILicenseController } from './interfaces/IController';
import { Terms } from './interfaces/terms';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { LicenseUpdateDto } from './dto';
import { FeatureAbilityGuard } from './ability/guard';
import { FEATURE_KEY } from './constants';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';

@InitModule(MODULES.LICENSING)
@Controller('license')
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class LicenseController implements ILicenseController {
  getLicense(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.GET_ACCESS)
  @Get('access')
  getFeatureAccess(): Promise<Terms> {
    return Promise.resolve({
      expiry: '',
      licenseStatus: {
        isLicenseValid: false,
        isExpired: false,
      },
    });
  }
  getDomains(): Promise<{ domains: any; licenseStatus: any }> {
    throw new Error('Method not implemented.');
  }
  getLicenseTerms(): Promise<{ terms: Terms }> {
    throw new Error('Method not implemented.');
  }
  updateLicense(licenseUpdateDto: LicenseUpdateDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
