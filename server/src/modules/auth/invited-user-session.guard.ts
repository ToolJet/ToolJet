import { BadRequestException, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationUsersService } from '@services/organization_users.service';
import { User } from 'src/entities/user.entity';
import { USER_STATUS } from 'src/helpers/user_lifecycle';

@Injectable()
export class InvitedUserSessionAuthGuard extends AuthGuard('jwt') {
	  constructor(private organizationUsersService: OrganizationUsersService) {
		super();
	  }
	  async canActivate(context: ExecutionContext): Promise<any> {
		const request = context.switchToHttp().getRequest();
		const workspaceInviteToken =  request.params.token;
		if(workspaceInviteToken){
		  const doesUserHaveSession = !!request.header['tj-workspace-id'] && !!request?.cookies['tj_auth_token'];
		  if (doesUserHaveSession) {
		    try {
			  const user = await super.canActivate(context);
			  return user;
		    } catch (err) {
			  /* case: the browser has old session of archive user or old cookies of same ip. */
			  return this.validateInviteUserSession(workspaceInviteToken)
		    }
		  }else {
		    /* No session at all */
		    return this.validateInviteUserSession(workspaceInviteToken)
		  }
		}else {
			throw new BadRequestException('Missing workspace invite token')
		}
	  }

	  async validateInviteUserSession(workspaceInviteToken: string) {
		  const user = await this.organizationUsersService.findByWorkspaceInviteToken(workspaceInviteToken); 
		  const { invitationToken, status } = user;
		  if(invitationToken && status === USER_STATUS.INVITED){
			/* User doesn't have a valid session & User didn't activate account yet */
			return user;
		  }else {
			/* User doesn't a session. Case: login again and accept invite */
			return false;
		  }
	  }
}