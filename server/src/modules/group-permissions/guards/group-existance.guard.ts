import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import * as _ from 'lodash';
import { GroupPermissionsUtilService } from '../util.service';

@Injectable()
export class GroupExistenceGuard implements CanActivate {
  constructor(protected readonly groupPermissionsUtilService: GroupPermissionsUtilService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const id = request.params.id;

    // If there's no id parameter, throw error
    if (!id) {
      throw new BadRequestException('Group not found');
    }

    // Check if the group exists for the given id and organization
    const groupResponse = await this.groupPermissionsUtilService.getGroupWithBuilderLevel(
      id,
      request.user.organizationId
    );
    request.group = groupResponse.group;

    // If group doesn't exist, throw BadRequestException
    if (_.isEmpty(groupResponse)) {
      throw new BadRequestException('Group not found');
    }

    return true;
  }
}
