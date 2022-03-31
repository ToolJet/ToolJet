import { Controller, Param, Post, Request, UseGuards, Body } from '@nestjs/common';
import { OrganizationUsersService } from 'src/services/organization_users.service';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AppAbility } from 'src/modules/casl/casl-ability.factory';
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';
import { InviteNewUserDto } from '../dto/invite-new-user.dto';
import { User } from 'src/entities/user.entity';

@Controller('organization_users')
export class OrganizationUsersController {
  constructor(private organizationUsersService: OrganizationUsersService) {}

  // Endpoint for inviting new organization users
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('inviteUser', User))
  @Post()
  async create(@Request() req, @Body() inviteNewUserDto: InviteNewUserDto) {
    const result = await this.organizationUsersService.inviteNewUser(req.user, inviteNewUserDto);
    return decamelizeKeys({ users: result });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('archiveUser', User))
  @Post(':id/archive')
  async archive(@Request() req, @Param() params) {
    const result = await this.organizationUsersService.archive(params.id);
    return decamelizeKeys({ result });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('archiveUser', User))
  @Post(':id/unarchive')
  async unarchive(@Request() req, @Param() params) {
    const result = await this.organizationUsersService.unarchive(req.user, params.id);
    return decamelizeKeys({ result });
  }

  // Deprecated
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('changeRole', User))
  @Post(':id/change_role')
  async changeRole(@Request() req, @Param() params) {
    const result = await this.organizationUsersService.changeRole(req.user, params.id, req.body.role);
    return decamelizeKeys({ result });
  }
}
