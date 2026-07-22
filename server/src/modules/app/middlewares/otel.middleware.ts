import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { trace, context } from '@opentelemetry/api';
import { NextFunction } from 'express';
import { Request, Response } from 'express';
import { recordApiDuration, recordApiHit } from '@otel/tracing';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';

@Injectable()
export class OtelMiddleware implements NestMiddleware {
  constructor(
    private readonly licenseTermsService: LicenseTermsService,
    private readonly configService: ConfigService
  ) {}

  // Replace UUIDs and bare numeric segments with :id to avoid high cardinality.
  private normalizeRoute(path: string): string {
    return path
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
      .replace(/\/\d+(?=\/|$)/g, '/:id');
  }

  async use(req: Request, res: Response, next: NextFunction) {
    if (this.configService.get<string>('ENABLE_OTEL') !== 'true') {
      return next();
    }
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';
    // Cloud: ToolJet controls the platform — ENABLE_OTEL=true is the only gate, no license check.
    // EE: check the instance license before streaming HTTP metrics and traces.
    const isCloud = getTooljetEdition() === TOOLJET_EDITIONS.Cloud;
    if (!isDev && !isCloud && !(await this.licenseTermsService.getLicenseTermsInstance(LICENSE_FIELD.OBSERVABILITY_ENABLED))) {
      return next();
    }

    // req.path and req.url are relative to the NestJS router mount point (/api is stripped).
    // req.originalUrl is the full path as received from the client — use that.
    const rawPath = (req.originalUrl || '').split('?')[0];
    const route = this.normalizeRoute(rawPath || 'unknown_route');
    const method = req.method || 'UNKNOWN_METHOD';
    const startTime = Date.now();
    const span = trace.getSpan(context.active());

    if (route.startsWith('/api/') && route !== '/api/health') {
      if (span) {
        span.updateName(`${method} ${route}`);
        span.setAttribute('http.route', route);
        span.setAttribute('http.method', method);
      }

      recordApiHit({ route, method });

      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        const statusCode = res.statusCode;
        const duration = Date.now() - startTime;

        if (span?.isRecording()) {
          span.setAttribute('http.status_code', statusCode);
        }
        recordApiDuration(duration, { route, method, status_code: statusCode });

        return originalJson(body);
      };
    }

    next();
  }
}
