import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SwitchWorkspaceAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<any> {
    let user;
    const request = context.switchToHttp().getRequest();
    request.isSwitchingOrganization = true;
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
