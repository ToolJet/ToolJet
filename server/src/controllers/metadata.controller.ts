import { Controller, Get, Request, Post, UseGuards, Body } from '@nestjs/common';
import { MetadataService } from '@services/metadata.service';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { UserOnboardingDto } from '@dto/user-onboarding.dto';

@Controller('metadata')
export class MetadataController {
  constructor(private metadataService: MetadataService) {}

  @UseGuards(JwtAuthGuard)
  @Post('finish_installation')
  async finishInstallation(@Request() req, @Body() userOnboardingDto: UserOnboardingDto) {
    const { name, email, org } = userOnboardingDto;
    const installedVersion = globalThis.TOOLJET_VERSION;

    const metadata = await this.metadataService.getMetaData();
    if (process.env.NODE_ENV == 'production') {
      await this.metadataService.finishInstallation(metadata, installedVersion, name, email, org);
    }

    await this.metadataService.updateMetaData({
      onboarded: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('skip_onboarding')
  async skipOnboarding() {
    await this.metadataService.updateMetaData({
      onboarded: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('skip_version')
  async skipVersion() {
    const metadata = await this.metadataService.getMetaData();
    const data = metadata.data;

    await this.metadataService.updateMetaData({
      ignored_version: data['latest_version'],
      version_ignored: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMetadata(@Request() req) {
    const metadata = await this.metadataService.getMetaData();
    const data = metadata.data;
    let latestVersion = data['latest_version'];
    let versionIgnored = data['version_ignored'] || false;
    const onboarded = data['onboarded'];

    if (process.env.NODE_ENV == 'production') {
      if (
        process.env.CHECK_FOR_UPDATES &&
        process.env.CHECK_FOR_UPDATES != '0' &&
        process.env.CHECK_FOR_UPDATES != 'false'
      ) {
        const result = await this.metadataService.checkForUpdates(metadata);
        latestVersion = result.latestVersion;
        versionIgnored = false;
      }

      if (!process.env.DISABLE_TOOLJET_TELEMETRY) {
        await this.metadataService.sendTelemetryData(metadata);
      }
    }

    return {
      installed_version: globalThis.TOOLJET_VERSION,
      latest_version: latestVersion,
      onboarded: onboarded,
      version_ignored: versionIgnored,
    };
  }
}
