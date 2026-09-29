import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { isPlainObject } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { VALIDATION_WARNINGS_BODY_KEY, VALIDATION_WARNINGS_HEADER, VALIDATION_WARNINGS_LOCALS_KEY } from './constants';

// Adds recorded validation warnings to a successful response. Responses without warnings are untouched;
// arrays and class instances only get the header.
@Injectable()
export class ValidationWarningsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((body) => {
        const warnings = res?.locals?.[VALIDATION_WARNINGS_LOCALS_KEY];
        if (!warnings?.length) return body;

        if (!res.headersSent) res.setHeader(VALIDATION_WARNINGS_HEADER, String(warnings.length));
        if (body === undefined || body === null) return { [VALIDATION_WARNINGS_BODY_KEY]: warnings };
        if (isPlainObject(body)) return { ...(body as object), [VALIDATION_WARNINGS_BODY_KEY]: warnings };
        return body;
      })
    );
  }
}
