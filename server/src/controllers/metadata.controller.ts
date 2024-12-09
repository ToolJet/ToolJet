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
    const latestVersion = data['latest_version'];
    const versionIgnored = data['version_ignored'] || false;
    const instanceId = metadata['id'];
    const onboarded = data['onboarded'];

    if (process.env.NODE_ENV == 'production' && process.env.DISABLE_TOOLJET_TELEMETRY !== 'true') {
      void this.metadataService.sendTelemetryData(metadata);
    }

    return {
      instance_id: instanceId,
      installed_version: globalThis.TOOLJET_VERSION,
      latest_version: latestVersion,
      onboarded: onboarded,
      version_ignored: versionIgnored,
    };
  }
}
