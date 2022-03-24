import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { OrganizationUsersService } from 'src/services/organization_users.service';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AppAbility } from 'src/modules/casl/casl-ability.factory';
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';
import { User as UserEntity } from 'src/entities/user.entity';
import { User } from 'src/decorators/user.decorator';

@Controller('organization_users')
export class OrganizationUsersController {
  constructor(private organizationUsersService: OrganizationUsersService) {}

  // Endpoint for inviting new organization users
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('inviteUser', UserEntity))
  @Post()
  async create(@User() user, @Body() body) {
    const result = await this.organizationUsersService.inviteNewUser(user, body);
    return decamelizeKeys({ users: result });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('archiveUser', UserEntity))
  @Post(':id/archive')
  async archive(@Param('id') id: string) {
    const result = await this.organizationUsersService.archive(id);
    return decamelizeKeys({ result });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('archiveUser', UserEntity))
  @Post(':id/unarchive')
  async unarchive(@User() user, @Param('id') id: string) {
    const result = await this.organizationUsersService.unarchive(user, id);
    return decamelizeKeys({ result });
  }

  // Depricated
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('changeRole', UserEntity))
  @Post(':id/change_role')
  async changeRole(@Request() req, @Param() params) {
    const result = await this.organizationUsersService.changeRole(req.user, params.id, req.body.role);
    return decamelizeKeys({ result });
  }
}
