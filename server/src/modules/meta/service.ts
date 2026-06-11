import { Injectable } from '@nestjs/common';
import { MetadataUtilService } from './util.service';
import { IMetaService } from './interfaces/IService';
import { ConfigService } from '@nestjs/config';
import { MetaDataInfo } from './types';
@Injectable()
export class MetadataService implements IMetaService {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly metadataUtilService: MetadataUtilService
  ) {}
  async getMetadata(): Promise<MetaDataInfo> {
    const metadata = await this.metadataUtilService.getMetaData();
    const data = metadata.data;
    const latestVersion = data['latest_version'];
    const versionIgnored = data['version_ignored'] || false;
    const instanceId = metadata['id'];
    const onboarded = data['onboarded'];

    if (
      this.configService.get('NODE_ENV') == 'production' &&
      this.configService.get('DISABLE_TOOLJET_TELEMETRY') !== 'true'
    ) {
      void this.metadataUtilService.sendTelemetryData(metadata);
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
