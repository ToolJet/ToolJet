import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { ForbiddenException } from '@nestjs/common';
import { User } from 'src/decorators/user.decorator';
import { AppEnvironmentService } from '@services/app_environments.service';
import { GlobalDataSourceAbilityFactory } from 'src/modules/casl/abilities/global-datasource-ability.factory';
import { DataSource } from 'src/entities/data_source.entity';
import { OrgEnvironmentVariablesAbilityFactory } from 'src/modules/casl/abilities/org-environment-variables-ability.factory';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { AppEnvironmentActionParametersDto } from '@dto/environment_action_parameters.dto';

@Controller('app-environments')
export class AppEnvironmentsController {
  constructor(
    private appEnvironmentServices: AppEnvironmentService,
    private globalDataSourcesAbilityFactory: GlobalDataSourceAbilityFactory,
    private orgEnvironmentVariablesAbilityFactory: OrgEnvironmentVariablesAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('init')
  async init(@User() user, @Query('editing_version_id') editingVersionId: string) {
    /* 
     init is a method in the AppEnvironmentService class that is used to initialize the app environment mananger. 
     Should not use for any other purpose. 
    */
    return await this.appEnvironmentServices.init(editingVersionId, user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/post-action/:action')
  async environmentActions(
    @Param('action') action: string,
    @Body() appEnvironmentActionParametersDto: AppEnvironmentActionParametersDto
  ) {
    /* 
     init is a method in the AppEnvironmentService class that is used to initialize the app environment mananger. 
     Should not use for any other purpose. 
    */
    return await this.appEnvironmentServices.processActions(action, appEnvironmentActionParametersDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@User() user, @Query('app_id') appId: string) {
    const ability = await this.globalDataSourcesAbilityFactory.globalDataSourceActions(user);
    const orgEnvironmentAbility = await this.orgEnvironmentVariablesAbilityFactory.orgEnvironmentVariableActions(
      user,
      {}
    );
    const { organizationId } = user;

    if (
      !ability.can('fetchEnvironments', DataSource) &&
      !orgEnvironmentAbility.can('fetchEnvironments', OrgEnvironmentVariable)
    ) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const environments = await this.appEnvironmentServices.getAll(organizationId, null, appId);
    return decamelizeKeys({ environments });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/versions')
  async getVersionsByEnvironment(@User() user, @Param('id') environmentId: string, @Query('app_id') appId: string) {
    const appVersions = await this.appEnvironmentServices.getVersionsByEnvironment(
      user?.organizationId,
      appId,
      environmentId
    );
    return { appVersions };
  }
}
