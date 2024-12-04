import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { IsPublicGuard } from 'src/modules/org_environment_variables/is-public.guard';
import { User } from 'src/decorators/user.decorator';
import { OrganizationConstantsService } from '@services/organization_constants.service';
import { CreateOrganizationConstantDto, UpdateOrganizationConstantDto } from '@dto/organization-constant.dto';
import { OrganizationConstantsAbilityFactory } from 'src/modules/casl/abilities/organization-constants-ability.factory';
import { AppDecorator as App } from 'src/decorators/app.decorator';
import { OrgEnvironmentVariablesAbilityFactory } from 'src/modules/casl/abilities/org-environment-variables-ability.factory';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { OrganizationConstantType } from 'src/entities/organization_constants.entity';
import { OrganizationConstant } from 'src/entities/organization_constants.entity';
import { ORGANIZATION_CONSTANT_RESOURCE_ACTIONS } from 'src/constants/global.constant';

@Controller('organization-constants')
export class OrganizationConstantController {
  constructor(
    private organizationConstantsService: OrganizationConstantsService,
    private organizationConstantsAbilityFactory: OrganizationConstantsAbilityFactory,
    private orgEnvironmentVariablesAbilityFactory: OrgEnvironmentVariablesAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async get(@User() user, @Query('type') type: OrganizationConstantType) {
    const ability = await this.organizationConstantsAbilityFactory.organizationConstantActions(user, null);
    const decrypt =
      ability.can(ORGANIZATION_CONSTANT_RESOURCE_ACTIONS.CREATE, OrganizationConstant) ||
      ability.can(ORGANIZATION_CONSTANT_RESOURCE_ACTIONS.DELETE, OrganizationConstant);
    const result = await this.organizationConstantsService.allEnvironmentConstants(user.organizationId, decrypt, type);
    return { constants: result };
  }

  @UseGuards(JwtAuthGuard)
  @Get('secrets')
  async getAllSecrets(@User() user) {
    const result = await this.organizationConstantsService.allEnvironmentConstants(
      user.organizationId,
      false,
      OrganizationConstantType.SECRET
    );
    return { constants: result };
  }

  //by default, this api fetches only global constants (for public apps, need to fetch app to get orgId in the public guard)
  @UseGuards(IsPublicGuard)
  @Get('public/:app_slug')
  async getConstantsFromPublicApp(@App() app) {
    const result = await this.organizationConstantsService.allEnvironmentConstants(
      app.organizationId,
      false,
      OrganizationConstantType.GLOBAL
    );
    return { constants: result };
  }

  //by default, this api fetches only global constants
  @UseGuards(JwtAuthGuard)
  @Get(':app_slug')
  async getConstantsFromApp(@User() user) {
    const result = await this.organizationConstantsService.allEnvironmentConstants(
      user.organizationId,
      false,
      OrganizationConstantType.GLOBAL
    );
    return { constants: result };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/environment/:environmentId')
  async getConstantsFromEnvironment(
    @User() user,
    @Param('environmentId') environmentId,
    @Query('type') type: OrganizationConstantType
  ) {
    const result = await this.organizationConstantsService.getConstantsForEnvironment(
      user.organizationId,
      environmentId,
      type
    );
    return { constants: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@User() user, @Body() createOrganizationConstantDto: CreateOrganizationConstantDto) {
    const ability = await this.orgEnvironmentVariablesAbilityFactory.orgEnvironmentVariableActions(user, {});

    if (!ability.can('createOrgEnvironmentVariable', OrgEnvironmentVariable)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const { organizationId } = user;
    const result = await this.organizationConstantsService.create(createOrganizationConstantDto, organizationId);

    return decamelizeKeys({ constant: result });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Body() body: UpdateOrganizationConstantDto, @User() user, @Param('id') constantId) {
    const ability = await this.orgEnvironmentVariablesAbilityFactory.orgEnvironmentVariableActions(user, {});

    if (!ability.can('updateOrgEnvironmentVariable', OrgEnvironmentVariable)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const { organizationId } = user;
    const result = await this.organizationConstantsService.update(constantId, organizationId, body);

    return decamelizeKeys({ constant: result });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') constantId, @Query('environmentId') environmentId) {
    const ability = await this.orgEnvironmentVariablesAbilityFactory.orgEnvironmentVariableActions(user, {});

    if (!ability.can('deleteOrgEnvironmentVariable', OrgEnvironmentVariable)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const { organizationId } = user;

    await this.organizationConstantsService.delete(constantId, organizationId, environmentId);

    return { statusCode: 204 };
  }
}
