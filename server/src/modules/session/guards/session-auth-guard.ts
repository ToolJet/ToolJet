import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SessionAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<any> {
    let user;
    const request = context.switchToHttp().getRequest();
    // ✅ Allow execution only if one of the expected auth methods is present
    const hasJwtCookie = !!request.cookies['tj_auth_token'];
    const hasPatHeader = !!request.headers['tj_auth_token'];

    if (!hasJwtCookie && !hasPatHeader) {
      return false;
    }

    request.isGetUserSession = true;
    try {
      user = await super.canActivate(context);
    } catch (err) {
      return false;
    }
    return user;
  }
}
