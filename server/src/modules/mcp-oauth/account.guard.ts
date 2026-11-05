import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionAuthGuard } from '@modules/session/guards/session-auth-guard';

/** Live browser identity. The OAuth service separately enforces selected-workspace access and login policy. */
@Injectable()
export class McpOAuthAccountGuard extends SessionAuthGuard {
  constructor(private readonly jwt: JwtService) { super(); }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (typeof request.cookies?.tj_auth_token !== 'string' || request.cookies.tj_oauth_viewer ||
        request.headers.tj_auth_token || request.headers['x-tooljet-delegation']) {
      throw new UnauthorizedException();
    }
    // SessionAuthGuard verifies this exact cookie and the live platform session.
    request.isMcpOAuthAccount = true;
    if (!(await super.canActivate(context))) throw new UnauthorizedException();
    const payload = this.jwt.decode(request.cookies.tj_auth_token);
    if (
      !payload ||
      payload.username !== request.user?.id ||
      payload.isPATLogin ||
      payload.oauthGrantId ||
      payload.aud ||
      !(payload.isPasswordLogin || payload.isSSOLogin)
    )
      throw new UnauthorizedException();
    Object.assign(request.user, {
      isPasswordLogin: payload.isPasswordLogin,
      isSSOLogin: payload.isSSOLogin,
      workspaceAuthentication: payload.workspaceAuthentication,
    });
    return true;
  }
}
