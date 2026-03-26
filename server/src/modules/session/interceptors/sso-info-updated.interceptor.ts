import { Injectable, NestInterceptor, CallHandler, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Symbol used to flag that OIDC tokens were refreshed during this request.
 * Set on the request object in the JWT strategy, read here in the interceptor.
 * Using a Symbol avoids Express module augmentation and prevents property collisions.
 */
export const SSO_INFO_UPDATED = Symbol('ssoInfoUpdated');

/**
 * Interceptor that sets `X-SSO-Info-Updated: true` response header
 * when OIDC tokens have been refreshed during the request.
 *
 * Frontend can use this header to trigger a session refresh and
 * update the cached `globals.currentUser.ssoUserInfo` values.
 *
 * Note: In CE, the Symbol is never set (OIDC refresh is EE-only),
 * so this interceptor is effectively a no-op.
 */
@Injectable()
export class SsoInfoUpdatedInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        if (request?.[SSO_INFO_UPDATED] && response && !response.headersSent) {
          response.setHeader('X-SSO-Info-Updated', 'true');
        }
      })
    );
  }
}
