import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { trace, context } from '@opentelemetry/api';
import { NextFunction } from 'express';
import { Request, Response } from 'express';
import { recordApiDuration, recordApiHit } from '@otel/tracing';
import { Logger } from 'nestjs-pino';

@Injectable()
export class OtelMiddleware implements NestMiddleware {
  constructor(
    private readonly licenseTermsService: LicenseTermsService,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (this.configService.get<string>('ENABLE_OTEL') !== 'true') {
      return next();
    }
    if (!(await this.licenseTermsService.getLicenseTermsInstance(LICENSE_FIELD.OBSERVABILITY_ENABLED))) {
      return next();
    }

    const span = trace.getSpan(context.active());
    const route = req.route?.path || req.path || 'unknown_route';
    const method = req.method || 'UNKNOWN_METHOD';
    const startTime = Date.now();

    if (span && route.startsWith('/api/') && route !== '/api/health') {
      span.updateName(`${method} ${route}`);
      span.setAttribute('http.route', route);
      span.setAttribute('http.method', method);

      recordApiHit({ route, method });

      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        const statusCode = res.statusCode;
        const duration = Date.now() - startTime;

        span.setAttribute('http.status_code', statusCode);
        recordApiDuration(duration, { route, method, status_code: statusCode });
        this.logger.log(
          `Setting up Otel logging : API ${method} ${route} completed with status ${statusCode} in ${duration}ms`
        );

        return originalJson(body);
      };
    }

    next();
  }
}
