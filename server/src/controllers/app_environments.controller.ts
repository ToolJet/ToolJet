import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { ForbiddenException } from '@nestjs/common';
import { User } from 'src/decorators/user.decorator';
import { AppEnvironmentService } from '@services/app_environments.service';
import { GlobalDataSourceAbilityFactory } from 'src/modules/casl/abilities/global-datasource-ability.factory';
import { DataSource } from 'src/entities/data_source.entity';

@Controller('app-environments')
export class AppEnvironmentsController {
  constructor(
    private appEnvironmentServices: AppEnvironmentService,
    private globalDataSourcesAbilityFactory: GlobalDataSourceAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@User() user, @Query('app_id') appId: string) {
    const ability = await this.globalDataSourcesAbilityFactory.globalDataSourceActions(user);
    const { organizationId } = user;

    if (!ability.can('fetchEnvironments', DataSource)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const environments = await this.appEnvironmentServices.getAll(organizationId, null, appId);
    return decamelizeKeys({ environments });
  }
}
