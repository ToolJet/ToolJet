import { Injectable, NestInterceptor } from '@nestjs/common';
import { CallHandler, ExecutionContext } from '@nestjs/common/interfaces';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MODULES } from '@modules/app/constants/modules';
import { AuditLogFields } from '@modules/audit-logs/types';
import { Reflector } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { MODULE_INFO } from '@modules/app/constants/module-info';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FeatureConfig } from '../types';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '../constants';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector, private logger: Logger, private eventEmitter: EventEmitter2) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async (data) => {
        const response = context.switchToHttp().getResponse();

        if (!response) {
          return;
        }

        const logsData: AuditLogFields = response.locals?.[AUDIT_LOGS_REQUEST_CONTEXT_KEY];

        const module = this.reflector.get<MODULES>('tjModuleId', context.getClass());
        let features = this.reflector.get<string[]>('tjFeatureId', context.getHandler());

        if (features && !Array.isArray(features)) {
          features = [features];
        }

        const featureInfo: FeatureConfig = MODULE_INFO?.[module]?.[features[0]];

        if (!featureInfo || featureInfo?.skipAuditLogs || !logsData || !logsData?.userId) {
          return;
        }

        // Check if the status code indicates success (2xx)
        const isSuccess = response.statusCode >= 200 && response.statusCode < 300;

        if (isSuccess) {
          try {
            this.eventEmitter.emit('auditLogEntry', {
              ...logsData,
              resourceType: module,
              actionType: featureInfo?.auditLogsKey || features[0],
            });
          } catch (error) {
            console.error('Failed to create audit log:', error);
          }
        }
      })
    );
  }
}
