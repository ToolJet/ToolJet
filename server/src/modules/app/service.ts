import { Injectable } from '@nestjs/common';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { HealthResponse, IAppService } from './interfaces/IService';
import { AppUtilService } from './util.service';

@Injectable()
export class AppService implements IAppService {
  private readonly startTime = Date.now();

  constructor(
    private readonly appUtilService: AppUtilService,
    private readonly licenseTermsService: LicenseTermsService
  ) {}

  async getHealth(verbose = false): Promise<HealthResponse> {
    const [database, cache, licenseStatus] = await Promise.all([
      verbose ? this.appUtilService.checkDbVerbose() : this.appUtilService.checkDb(),
      verbose ? this.appUtilService.checkCacheVerbose() : this.appUtilService.checkCache(),
      this.licenseTermsService.getLicenseTermsInstance(LICENSE_FIELD.STATUS),
    ]);

    const statuses = [database.status, cache.status].filter((s) => s !== 'not_configured');
    const overallStatus = statuses.includes('error')
      ? 'unhealthy'
      : statuses.every((s) => s === 'ok')
        ? 'healthy'
        : 'degraded';

    const response: HealthResponse = {
      status: overallStatus,
      version: globalThis.TOOLJET_VERSION || '',
      timestamp: new Date().toISOString(),
      isLicenseValid: licenseStatus?.isLicenseValid ?? false,
      isExpired: licenseStatus?.isExpired ?? true,
      components: { database, cache },
    };

    if (verbose) {
      response.uptime_seconds = Math.floor((Date.now() - this.startTime) / 1000);
    }

    return response;
  }
}
