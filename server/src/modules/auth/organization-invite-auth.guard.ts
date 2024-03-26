import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OrganizationInviteAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<any> {
    let user;
    const request = context.switchToHttp().getRequest();
    request.isInviteSession = true;
    request.isUserNotMandatory = true;
    if (request?.cookies['tj_auth_token']) {
      try {
        user = await super.canActivate(context);
      } catch (err) {
        return false;
      }
      return user;
    }
    return false;
  }
}
