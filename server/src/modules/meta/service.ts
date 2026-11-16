import { Injectable } from '@nestjs/common';
import { MetadataUtilService } from './util.service';
import { IMetaService } from './interfaces/IService';
import { ConfigService } from '@nestjs/config';
import { MetaDataInfo } from './types';
import { InMemoryCacheService } from '@modules/inMemoryCache/in-memory-cache.service';

// Instance-wide, not per-user/per-org. Like the public config: concurrent calls share one lookup, which is
// dropped as soon as it settles, so a change (e.g. finishing onboarding, possibly on another server) shows
// on the next request. The TTL only bounds a lookup that never settles.
const METADATA_CACHE_TTL_MS = 30_000;
const METADATA_CACHE_KEY = 'app_metadata';

@Injectable()
export class MetadataService implements IMetaService {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly metadataUtilService: MetadataUtilService,
    protected readonly inMemoryCacheService: InMemoryCacheService
  ) {}
  async getMetadata(): Promise<MetaDataInfo> {
    const cached = this.inMemoryCacheService.get(METADATA_CACHE_KEY);
    if (cached) return cached;

    const metadataPromise = this.computeMetadata();
    this.inMemoryCacheService.set(METADATA_CACHE_KEY, metadataPromise, METADATA_CACHE_TTL_MS);
    metadataPromise.then(
      () => this.inMemoryCacheService.delete(METADATA_CACHE_KEY),
      () => this.inMemoryCacheService.delete(METADATA_CACHE_KEY)
    );
    return metadataPromise;
  }

  private async computeMetadata(): Promise<MetaDataInfo> {
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
