import { Injectable } from '@nestjs/common';
import { HealthResponse, IAppService } from './interfaces/IService';
import { AppUtilService } from './util.service';

@Injectable()
export class AppService implements IAppService {
  private readonly startTime = Date.now();

  constructor(private readonly appUtilService: AppUtilService) {}

  async getHealth(verbose = false): Promise<HealthResponse> {
    const [database, cache] = await Promise.all([
      verbose ? this.appUtilService.checkDbVerbose() : this.appUtilService.checkDb(),
      verbose ? this.appUtilService.checkCacheVerbose() : this.appUtilService.checkCache(),
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
      components: { database, cache },
    };

    if (verbose) {
      response.uptime_seconds = Math.floor((Date.now() - this.startTime) / 1000);
    }

    return response;
  }
}
