import { Controller, Body, Post, Get, Put, Delete, UseGuards, Param, Query } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { GroupPermissionsService } from '../services/group_permissions.service';
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';
import { AppAbility } from 'src/modules/casl/casl-ability.factory';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/entities/user.entity';
import {
  CreateGroupPermissionDto,
  UpdateGroupPermissionDto,
  UpdateGroupsAppsDto,
  UpdateGroupsUsersDto,
  UpdateGroupsDataSourcesDto,
  UpdateGroupDto,
} from '@dto/group-permission.dto';

@Controller('group_permissions')
export class GroupPermissionsController {
  constructor(private groupPermissionsService: GroupPermissionsService) {}

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('createGroupPermission', UserEntity))
  @Post()
  async create(@User() user, @Body() createGroupPermissionDto: CreateGroupPermissionDto) {
    await this.groupPermissionsService.create(user, createGroupPermissionDto.group);
    return;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('accessGroupPermission', UserEntity))
  @Get(':id')
  async show(@User() user, @Param('id') id: string) {
    const groupPermission = await this.groupPermissionsService.findOne(user, id);

    return decamelizeKeys(groupPermission);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateGroupAppPermission', UserEntity))
  @Put(':id/app_group_permissions/:appGroupPermissionId')
  async updateAppGroupPermission(
    @Body() updateGroupPermissionDto: UpdateGroupPermissionDto,
    @User() user,
    @Param('id') id: string,
    @Param('appGroupPermissionId') appGroupPermissionId: string
  ) {
    await this.groupPermissionsService.updateAppGroupPermission(
      user,
      id,
      appGroupPermissionId,
      updateGroupPermissionDto.actions
    );
    return;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateGroupDataSourcePermission', UserEntity))
  @Put(':id/data_source_group_permissions/:dataSourceGroupPermissionId')
  async updateDataSourceGroupPermission(
    @Body() updateGroupPermissionDto: UpdateGroupPermissionDto,
    @User() user,
    @Param('id') id: string,
    @Param('dataSourceGroupPermissionId') dataSourcepGroupPermissionId: string
  ) {
    await this.groupPermissionsService.updateDataSourceGroupPermission(
      user,
      id,
      dataSourcepGroupPermissionId,
      updateGroupPermissionDto.actions
    );
    return;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateGroupUserPermission', UserEntity))
  @Put(':id/user')
  async updateUser(@User() user, @Param('id') id, @Body() body: UpdateGroupsUsersDto) {
    await this.groupPermissionsService.update(user, id, body);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateGroupAppPermission', UserEntity))
  @Put(':id/app')
  async updateApp(@User() user, @Param('id') id, @Body() body: UpdateGroupsAppsDto) {
    await this.groupPermissionsService.update(user, id, body);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateGroupDataSourcePermission', UserEntity))
  @Put(':id/data-source')
  async updateDataSource(@User() user, @Param('id') id, @Body() body: UpdateGroupsDataSourcesDto) {
    await this.groupPermissionsService.update(user, id, body);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateGroupPermission', UserEntity))
  @Put(':id')
  async update(@User() user, @Param('id') id, @Body() body: UpdateGroupDto) {
    await this.groupPermissionsService.update(user, id, body);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('accessGroupPermission', UserEntity))
  @Get()
  async index(@User() user) {
    const groupPermissions = await this.groupPermissionsService.findAll(user);

    return decamelizeKeys({ groupPermissions });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('deleteGroupPermission', UserEntity))
  @Delete(':id')
  async destroy(@User() user, @Param('id') id) {
    await this.groupPermissionsService.destroy(user, id);
    return;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('accessGroupPermission', UserEntity))
  @Get(':id/apps')
  async apps(@User() user, @Param('id') id) {
    const apps = await this.groupPermissionsService.findApps(user, id);

    return decamelizeKeys({ apps });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateGroupAppPermission', UserEntity))
  @Get(':id/addable_apps')
  async addableApps(@User() user, @Param('id') id) {
    const apps = await this.groupPermissionsService.findAddableApps(user, id);

    return decamelizeKeys({ apps });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('accessGroupPermission', UserEntity))
  @Get(':id/data_sources')
  async datasources(@User() user, @Param('id') id) {
    const dataSources = await this.groupPermissionsService.findDataSources(user, id);
    return decamelizeKeys({ dataSources });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateGroupDataSourcePermission', UserEntity))
  @Get(':id/addable_data_sources')
  async addableDataSources(@User() user, @Param('id') id) {
    const dataSources = await this.groupPermissionsService.findAddableDataSources(user, id);

    return decamelizeKeys({ dataSources });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('accessGroupPermission', UserEntity))
  @Get(':id/users')
  async users(@User() user, @Param('id') id) {
    const users = await this.groupPermissionsService.findUsers(user, id);

    return decamelizeKeys({ users });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateGroupUserPermission', UserEntity))
  @Get(':id/addable_users')
  async addableUsers(@User() user, @Param('id') id, @Query('input') searchInput) {
    const users = await this.groupPermissionsService.findAddableUsers(user, id, searchInput);

    return decamelizeKeys({ users });
  }
}
