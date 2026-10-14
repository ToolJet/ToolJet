import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { trace, context } from '@opentelemetry/api';
import { NextFunction } from 'express';
import { Request, Response } from 'express';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { routeSpanName } from '../../../otel/http-span';

@Injectable()
export class OtelMiddleware implements NestMiddleware {
  constructor(
    private readonly licenseTermsService: LicenseTermsService,
    private readonly configService: ConfigService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (this.configService.get<string>('ENABLE_OTEL') !== 'true') {
      return next();
    }
    // Observability license is an EE (self-hosted) construct. On Cloud, ToolJet operates
    // the platform — ENABLE_OTEL is the only gate.
    const isCloud = getTooljetEdition() === TOOLJET_EDITIONS.Cloud;
    if (!isCloud && !(await this.licenseTermsService.getLicenseTermsInstance(LICENSE_FIELD.OBSERVABILITY_ENABLED))) {
      return next();
    }

    const span = trace.getSpan(context.active());
    const named = routeSpanName(req);
    if (span && named) {
      span.updateName(named.name);
      span.setAttribute('http.route', named.route);
      span.setAttribute('http.method', req.method);
    }

    next();
  }
}
