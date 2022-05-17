import { Controller, Post, UseGuards, Body, Get, Patch, Delete, Param, BadRequestException } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { AppAbility } from 'src/modules/casl/casl-ability.factory';
import { PoliciesGuard } from 'src/modules/casl/policies.guard';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';
import { User as UserEntity } from 'src/entities/user.entity';
import { User } from 'src/decorators/user.decorator';
import { EnvironmentVariableDto } from '@dto/environment-variable.dto';
import { OrgEnvironmentVariablesService } from '@services/org_environment_variables.service';

@Controller('organization_variables')
export class OrgEnvironmentVariablesController {
  constructor(private orgEnvironmentVariablesService: OrgEnvironmentVariablesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async get(@User() user) {
    const result = await this.orgEnvironmentVariablesService.fetchVariables(user);
    return decamelizeKeys({ variables: result });
  }

  // Endpoint for adding new env vars
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('addOrgEnvironmentVariables', UserEntity))
  @Post()
  async create(@User() user, @Body() environmentVariableDto: EnvironmentVariableDto) {
    const result = await this.orgEnvironmentVariablesService.create(user, environmentVariableDto);
    return decamelizeKeys({ variable: result });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('updateOrgEnvironmentVariables', UserEntity))
  @Patch(':id')
  async update(@Body() body, @User() user, @Param('id') variableId) {
    await this.orgEnvironmentVariablesService.update(user.organizationId, variableId, body);
    return {};
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('deleteOrgEnvironmentVariables', UserEntity))
  @Delete(':id')
  async delete(@User() user, @Param('id') variableId) {
    const result = await this.orgEnvironmentVariablesService.delete(user.organizationId, variableId);
    if (result.affected == 1) {
      return;
    } else {
      throw new BadRequestException();
    }
  }
}
