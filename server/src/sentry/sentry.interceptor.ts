import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { SentryService } from './sentry.service';
import * as Sentry from '@sentry/node';

/**
 * We must be in Request scope as we inject SentryService
 */
@Injectable({ scope: Scope.REQUEST })
export class SentryInterceptor implements NestInterceptor {
  constructor(private sentryService: SentryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // start a child span for performance tracing
    const span = this.sentryService.startChild({ op: `route handler` });

    return next.handle().pipe(
      catchError((error) => {
        // capture the error, you can filter out some errors here
        Sentry.captureException(
          error,
          this.sentryService.span.getTraceContext(),
        );

        // throw again the error
        return throwError(() => error);
      }),
      finalize(() => {
        span.finish();
        this.sentryService.span.finish();
      }),
    );
  }
}
