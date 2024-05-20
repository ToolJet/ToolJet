import { CreateGranularPermissionDto } from '@dto/granular-permissions.dto';
import {
  AddGroupUserDto,
  CreateGroupPermissionDto,
  EditUserRoleDto,
  UpdateGroupPermissionDto,
} from '@dto/group_permissions.dto';
import { JwtAuthGuard } from '@module/auth/jwt-auth.guard';
import { validateGranularPermissionCreateOperation } from '@module/user_resource_permissions/utility/granular-permissios.utility';
import { validateCreateGroupOperation } from '@module/user_resource_permissions/utility/group-permissions.utility';
import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { GranularPermissionsService } from '@services/granular_permissions.service';
import { GroupPermissionsServiceV2 } from '@services/group_permissions.service.v2';
import { UserRoleService } from '@services/user-role.service';
import { User } from 'src/decorators/user.decorator';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';

@Controller({
  path: 'group_permissions',
  version: '2',
})
export class GroupPermissionsControllerV2 {
  constructor(
    private groupPermissionsService: GroupPermissionsServiceV2,
    private userRoleService: UserRoleService,
    private granularPermissionsService: GranularPermissionsService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@User() user, @Body() createGroupPermissionDto: CreateGroupPermissionDto) {
    validateCreateGroupOperation(createGroupPermissionDto);
    return await this.groupPermissionsService.create(user, createGroupPermissionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@User() user, @Param('id') id: string) {
    return await this.groupPermissionsService.getGroup(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@User() user) {
    const { organizationId } = user;
    return await this.groupPermissionsService.getAllGroup(organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async update(@User() user, @Param('id') id: string, @Body() updateGroupDto: UpdateGroupPermissionDto) {
    return await this.groupPermissionsService.updateGroup(id, updateGroupDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') id: string) {
    return await this.groupPermissionsService.deleteGroup(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('group-user')
  async createGroupUser(@User() user, @Body() addGroupUserDto: AddGroupUserDto) {
    const { organizationId } = user;
    return await this.groupPermissionsService.addGroupUser(addGroupUserDto, organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':groupId/group-user')
  async getAllGroupUser(@User() user, @Param('groupId') groupId: string) {
    return await this.groupPermissionsService.getAllGroupUsers(groupId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('group-user/:id')
  async deleteGroupUser(@User() user, @Param('id') id: string) {
    return await this.groupPermissionsService.deleteGroupUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('user-role')
  async updateUserRole(@User() user, @Body() editRoleDto: EditUserRoleDto) {
    const { organizationId } = user;
    return await this.userRoleService.editDefaultGroupUserRole(editRoleDto, organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('granular-permissions')
  async createGranularPermissions(@User() user, @Body() createGranularPermissionsDto: CreateGranularPermissionDto) {
    //Check for license validation first here
    const { groupId } = createGranularPermissionsDto;
    const group = await this.groupPermissionsService.getGroup(groupId);
    validateGranularPermissionCreateOperation(group);
    return await this.granularPermissionsService.create(createGranularPermissionsDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('granular-permissions')
  async getAllGranularPermissions(@User() user, @Param('id') groupId: string): Promise<GranularPermissions[]> {
    const granularPermissions: GranularPermissions[] = await this.granularPermissionsService.getAll({
      groupId: groupId,
    });
    return granularPermissions;
  }
}
