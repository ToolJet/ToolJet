import { Controller, Post, UseGuards, Body } from '@nestjs/common';
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

  // Endpoint for adding new env vars
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can('addOrgEnvironmentVariables', UserEntity))
  @Post()
  async create(@User() user, @Body() environmentVariableDto: EnvironmentVariableDto) {
    const result = await this.orgEnvironmentVariablesService.create(user, environmentVariableDto);
    return decamelizeKeys({ users: result });
  }
}
