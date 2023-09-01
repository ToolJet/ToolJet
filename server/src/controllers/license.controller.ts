import { Body, Controller, UseGuards, Patch, Get } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { SuperAdminGuard } from 'src/modules/auth/super-admin.guard';
import { LicenseService } from '@services/license.service';
import { LicenseUpdateDto } from '@dto/license.dto';
import { decamelizeKeys } from 'humps';
import { LICENSE_FIELD } from 'src/helpers/license.helper';

@Controller('license')
export class LicenseController {
  constructor(private licenseService: LicenseService) {}

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Get()
  async index() {
    const licenseSetting = await this.licenseService.getLicense();
    return decamelizeKeys(licenseSetting);
  }

  @UseGuards(JwtAuthGuard)
  @Get('access')
  async accessLimits() {
    const licenseTerms = await this.licenseService.getLicenseTerms([LICENSE_FIELD.FEATURES, LICENSE_FIELD.STATUS]);
    return { ...licenseTerms[LICENSE_FIELD.FEATURES], licenseStatus: licenseTerms[LICENSE_FIELD.STATUS] };
  }

  @UseGuards(JwtAuthGuard)
  @Get('domains')
  async domainsList() {
    const licenseTerms = await this.licenseService.getLicenseTerms([LICENSE_FIELD.DOMAINS, LICENSE_FIELD.STATUS]);
    return { domains: [...licenseTerms[LICENSE_FIELD.DOMAINS]], licenseStatus: licenseTerms[LICENSE_FIELD.STATUS] };
  }

  @UseGuards(JwtAuthGuard)
  @Get('terms')
  async terms() {
    const licenseTerms = await this.licenseService.getLicenseTerms();
    return { terms: licenseTerms };
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Patch()
  async updateLicenseKey(@Body() licenseUpdateDto: LicenseUpdateDto) {
    await this.licenseService.updateLicense(licenseUpdateDto);
    return;
  }
}
