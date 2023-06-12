import { Body, Controller, UseGuards, Patch, Get } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { SuperAdminGuard } from 'src/modules/auth/super-admin.guard';
import { LicenseService } from '@services/license.service';
import { LicenseUpdateDto } from '@dto/license.dto';
import { decamelizeKeys } from 'humps';

@Controller('license')
export class LicenseController {
  constructor(private licenseService: LicenseService) {}

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Get()
  async index() {
    const licenseSetting = await this.licenseService.getLicense();
    return decamelizeKeys(licenseSetting);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Patch()
  async updateLicenseKey(@Body() licenseUpdateDto: LicenseUpdateDto) {
    await this.licenseService.updateLicense(licenseUpdateDto);
    return;
  }
}
