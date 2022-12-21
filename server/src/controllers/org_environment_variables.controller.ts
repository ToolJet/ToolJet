import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { CreateEnvironmentVariableDto, UpdateEnvironmentVariableDto } from '@dto/environment-variable.dto';
import { OrgEnvironmentVariablesService } from '@services/org_environment_variables.service';
import { OrgEnvironmentVariablesAbilityFactory } from 'src/modules/casl/abilities/org-environment-variables-ability.factory';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { IsPublicGuard } from 'src/modules/org_environment_variables/is-public.guard';
import { AppDecorator as App } from 'src/decorators/app.decorator';

@Controller('organization-variables')
export class OrgEnvironmentVariablesController {
  constructor(
    private orgEnvironmentVariablesService: OrgEnvironmentVariablesService,
    private orgEnvironmentVariablesAbilityFactory: OrgEnvironmentVariablesAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async get(@User() user) {
    const result = await this.orgEnvironmentVariablesService.fetchVariables(user.organizationId);
    return decamelizeKeys({ variables: result });
  }

  @UseGuards(IsPublicGuard)
  @Get(':app_slug')
  async getVariablesFromApp(@App() app) {
    const result = await this.orgEnvironmentVariablesService.fetchVariables(app.organizationId);
    return decamelizeKeys({ variables: result });
  }

  // Endpoint for adding new env vars
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@User() user, @Body() createEnvironmentVariableDto: CreateEnvironmentVariableDto) {
    const ability = await this.orgEnvironmentVariablesAbilityFactory.orgEnvironmentVariableActions(user, {});

    if (!ability.can('createOrgEnvironmentVariable', OrgEnvironmentVariable)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const result = await this.orgEnvironmentVariablesService.create(user, createEnvironmentVariableDto);
    return decamelizeKeys({ variable: result });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Body() body: UpdateEnvironmentVariableDto, @User() user, @Param('id') variableId) {
    const ability = await this.orgEnvironmentVariablesAbilityFactory.orgEnvironmentVariableActions(user, {});

    if (!ability.can('updateOrgEnvironmentVariable', OrgEnvironmentVariable)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    await this.orgEnvironmentVariablesService.update(user.organizationId, variableId, body);
    return {};
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') variableId) {
    const ability = await this.orgEnvironmentVariablesAbilityFactory.orgEnvironmentVariableActions(user, {});

    if (!ability.can('deleteOrgEnvironmentVariable', OrgEnvironmentVariable)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const result = await this.orgEnvironmentVariablesService.delete(user.organizationId, variableId);
    if (result.affected == 1) {
      return;
    } else {
      throw new BadRequestException();
    }
  }
}
