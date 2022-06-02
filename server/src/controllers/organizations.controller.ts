import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from '@services/organizations.service';
import { decamelizeKeys } from 'humps';
import { User } from 'src/decorators/user.decorator';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AuthService } from '@services/auth.service';
import { AppAbility } from 'src/modules/casl/casl-ability.factory';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { User as UserEntity } from 'src/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { MultiOrganizationGuard } from 'src/modules/auth/multi-organization.guard';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private organizationsService: OrganizationsService,
    private authService: AuthService,
    private readonly configService: ConfigService
  ) {}

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

  @UseGuards(JwtAuthGuard, MultiOrganizationGuard)
  @Post()
  async create(@Body('name') name, @User() user) {
    if (!name) {
      throw new BadRequestException('name can not be empty');
    }
    const result = await this.organizationsService.create(name, user);

    if (!result) {
      throw new Error();
    }
    return await this.authService.switchOrganization(result.id, user, true);
  }

  @Get(['/:organizationId/public-configs', '/public-configs'])
  async getOrganizationDetails(@Param('organizationId') organizationId: string) {
    if (!organizationId && this.configService.get<string>('DISABLE_MULTI_WORKSPACE') === 'true') {
      // Request from single organization login page - find one from organization and setting
      organizationId = (await this.organizationsService.getSingleOrganization())?.id;
    }
    if (!organizationId) {
      throw new NotFoundException();
    }

    const result = await this.organizationsService.fetchOrganisationDetails(organizationId, [true], true);
    return decamelizeKeys({ ssoConfigs: result });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateOrganizations', UserEntity))
  @Get('/configs')
  async getConfigs(@User() user) {
    const result = await this.organizationsService.fetchOrganisationDetails(user.organizationId);
    return decamelizeKeys({ organizationDetails: result });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateOrganizations', UserEntity))
  @Patch()
  async update(@Body() body, @User() user) {
    await this.organizationsService.updateOrganization(user.organizationId, body);
    return {};
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateOrganizations', UserEntity))
  @Patch('/configs')
  async updateConfigs(@Body() body, @User() user) {
    const result: any = await this.organizationsService.updateOrganizationConfigs(user.organizationId, body);
    return decamelizeKeys({ id: result.id });
  }
}
