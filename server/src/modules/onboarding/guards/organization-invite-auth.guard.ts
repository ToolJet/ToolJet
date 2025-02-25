import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WORKSPACE_USER_SOURCE } from '@modules/users/constants/lifecycle';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';

@Injectable()
export class OrganizationInviteAuthGuard extends AuthGuard('jwt') {
  constructor(protected readonly organizationUserRepository: OrganizationUsersRepository) {
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

    const organizationUser = await this.organizationUserRepository.findByInvitationToken(request.body.token);
    if (organizationUser.source === WORKSPACE_USER_SOURCE.SIGNUP) {
      return true;
    }

    return false;
  }
}
