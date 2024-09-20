import { CreateGranularPermissionDto, UpdateGranularPermissionDto } from '@dto/granular-permissions.dto';
import {
  AddGroupUserDto,
  CreateGroupPermissionDto,
  EditUserRoleDto,
  UpdateGroupPermissionDto,
} from '@dto/group_permissions.dto';
import { User as UserEntity } from 'src/entities/user.entity';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { AppAbility } from '@modules/casl/casl-ability.factory';
import { CheckPolicies } from '@modules/casl/check_policies.decorator';
import { PoliciesGuard } from '@modules/casl/policies.guard';
import { GroupPermissionsUtilityService } from '@modules/user_resource_permissions/services/group-permissions.utility.service';
import {
  validateGranularPermissionCreateOperation,
  validateGranularPermissionUpdateOperation,
} from '@modules/user_resource_permissions/utility/granular-permissios.utility';
import {
  validateCreateGroupOperation,
  validateDeleteGroupUserOperation,
} from '@modules/user_resource_permissions/utility/group-permissions.utility';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { GranularPermissionsService } from '@services/granular_permissions.service';
import { GroupPermissionsServiceV2 } from '@services/group_permissions.service.v2';
import { UserRoleService } from '@services/user-role.service';
import { ORGANIZATION_RESOURCE_ACTIONS } from 'src/constants/global.constant';
import { User } from 'src/decorators/user.decorator';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { DuplucateGroupDto } from '@dto/group-permission.dto';

@Controller({
  path: 'group_permissions',
  version: '2',
})
export class GroupPermissionsControllerV2 {
  constructor(
    private groupPermissionsService: GroupPermissionsServiceV2,
    private userRoleService: UserRoleService,
    private granularPermissionsService: GranularPermissionsService,
    private groupPermissionUtilityService: GroupPermissionsUtilityService
  ) {}

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Post()
  async create(@User() user, @Body() createGroupPermissionDto: CreateGroupPermissionDto) {
    /* 
    License Validation check - 
      1. CE - Anyone can create custom groups
      2. EE/Cloud - Basic Plan - Cant create custom group
            - Paid Plan - Can create custom group
    */
    validateCreateGroupOperation(createGroupPermissionDto);
    const { organizationId } = user;
    return await this.groupPermissionsService.create(organizationId, createGroupPermissionDto);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Get(':id')
  async get(@User() user, @Param('id') id: string) {
    return await this.groupPermissionsService.getGroup(user.organizationId, id);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Get()
  async getAll(@User() user) {
    const { organizationId } = user;
    return await this.groupPermissionsService.getAllGroup(organizationId);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Put(':id')
  async update(@User() user, @Param('id') id: string, @Body() updateGroupDto: UpdateGroupPermissionDto) {
    /* 
    License Validation check - 
      1. CE - Anyone can create update custom groups but no'one can update defaul group
      2. EE/Cloud - Basic Plan - No'one can update custom and default group
            - Paid Plan - Can update only custom and default -builder custom group
    */
    return await this.groupPermissionsService.updateGroup({ id, organizationId: user.organizationId }, updateGroupDto);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Delete(':id')
  async delete(@User() user, @Param('id') id: string) {
    return await this.groupPermissionsService.deleteGroup(id, user.organizationId);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Post(':id/duplicate')
  async duplicateGroup(@User() user, @Param('id') groupId: string, @Body() duplicateGroupDto: DuplucateGroupDto) {
    return await this.groupPermissionsService.duplicateGroup(
      { groupId, organizationId: user.organizationId },
      duplicateGroupDto
    );
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Post('group-user')
  async createGroupUsers(@User() user, @Body() addGroupUserDto: AddGroupUserDto) {
    const { organizationId } = user;
    return await this.groupPermissionsService.addGroupUsers(addGroupUserDto, organizationId);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Get(':groupId/group-user')
  async getAllGroupUser(@User() user, @Param('groupId') groupId: string, @Query('input') searchInput: string) {
    return await this.groupPermissionsService.getAllGroupUsers(
      { groupId, organizationId: user.organizationId },
      searchInput
    );
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Delete('group-user/:id')
  async deleteGroupUser(@User() user, @Param('id') id: string) {
    const groupUser = await this.groupPermissionsService.getGroupUser(id);
    validateDeleteGroupUserOperation(groupUser?.group, user.organizationId);
    return await this.groupPermissionsService.deleteGroupUser(id);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Get(':groupId/group-user/addable-users')
  async getAddableGroupUser(@User() user, @Param('groupId') groupId: string, @Query('input') searchInput: string) {
    return await this.groupPermissionUtilityService.getAddableUser(user, groupId, searchInput.trim());
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Get('granular-permissions/addable-apps')
  async getAddableApps(@User() user) {
    return await this.groupPermissionUtilityService.getAddableApps(user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Put('user-role/edit')
  async updateUserRole(@User() user, @Body() editRoleDto: EditUserRoleDto) {
    await this.userRoleService.editDefaultGroupUserRole(editRoleDto, user.organizationId, null, {
      updatedAdmin: user.id,
    });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Post('granular-permissions')
  async createGranularPermissions(@User() user, @Body() createGranularPermissionsDto: CreateGranularPermissionDto) {
    const { groupId, createAppsPermissionsObject } = createGranularPermissionsDto;
    const { group } = await this.groupPermissionsService.getGroup(user.organizationId, groupId);
    validateGranularPermissionCreateOperation(group);
    return await this.granularPermissionsService.create(
      {
        createGranularPermissionDto: createGranularPermissionsDto,
        organizationId: user.organizationId,
      },
      createAppsPermissionsObject
    );
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Get(':groupId/granular-permissions')
  async getAllGranularPermissions(@User() user, @Param('groupId') groupId: string): Promise<GranularPermissions[]> {
    const granularPermissions: GranularPermissions[] = await this.granularPermissionsService.getAll({
      groupId: groupId,
    });
    return granularPermissions;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Put('granular-permissions/update/:id')
  async updateGranularPermissions(
    @User() user,
    @Param('id') granularPermissionsId: string,
    @Body() updateGranularPermissionDto: UpdateGranularPermissionDto
  ) {
    //Check for license validation first here
    // What are license validation for this
    // const { groupId } = createGranularPermissionsDto;

    const granularPermissions = await this.granularPermissionsService.get(granularPermissionsId);
    const group = granularPermissions.group;

    validateGranularPermissionUpdateOperation(group, user.organizationId);
    return await this.granularPermissionsService.update(granularPermissionsId, {
      group: group,
      organizationId: group.organizationId,
      updateGranularPermissionDto,
    });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, UserEntity))
  @Delete('granular-permissions/:id')
  async deleteGranularPermissions(@User() user, @Param('id') granularPermissionsId: string): Promise<void> {
    await this.granularPermissionsService.delete(granularPermissionsId);
  }
}
