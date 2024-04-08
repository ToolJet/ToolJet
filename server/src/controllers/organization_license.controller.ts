import { Body, Controller, UseGuards, Patch, Get, Post, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { OrganizationLicenseService } from '@services/organization_license.service';
import { LicenseUpdateDto } from '@dto/license.dto';
import { decamelizeKeys } from 'humps';
import { LICENSE_FIELD } from 'src/helpers/license.helper';
import { CreateCloudTrialLicenseDto } from '@dto/create-cloud-trial-license.dto';
import { LicenseService } from '@services/license.service';
import { OrganizationLicenseAccessGuard } from '@ee/licensing/guards/organizationLicenseAccess.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/entities/user.entity';

@Controller('license/organization')
export class OrganizationLicenseController {
  constructor(private organizationLicenseService: OrganizationLicenseService, private licenseService: LicenseService) {}

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Get(':organizationId')
  async index(@Param('organizationId') organizationId: string) {
    const licenseSetting = await this.organizationLicenseService.getLicense(organizationId);
    return decamelizeKeys(licenseSetting);
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Post(':organizationId/trial')
  async generateCloudTrialLicense(
    @Body() createCloudTrialLicenseDto: CreateCloudTrialLicenseDto,
    @Param('organizationId') organizationId: string,
    @User() user: UserEntity
  ) {
    // Generate a cloud trial license and update the license details
    await this.organizationLicenseService.generateCloudTrialLicense(createCloudTrialLicenseDto);

    this.licenseService.updateCRM({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isCloudTrialOpted: true,
    });
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Get(':organizationId/access')
  async accessLimits(@Param('organizationId') organizationId: string) {
    // calling the license service getTerms function, it handles both cloud and ee
    const licenseTerms = await this.licenseService.getLicenseTerms(
      [LICENSE_FIELD.FEATURES, LICENSE_FIELD.STATUS],
      organizationId
    );
    return {
      ...licenseTerms[LICENSE_FIELD.FEATURES],
      licenseStatus: licenseTerms[LICENSE_FIELD.STATUS],
    };
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Get(':organizationId/terms')
  async terms(@Param('organizationId') organizationId: string) {
    // calling the license service getTerms function, it handles both cloud and ee
    const licenseTerms = await this.licenseService.getLicenseTerms(undefined, organizationId);
    return { terms: licenseTerms };
  }

  @UseGuards(JwtAuthGuard, OrganizationLicenseAccessGuard)
  @Patch(':organizationId')
  async updateLicenseKey(@Body() licenseUpdateDto: LicenseUpdateDto, @Param('organizationId') organizationId: string) {
    await this.licenseService.updateLicense(licenseUpdateDto, organizationId);
    return;
  }
}
