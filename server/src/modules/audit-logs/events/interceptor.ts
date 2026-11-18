import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { mergeMap, switchMap } from 'rxjs/operators';
import { TransactionLogger } from '@modules/logging/service';
import { IAuditEngine } from './interfaces';

/**
 * Wraps every route that has an audit spec. Audit work must never change the response:
 * every engine failure is logged and swallowed. If the handler throws, nothing is recorded.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly engine: IAuditEngine,
    private readonly logger: TransactionLogger
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http' || this.engine.isNoop || !this.engine.hasSpec(context)) {
      return next.handle();
    }

    const before = this.engine.before(context).catch((error) => {
      this.logger.error(`Audit capture before handler failed: ${error?.message}`);
      return null;
    });

    return from(before).pipe(
      switchMap((pending) =>
        next.handle().pipe(
          mergeMap(async (result) => {
            if (pending) {
              await this.engine.schedule(() =>
                this.engine.after(pending, context, result).catch((error) => {
                  this.logger.error(`Audit capture after handler failed: ${error?.message}`);
                })
              );
            }
            return result;
          })
        )
      )
    );
  }
}
