import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
  Res,
  NotAcceptableException,
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
import { OIDCGuard } from '@ee/licensing/guards/oidc.guard';
import { AllowPersonalWorkspaceGuard } from 'src/modules/instance_settings/personal-workspace.guard';
import { OrganizationCreateDto, OrganizationUpdateDto } from '@dto/organization.dto';
import { Response } from 'express';
import { LicenseExpiryGuard } from '@ee/licensing/guards/expiry.guard';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private organizationsService: OrganizationsService,
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('limits')
  async getOrganizationsLimit() {
    return await this.organizationsService.organizationsLimit();
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('viewAllUsers', UserEntity))
  @Get('users')
  async getUsers(@User() user, @Query() query) {
    const { page, searchText, status } = query;
    const filterOptions = {
      ...(searchText && { searchText }),
      ...(status && { status }),
    };
    const usersCount = await this.organizationsService.usersCount(user, filterOptions);
    let users = [];
    if (usersCount > 0) users = await this.organizationsService.fetchUsers(user, page, filterOptions);

    const meta = {
      total_pages: Math.ceil(usersCount / 10),
      total_count: usersCount,
      current_page: parseInt(page || 1),
    };

    const response = {
      meta,
      users,
    };

    return decamelizeKeys(response);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/suggest')
  async getUserSuggestions(@User() user, @Query('input') searchInput) {
    const users = await this.organizationsService.fetchUsersByValue(user, searchInput);
    const response = {
      users,
    };

    return decamelizeKeys(response);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async get(@User() user) {
    const result = await this.organizationsService.fetchOrganizations(user);
    return decamelizeKeys({ organizations: result });
  }

  @UseGuards(JwtAuthGuard, AllowPersonalWorkspaceGuard)
  @Post()
  async create(
    @User() user,
    @Body() organizationCreateDto: OrganizationCreateDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.organizationsService.create(organizationCreateDto.name, user);

    if (!result) {
      throw new Error();
    }
    return await this.authService.switchOrganization(response, result.id, user, true);
  }

  @Get(['/:organizationId/public-configs', '/public-configs'])
  async getOrganizationDetails(@Param('organizationId') organizationId: string) {
    const existingOrganizationId = (await this.organizationsService.getSingleOrganization())?.id;
    if (!existingOrganizationId) {
      throw new NotFoundException();
    }
    if (!organizationId) {
      const result = await this.organizationsService.constructSSOConfigs();
      return decamelizeKeys({ ssoConfigs: result });
    }

    const result = await this.organizationsService.fetchOrganizationDetails(organizationId, [true], true, true);
    return decamelizeKeys({ ssoConfigs: result });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateOrganizations', UserEntity))
  @Get('/configs')
  async getConfigs(@User() user) {
    const result = await this.organizationsService.fetchOrganizationDetails(user.organizationId);
    return decamelizeKeys({
      organizationDetails: result,
      instanceConfigs: await this.organizationsService.constructSSOConfigs(),
    });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateOrganizations', UserEntity))
  @Patch()
  async update(@Body() organizationUpdateDto: OrganizationUpdateDto, @User() user) {
    await this.organizationsService.updateOrganization(user.organizationId, organizationUpdateDto);
    return;
  }

  @UseGuards(JwtAuthGuard, AllowPersonalWorkspaceGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateOrganizations', UserEntity))
  @Patch('/name')
  async updateName(@Body('name') name, @User() user) {
    if (!name?.trim()) {
      throw new NotAcceptableException('Workspace name can not be empty');
    }
    await this.organizationsService.updateOrganization(user.organizationId, { name });
    return {};
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateOrganizations', UserEntity))
  @Patch('/configs')
  async updateConfigs(@Body() body, @User() user) {
    const result: any = await this.organizationsService.updateOrganizationConfigs(user.organizationId, body);
    return decamelizeKeys({ id: result.id });
  }

  @UseGuards(JwtAuthGuard, LicenseExpiryGuard, OIDCGuard)
  @Get('license-terms/oidc')
  async getOIDC() {
    return;
  }
}
