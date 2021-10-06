import { Controller, Post, Get, Put, Delete, Request, UseGuards, Param } from '@nestjs/common';

import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { GroupPermissionsService } from '../services/group_permissions.service';
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';
import { AppAbility } from 'src/modules/casl/casl-ability.factory';
import { User } from 'src/entities/user.entity';

@Controller('group_permissions')
export class GroupPermissionsController {
  constructor(private groupPermissionsService: GroupPermissionsService) {}

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('createGroupPermission', User))
  @Post()
  async create(@Request() req) {
    const groupPermission = await this.groupPermissionsService.create(req.user, req.body.group);

    return decamelizeKeys(groupPermission);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async show(@Request() req, @Param() params) {
    const groupPermission = await this.groupPermissionsService.findOne(req.user, params.id);

    return decamelizeKeys({ groupPermission });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateAppGroupPermission', User))
  @Put(':id/app_group_permissions/:appGroupPermissionId')
  async updateAppGroupPermission(@Request() req, @Param() params) {
    const groupPermission = await this.groupPermissionsService.updateAppGroupPermission(
      params.id,
      params.appGroupPermissionId,
      req.body.actions
    );

    return decamelizeKeys(groupPermission);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateGroupPermission', User))
  @Put(':id')
  async update(@Request() req, @Param() params) {
    const groupPermission = await this.groupPermissionsService.update(params.id, req.body);

    return decamelizeKeys(groupPermission);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@Request() req) {
    const groupPermissions = await this.groupPermissionsService.findAll(req.user);

    return decamelizeKeys({ groupPermissions });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('createGroupPermission', User))
  @Delete(':id')
  async destroy(@Request() req, @Param() params) {
    const groupPermission = await this.groupPermissionsService.destroy(req.user, params.id);

    return decamelizeKeys(groupPermission);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/apps')
  async apps(@Request() req, @Param() params) {
    const apps = await this.groupPermissionsService.findApps(req.user, params.id);

    return decamelizeKeys({ apps });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/addable_apps')
  async addableApps(@Request() req, @Param() params) {
    const apps = await this.groupPermissionsService.findAddableApps(req.user, params.id);

    return decamelizeKeys({ apps });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/users')
  async users(@Request() req, @Param() params) {
    const users = await this.groupPermissionsService.findUsers(req.user, params.id);

    return decamelizeKeys({ users });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/addable_users')
  async addableUsers(@Request() req, @Param() params) {
    const users = await this.groupPermissionsService.findAddableUsers(req.user, params.id);

    return decamelizeKeys({ users });
  }
}
