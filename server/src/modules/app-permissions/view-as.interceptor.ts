import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
  UseInterceptors,
  createParamDecorator,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, from, switchMap } from 'rxjs';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { VIEW_AS_HEADER } from './constants';
import { PermissionSubject } from './types/view-as';
import { ViewAsService } from './view-as.service';

type ViewAsRequest = Request & { user: User; tj_app?: App; permissionSubject?: PermissionSubject };

// Resolves the "View as" header once per request, after the guards have loaded the user and the
// app, so every route that honours it applies the same checks. The handler reads the result with
// @ViewAsSubject() and never sees the raw header.
@Injectable()
export class ViewAsInterceptor implements NestInterceptor {
  constructor(private readonly viewAsService: ViewAsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<ViewAsRequest>();
    const resolving = this.viewAsService.resolve({
      user: request.user,
      app: request.tj_app,
      mode: typeof request.query?.mode === 'string' ? request.query.mode : undefined,
      viewAs: request.header(VIEW_AS_HEADER),
    });

    return from(resolving).pipe(
      switchMap((subject) => {
        request.permissionSubject = subject;
        return next.handle();
      })
    );
  }
}

/** Marks a route as honouring the View as header. Pair it with @ViewAsSubject() on a parameter. */
export const ResolveViewAs = () => UseInterceptors(ViewAsInterceptor);

/**
 * The subject page, component and query permissions are checked for: the requester, or whoever
 * the Builder is previewing as. Only valid on a route marked @ResolveViewAs().
 */
export const ViewAsSubject = createParamDecorator((_data: unknown, ctx: ExecutionContext): PermissionSubject => {
  const subject = ctx.switchToHttp().getRequest<ViewAsRequest>().permissionSubject;
  if (!subject) {
    throw new InternalServerErrorException('@ViewAsSubject() is used on a route without @ResolveViewAs()');
  }
  return subject;
});
