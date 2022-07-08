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
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { User } from 'src/decorators/user.decorator';
import { CreateEnvironmentVariableDto, UpdateEnvironmentVariableDto } from '@dto/environment-variable.dto';
import { OrgEnvironmentVariablesService } from '@services/org_environment_variables.service';
import { OrgEnvironmentVariablesAbilityFactory } from 'src/modules/casl/abilities/org-environment-variables-ability.factory';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';

@Controller('organization-variables')
export class OrgEnvironmentVariablesController {
  constructor(
    private orgEnvironmentVariablesService: OrgEnvironmentVariablesService,
    private orgEnvironmentVariablesAbilityFactory: OrgEnvironmentVariablesAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async get(@User() user) {
    const result = await this.orgEnvironmentVariablesService.fetchVariables(user);
    return decamelizeKeys({ variables: result });
  }

  // Endpoint for adding new env vars
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post()
  async create(@User() user, @Body() createEnvironmentVariableDto: CreateEnvironmentVariableDto) {
    const ability = await this.orgEnvironmentVariablesAbilityFactory.orgEnvironmentVariableActions(user, {});

    if (!ability.can('createOrgEnvironmentVariable', OrgEnvironmentVariable)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const result = await this.orgEnvironmentVariablesService.create(user, createEnvironmentVariableDto);
    return decamelizeKeys({ variable: result });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Patch(':id')
  async update(@Body() body: UpdateEnvironmentVariableDto, @User() user, @Param('id') variableId) {
    const ability = await this.orgEnvironmentVariablesAbilityFactory.orgEnvironmentVariableActions(user, {});

    if (!ability.can('updateOrgEnvironmentVariable', OrgEnvironmentVariable)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    await this.orgEnvironmentVariablesService.update(user.organizationId, variableId, body);
    return {};
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
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
