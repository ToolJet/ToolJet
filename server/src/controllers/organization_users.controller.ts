import { Controller, Param, Post, UseGuards, Body } from '@nestjs/common';
import { OrganizationUsersService } from 'src/services/organization_users.service';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AppAbility } from 'src/modules/casl/casl-ability.factory';
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';
import { User as UserEntity } from 'src/entities/user.entity';
import { User } from 'src/decorators/user.decorator';
import { InviteNewUserDto } from '../dto/invite-new-user.dto';
import { OrganizationsService } from '@services/organizations.service';
import { SuperAdminGuard } from 'src/modules/auth/super-admin.guard';

@Controller('organization_users')
export class OrganizationUsersController {
  constructor(
    private organizationUsersService: OrganizationUsersService,
    private organizationsService: OrganizationsService
  ) {}

  // Endpoint for inviting new organization users
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('inviteUser', UserEntity))
  @Post()
  async create(@User() user, @Body() inviteNewUserDto: InviteNewUserDto) {
    await this.organizationsService.inviteNewUser(user, inviteNewUserDto);
    return;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('archiveUser', UserEntity))
  @Post(':id/archive')
  async archive(@User() user, @Param('id') id: string, @Body() body) {
    const organizationId = body.organizationId ? body.organizationId : user.organizationId;
    await this.organizationUsersService.archive(id, organizationId);
    return;
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post(':userId/archive-all')
  async archiveAll(@Param('userId') userId: string) {
    await this.organizationUsersService.archiveFromAll(userId);
    return;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('archiveUser', UserEntity))
  @Post(':id/unarchive')
  async unarchive(@User() user, @Param('id') id: string, @Body() body) {
    const organizationId = body.organizationId ? body.organizationId : user.organizationId;
    await this.organizationUsersService.unarchive(user, id, organizationId);
    return;
  }

  // Deprecated
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('changeRole', UserEntity))
  @Post(':id/change_role')
  async changeRole(@Param('id') id, @Body('role') role) {
    const result = await this.organizationUsersService.changeRole(id, role);
    return decamelizeKeys({ result });
  }
}
