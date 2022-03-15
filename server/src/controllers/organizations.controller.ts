import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { OrganizationsService } from '@services/organizations.service';
import { decamelizeKeys } from 'humps';
import { User } from 'src/decorators/user.decorator';
import { AppAbility } from 'src/modules/casl/casl-ability.factory';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { User as UserEntity } from 'src/entities/user.entity';
import { AuthService } from '@services/auth.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService, private authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getUsers(@Request() req) {
    const result = await this.organizationsService.fetchUsers(req.user);
    return decamelizeKeys({ users: result });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async get(@User() user) {
    const result = await this.organizationsService.fetchOrganisations(user);
    return decamelizeKeys({ organizations: result });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body('name') name, @User() user) {
    if (!name) {
      throw new BadRequestException('name can not be empty');
    }
    const result = await this.organizationsService.create(name, user);

    if (!result) {
      throw new Error();
    }
    return await this.authService.switchOrganization(result.id, user);
  }

  @Get('/:organizationId/public-configs')
  async getOrganizationDetails(@Param('organizationId') organizationId: string) {
    const result = await this.organizationsService.fetchOrganisationDetails(organizationId);
    return decamelizeKeys({ ssoConfigs: result });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateOrganizations', UserEntity))
  @Patch('/configs')
  async updateConfigs(@Request() req) {
    const result = await this.organizationsService.fetchOrganisations(req.user);
    return decamelizeKeys({ organisations: result });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateOrganizations', UserEntity))
  @Patch()
  async update(@Request() req) {
    const result = await this.organizationsService.fetchOrganisations(req.user);
    return decamelizeKeys({ organisations: result });
  }
}
