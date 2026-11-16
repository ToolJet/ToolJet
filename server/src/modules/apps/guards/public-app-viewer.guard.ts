import { createParamDecorator, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@entities/user.entity';

export type PublicAppViewerRequest = { user?: User; tj_app?: { isPublic?: boolean }; tj_public_app_viewer?: User };

/**
 * On a public app AppAuthGuard skips login, so a signed-in workspace member is anonymous there.
 * This resolves them anyway, best effort, into `tj_public_app_viewer` only: `request.user` stays
 * empty so permission checks behave exactly as for an anonymous visitor. Never blocks the request.
 */
@Injectable()
export class PublicAppViewerGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PublicAppViewerRequest>();
    if (!request.tj_app?.isPublic || request.user) return true;
    try {
      if (await super.canActivate(context)) request.tj_public_app_viewer = request.user;
    } catch {
      // Not signed in, or not a member of the app's workspace: stays anonymous.
    }
    delete request.user;
    return true;
  }
}

/** The signed-in member PublicAppViewerGuard found on a public app, if any. */
export const PublicAppViewer = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): User | undefined =>
    ctx.switchToHttp().getRequest<PublicAppViewerRequest>().tj_public_app_viewer
);
