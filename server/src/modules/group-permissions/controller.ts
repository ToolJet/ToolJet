import { AddGroupUserDto, CreateGroupPermissionDto, DuplicateGroupDtoBase, UpdateGroupPermissionDto } from './dto';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import { GroupPermissionsService } from './service';
import { GroupExistenceGuard } from './guards/group-existance.guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { IGroupPermissionsControllerV2 } from './interfaces/IController';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GetUsersResponse } from './types';
import { GroupUsers } from '@entities/group_users.entity';
import { Group } from './decorators/group.decorator';

@Controller({
  path: 'group-permissions',
  version: '2',
})
@InitModule(MODULES.GROUP_PERMISSIONS)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class GroupPermissionsControllerV2 implements IGroupPermissionsControllerV2 {
  constructor(protected groupPermissionsService: GroupPermissionsService) {}

  // Should move this to EE, since different behavior for EE and CE
  @InitFeature(FEATURE_KEY.CREATE)
  @Post()
  async create(
    @User() user: UserEntity,
    @Body() createGroupPermissionDto: CreateGroupPermissionDto
  ): Promise<GroupPermissions> {
    return await this.groupPermissionsService.create(user.organizationId, createGroupPermissionDto.name);
  }

  @InitFeature(FEATURE_KEY.GET_ONE)
  @UseGuards(GroupExistenceGuard)
  @Get(':id')
  async get(
    @User() user: UserEntity,
    @Param('id') id: string
  ): Promise<{ group: GroupPermissions; isBuilderLevel: boolean }> {
    return await this.groupPermissionsService.getGroup(user.organizationId, id);
  }

  @InitFeature(FEATURE_KEY.GET_ALL)
  @Get()
  async getAll(@User() user: UserEntity): Promise<GetUsersResponse> {
    const { organizationId } = user;
    return await this.groupPermissionsService.getAllGroup(organizationId);
  }

  @InitFeature(FEATURE_KEY.UPDATE)
  @UseGuards(GroupExistenceGuard)
  @Put(':id')
  // Update a custom group
  async update(@User() user: UserEntity, @Param('id') id: string, @Body() updateGroupDto: UpdateGroupPermissionDto) {
    /* 
    License Validation check - 
      1. CE - Anyone can create update custom groups but no'one can update defaul group
      2. EE/Cloud - Basic Plan - No'one can update custom and default group
            - Paid Plan - Can update only custom and default -builder custom group
    */
    return await this.groupPermissionsService.updateGroup(id, user.organizationId, updateGroupDto);
  }

  @InitFeature(FEATURE_KEY.DELETE)
  @UseGuards(GroupExistenceGuard)
  @Delete(':id')
  async delete(@User() user: UserEntity, @Param('id') id: string) {
    return await this.groupPermissionsService.deleteGroup(id, user.organizationId);
  }

  @InitFeature(FEATURE_KEY.DUPLICATE)
  @UseGuards(GroupExistenceGuard)
  @Post(':id/duplicate')
  async duplicateGroup(
    @User() user: UserEntity,
    @Param('id') groupId: string,
    @Body() duplicateGroupDto: DuplicateGroupDtoBase
  ) {
    return await this.groupPermissionsService.duplicateGroup(groupId, user.organizationId, duplicateGroupDto);
  }

  @InitFeature(FEATURE_KEY.ADD_GROUP_USER)
  @UseGuards(GroupExistenceGuard)
  @Post(':id/users')
  async createGroupUsers(
    @User() user: UserEntity,
    @Param('id') groupId: string,
    @Body() addGroupUserDto: AddGroupUserDto
  ) {
    const { organizationId } = user;
    addGroupUserDto.groupId = groupId;
    await this.groupPermissionsService.addGroupUsers(addGroupUserDto, organizationId);
    return;
  }

  // Used for Roles and Groups
  @InitFeature(FEATURE_KEY.GET_ALL_GROUP_USER)
  @UseGuards(GroupExistenceGuard)
  @Get(':id/users')
  async getAllGroupUser(
    @User() user: UserEntity,
    @Query('input') searchInput: string,
    @Group() group: GroupPermissions
  ): Promise<GroupUsers[]> {
    return await this.groupPermissionsService.getAllGroupUsers(group, user.organizationId, searchInput);
  }

  @InitFeature(FEATURE_KEY.DELETE_GROUP_USER)
  @Delete('users/:id')
  async deleteGroupUser(@User() user: UserEntity, @Param('id') id: string) {
    await this.groupPermissionsService.deleteGroupUser(id, user.organizationId);
  }

  @InitFeature(FEATURE_KEY.GET_ADDABLE_USERS)
  @UseGuards(GroupExistenceGuard)
  @Get(':id/users/addable-users')
  async getAddableGroupUser(
    @User() user: UserEntity,
    @Param('id') groupId: string,
    @Query('input') searchInput: string
  ): Promise<UserEntity[]> {
    return await this.groupPermissionsService.getAddableUser(groupId, user.organizationId, searchInput.trim());
  }
}
