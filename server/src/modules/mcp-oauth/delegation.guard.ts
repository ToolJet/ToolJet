import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { McpOAuthIdentityService } from './identity.service';

/** Runs before route guards, including guards that allow anonymous public-app access. */
@Injectable()
export class McpDelegationGuard implements CanActivate {
  constructor(private readonly oauth: McpOAuthIdentityService) {}
  async canActivate(context: ExecutionContext) {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest();
    const credential = req.headers['x-tooljet-delegation'];
    if (credential === undefined) {
      const viewer = req.cookies?.tj_oauth_viewer;
      if (viewer === undefined) return true;
      if (typeof viewer !== 'string') throw new UnauthorizedException();
      const workspace = req.headers['tj-workspace-id'];
      if (workspace !== undefined && typeof workspace !== 'string') throw new UnauthorizedException();
      req.oauthDelegatedUser = await this.oauth.authenticateViewer(viewer, workspace);
      req.user = req.oauthDelegatedUser;
      return true;
    }
    if (typeof credential !== 'string' || typeof req.headers['tj-workspace-id'] !== 'string')
      throw new UnauthorizedException();
    req.oauthDelegatedUser = await this.oauth.authenticateDelegation(credential, req.headers['tj-workspace-id']);
    req.user = req.oauthDelegatedUser;
    return true;
  }
}
