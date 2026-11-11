import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import License from '@modules/licensing/configs/License';
import { MetadataUtilService } from './util.service';

@Injectable()
export class LicensingScheduler {
  constructor(
    private readonly configService: ConfigService,
    private readonly metadataUtilService: MetadataUtilService
  ) {}

  // Runs per replica: an N-replica cluster emits N pings/day. Accepted — the
  // hub dedupes by metadata_id/customer_id at query time.
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron() {
    if (
      this.configService.get('NODE_ENV') !== 'production' ||
      this.configService.get('DISABLE_TOOLJET_TELEMETRY') === 'true'
    ) {
      return;
    }
    if (!License.Instance()?.licensingTelemetry) {
      return;
    }
    const metadata = await this.metadataUtilService.getMetaData();
    await this.metadataUtilService.sendLicensingData(metadata);
  }
}
