import { Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { OrganizationUsersService } from 'src/services/organization_users.service';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AppAbility, CaslAbilityFactory } from 'src/modules/casl/casl-ability.factory';
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';
import { User } from 'src/entities/user.entity';

@Controller('organization_users')
export class OrganizationUsersController {
  constructor(
    private organizationUsersService: OrganizationUsersService,
    private caslAbilityFactory: CaslAbilityFactory
  ) { }

  // Endpoint for inviting new organization users
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Param() params) {
    const result = await this.organizationUsersService.inviteNewUser(req.user, req.body);
    return decamelizeKeys({ users: result });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/archive')
  async archive(@Request() req, @Param() params) {
    const result = await this.organizationUsersService.archive(params.id);
    return decamelizeKeys({ result });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('changeRole', User))
  @Post(':id/change_role')
  async changeRole(@Request() req, @Param() params) {
    const result = await this.organizationUsersService.changeRole(req.user, params.id, req.body.role);
    return decamelizeKeys({ result });
  }

}
