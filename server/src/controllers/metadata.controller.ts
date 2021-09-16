import { Controller, Get, Request, Post, UseGuards } from '@nestjs/common';
import { MetadataService } from '@services/metadata.service';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';

@Controller('metadata')
export class MetadataController {
  constructor(private metadataService: MetadataService) {}

  @UseGuards(JwtAuthGuard)
  @Post('finish_installation')
  async finishInstallation(@Request() req) {
    const { name, email } = req.body;
    const installedVersion = globalThis.TOOLJET_VERSION;

    await this.metadataService.finishInstallation(installedVersion, name, email);

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMetadata(@Request() req) {
    const metadata = await this.metadataService.getMetaData();
    const data = metadata.data;

    let latestVersion = data['latest_version'];
    let versionIgnored = data['version_ignored'] || false;
    const installedVersion = globalThis.TOOLJET_VERSION;
    const onboarded = data['onboarded'];
    const ignoredVersion = data['ignored_version'];
    const now = new Date();

    const updateLastCheckedAt = new Date(data['last_checked'] || null);
    const diffTime = (now.getTime() - updateLastCheckedAt.getTime()) / 1000;

    if (diffTime > 86400) {
      const result = await this.metadataService.checkForUpdates(installedVersion, ignoredVersion);
      latestVersion = result.latestVersion;
      versionIgnored = false;
    }

    return {
      installed_version: installedVersion,
      latest_version: latestVersion,
      onboarded: onboarded,
      version_ignored: versionIgnored,
    };
  }
}
