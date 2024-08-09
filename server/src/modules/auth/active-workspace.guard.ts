import { Injectable, ExecutionContext, BadRequestException, CanActivate } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class ActiveWorkspaceGuard implements CanActivate {
  constructor(private readonly _dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    return await this.validateUserActiveOnOrganization(request.user, request.params.organizationId);
  }

  private async validateUserActiveOnOrganization(user: User, organizationId: string) {
    const organizationUser = await this._dataSource.manager.findOne(OrganizationUser, {
      where: { userId: user.id, organizationId },
      select: ['id', 'status'],
    });
    if (isEmpty(organizationUser)) throw new BadRequestException('Workspace not found');
    if (organizationUser.status !== 'active') throw new BadRequestException('User is not active on workspace');

    return true;
  }
}
