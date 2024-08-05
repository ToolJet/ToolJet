import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CustomHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        response.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
        response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return data;
      })
    );
  }
}
