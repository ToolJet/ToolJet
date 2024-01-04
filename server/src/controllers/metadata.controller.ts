import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { MetadataService } from '@services/metadata.service';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';

@Controller('metadata')
export class MetadataController {
  constructor(private metadataService: MetadataService) {}

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

  @Get()
  async getMetadata() {
    const metadata = await this.metadataService.getMetaData();
    const data = metadata.data;
    let latestVersion = data['latest_version'];
    let versionIgnored = data['version_ignored'] || false;
    const onboarded = data['onboarded'];

    if (process.env.NODE_ENV == 'production') {
      if (
        process.env.CHECK_FOR_UPDATES === '1' ||
        process.env.CHECK_FOR_UPDATES === 'true' ||
        !process.env.CHECK_FOR_UPDATES
      ) {
        const result = await this.metadataService.checkForUpdates(metadata);
        latestVersion = result.latestVersion;
        versionIgnored = false;
      }

      if (process.env.DISABLE_TOOLJET_TELEMETRY !== 'true') {
        void this.metadataService.sendTelemetryData(metadata);
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
