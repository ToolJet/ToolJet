import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionAuthGuard } from '@modules/session/guards/session-auth-guard';

/** Account discovery only. Workspace authorization still uses the existing JWT guard and login evidence. */
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
    if (!(await super.canActivate(context))) throw new UnauthorizedException();
    const payload = this.jwt.decode(request.cookies.tj_auth_token);
    if (!payload || payload.isPATLogin || payload.oauthGrantId || payload.aud ||
        !(payload.isPasswordLogin || payload.isSSOLogin)) throw new UnauthorizedException();
    return true;
  }
}
