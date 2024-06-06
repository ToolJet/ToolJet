import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationUsersService } from '@services/organization_users.service';
import { WORKSPACE_USER_SOURCE } from 'src/helpers/user_lifecycle';

@Injectable()
export class OrganizationInviteAuthGuard extends AuthGuard('jwt') {
  constructor(private organizationUsersService: OrganizationUsersService) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<any> {
    let user: any;
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

    const organizationUser = await this.organizationUsersService.getUser(request.body.token);
    if (organizationUser.source === WORKSPACE_USER_SOURCE.SIGNUP) {
      return true;
    }

    return false;
  }
}
