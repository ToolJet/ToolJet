import { Injectable, ExecutionContext, BadRequestException, CanActivate } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { getManager } from 'typeorm';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';

@Injectable()
export class ActiveWorkspaceGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    return await this.validateUserActiveOnOrganization(request.user, request.params.organizationId);
  }

  private async validateUserActiveOnOrganization(user: User, organizationId: string) {
    const organizationUser = await getManager().findOne(OrganizationUser, {
      where: { userId: user.id, organizationId },
      select: ['id', 'status'],
    });
    if (isEmpty(organizationUser)) throw new BadRequestException('Workspace not found');
    if (organizationUser.status !== 'active') throw new BadRequestException('User is not active on workspace');

    return true;
  }
}
