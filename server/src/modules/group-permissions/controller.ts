import { AddGroupUserDto, CreateGroupPermissionDto, DuplicateGroupDtoBase, UpdateGroupPermissionDto, PaginationQueryDto } from './dto';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Res, HttpStatus, HttpCode, ParseUUIDPipe } from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
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
import { GetUsersResponse, PaginatedGroupUsersResponse } from './types';
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
    return await this.groupPermissionsService.create(user, createGroupPermissionDto.name);
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
    return await this.groupPermissionsService.updateGroup(id, user, updateGroupDto);
  }

  @InitFeature(FEATURE_KEY.DELETE)
  @UseGuards(GroupExistenceGuard)
  @Delete(':id')
  async delete(@User() user: UserEntity, @Param('id') id: string) {
    return await this.groupPermissionsService.deleteGroup(id, user);
  }

  @InitFeature(FEATURE_KEY.DUPLICATE)
  @UseGuards(GroupExistenceGuard)
  @Post(':id/duplicate')
  async duplicateGroup(
    @User() user: UserEntity,
    @Param('id') groupId: string,
    @Body() duplicateGroupDto: DuplicateGroupDtoBase
  ) {
    return await this.groupPermissionsService.duplicateGroup(groupId, user, duplicateGroupDto);
  }

  @InitFeature(FEATURE_KEY.ADD_GROUP_USER)
  @UseGuards(GroupExistenceGuard)
  @Post(':id/users')
  async createGroupUsers(
    @User() user: UserEntity,
    @Param('id') groupId: string,
    @Body() addGroupUserDto: AddGroupUserDto
  ) {
    addGroupUserDto.groupId = groupId;
    await this.groupPermissionsService.addGroupUsers(addGroupUserDto, user);
    return;
  }

  @InitFeature(FEATURE_KEY.ADD_SINGLE_USER)
  @UseGuards(GroupExistenceGuard)
  @Post(':groupId/users/:userId')
  async addSingleUserToGroup(
    @User() user: UserEntity,
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @Res() res: Response
  ) {
    const result = await this.groupPermissionsService.addSingleUserToGroup(groupId, userId, user.organizationId, user);
    const statusCode = result.message === 'User already exists in group' ? HttpStatus.OK : HttpStatus.CREATED;
    return res.status(statusCode).json(result);
  }

  @InitFeature(FEATURE_KEY.DELETE_USER_FROM_GROUP)
  @UseGuards(GroupExistenceGuard)
  @Delete(':groupId/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSingleUserFromGroup(
    @User() user: UserEntity,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('userId', ParseUUIDPipe) userId: string
  ): Promise<void> {
    await this.groupPermissionsService.removeSingleUserFromGroup(groupId, userId, user.organizationId, user);
  }

  // Used for Roles and Groups
  @InitFeature(FEATURE_KEY.GET_ALL_GROUP_USER)
  @UseGuards(GroupExistenceGuard)
  @Get(':id/users')
  @ApiOperation({
    summary: 'Get all users in a group',
    description: 'Returns all users in a group. Supports optional pagination via query parameters. Without pagination params, returns full user array for backward compatibility.'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (minimum 1, default: returns all users if omitted)',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of users per page (1-100, default: 50 when page is provided)',
    example: 50
  })
  @ApiQuery({
    name: 'input',
    required: false,
    type: String,
    description: 'Search filter for user email, firstName, or lastName (case-insensitive)'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns either an array of users (no pagination) or paginated response object',
    schema: {
      oneOf: [
        {
          type: 'array',
          description: 'User array (when pagination params not provided - backward compatibility)',
          items: { type: 'object' }
        },
        {
          type: 'object',
          description: 'Paginated response (when pagination params provided)',
          properties: {
            users: {
              type: 'array',
              items: { type: 'object' }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 50 },
                total: { type: 'number', example: 120 },
                totalPages: { type: 'number', example: 3 }
              }
            }
          }
        }
      ]
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid pagination parameters (page < 1, limit < 1 or > 100)' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - User lacks required permissions' })
  @ApiResponse({ status: 404, description: 'Group not found or does not belong to organization' })
  async getAllGroupUser(
    @User() user: UserEntity,
    @Query('input') searchInput: string,
    @Group() group: GroupPermissions,
    @Query() paginationQuery: PaginationQueryDto
  ): Promise<GroupUsers[] | PaginatedGroupUsersResponse> {
    return await this.groupPermissionsService.getAllGroupUsers(
      group,
      user.organizationId,
      searchInput,
      paginationQuery.page,
      paginationQuery.limit
    );
  }

  @InitFeature(FEATURE_KEY.DELETE_GROUP_USER)
  @Delete('users/:id')
  async deleteGroupUser(@User() user: UserEntity, @Param('id') id: string) {
    await this.groupPermissionsService.deleteGroupUser(id, user);
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
