import { Controller, Get, UseGuards, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { ForbiddenException } from '@nestjs/common';
import { User } from 'src/decorators/user.decorator';
import { AppEnvironmentService } from '@services/app_environments.service';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { App } from 'src/entities/app.entity';
import { CreateAppEnvironmentDto, UpdateAppEnvironmentDto } from '@dto/app_environment.dto';

@Controller('app-environments')
export class AppEnvironmentsController {
  constructor(private appEnvironmentServices: AppEnvironmentService, private appsAbilityFactory: AppsAbilityFactory) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@User() user, @Query('app_id') appId: string) {
    const { organizationId } = user;
    // TODO: add fetchEnvironments privilege
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
    return decamelizeKeys({ appVersions });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':versionId')
  async create(
    @User() user,
    @Param('versionId') versionId: string,
    @Body() createAppEnvironmentDto: CreateAppEnvironmentDto
  ) {
    const version = await this.appEnvironmentServices.getVersion(versionId);
    const ability = await this.appsAbilityFactory.appsActions(user, version.appId);
    const { organizationId } = user;

    if (!ability.can('createEnvironments', App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const env = await this.appEnvironmentServices.create(organizationId, createAppEnvironmentDto.name, false, 1);
    return decamelizeKeys(env);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':versionId/:id')
  async update(
    @User() user,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() updateAppEnvironmentDto: UpdateAppEnvironmentDto
  ) {
    const version = await await this.appEnvironmentServices.getVersion(versionId);
    const ability = await this.appsAbilityFactory.appsActions(user, version.appId);
    const { organizationId } = user;

    if (!ability.can('updateEnvironments', App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const result = await this.appEnvironmentServices.update(id, updateAppEnvironmentDto.name, organizationId);
    return decamelizeKeys(result);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':versionId/:id')
  async delete(@User() user, @Param('id') id: string, @Param('versionId') versionId: string) {
    const version = await await this.appEnvironmentServices.getVersion(versionId);
    const ability = await this.appsAbilityFactory.appsActions(user, version.appId);
    const { organizationId } = user;

    if (!ability.can('deleteEnvironments', App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return await this.appEnvironmentServices.delete(id, organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('versions')
  async getVersions(@User() user, @Query('app_id') appId: string) {
    const appVersions = await this.appEnvironmentServices.getVersionsByEnvironment(user?.organizationId, appId);
    return decamelizeKeys({ appVersions });
  }
}
