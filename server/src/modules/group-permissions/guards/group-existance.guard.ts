import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from '../constants';
import { GroupPermissionsRepository } from '../repository';
import { GroupPermissionsUtilService } from '../util.service';

@Injectable()
export class GroupExistenceGuard implements CanActivate {
  constructor(
    protected readonly groupPermissionsUtilService: GroupPermissionsUtilService,
    protected readonly groupPermissionsRepository: GroupPermissionsRepository,
    protected readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const features = this.reflector.get<string[]>('tjFeatureId', context.getHandler());
    const featureList = Array.isArray(features) ? features : features ? [features] : [];
    const id = request.params.id;

    if (!id) {
      return true;
    }

    const organizationId = request.user.organizationId;
    let groupId = id;

    if (featureList.includes(FEATURE_KEY.DELETE_GROUP_USER)) {
      const groupUser = await this.groupPermissionsRepository.getGroupUser(id);
      if (!groupUser) {
        throw new BadRequestException('Group not found');
      }
      groupId = groupUser.groupId;
    }

    // Check if the group exists for the given id and organization
    const groupResponse = await this.groupPermissionsUtilService.getGroupWithBuilderLevel(groupId, organizationId);
    request.group = groupResponse.group;
    request.tj_group = groupResponse.group;
    request.tj_resource_id = groupResponse.group.id;

    // If group doesn't exist, throw BadRequestException
    if (!groupResponse || Object.keys(groupResponse).length === 0) {
      throw new BadRequestException('Group not found');
    }

    return true;
  }
}
