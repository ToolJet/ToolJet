import { Controller, Get, UseGuards, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import { AppEnvironmentService } from '@modules/app-environments/service';
import { CreateAppEnvironmentDto, UpdateAppEnvironmentDto } from '@modules/app-environments/dto';
import { IAppEnvironmentsController } from './interfaces/IController';
import { AppEnvironmentActionParametersDto } from '@modules/app-environments/dto';
import { NotFoundException } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FeatureAbilityGuard } from './ability/guard';
import { FEATURE_KEY } from './constants';
import { MODULES } from '@modules/app/constants/modules';
import { PublicAppEnvironmentGuard } from './guards/public_app_environment.guard';

@Controller('app-environments')
@InitModule(MODULES.APP_ENVIRONMENTS)
export class AppEnvironmentsController implements IAppEnvironmentsController {
  constructor(protected appEnvironmentServices: AppEnvironmentService) {}

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.INIT)
  @Get('init')
  async init(@User() user, @Query('editing_version_id') editingVersionId: string) {
    /* 
     init is a method in the AppEnvironmentService class that is used to initialize the app environment mananger. 
     Should not use for any other purpose. 
    */
    return await this.appEnvironmentServices.init(editingVersionId, user.organizationId);
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.POST_ACTION)
  @Post('/post-action/:action')
  async environmentActions(
    @User() user,
    @Param('action') action: string,
    @Body() appEnvironmentActionParametersDto: AppEnvironmentActionParametersDto
  ) {
    return await this.appEnvironmentServices.processActions(null, action, appEnvironmentActionParametersDto);
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.GET_ALL)
  @Get()
  async index(@User() user: UserEntity, @Query('app_id') appId: string) {
    const environments = await this.appEnvironmentServices.getAll(user.organizationId, appId);
    return decamelizeKeys({ environments });
  }

  @UseGuards(PublicAppEnvironmentGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.GET_DEFAULT)
  @Get('default')
  async getDefaultEnvironment(@User() user, @Req() req) {
    const organizationId = user?.organizationId ?? req.headers['tj-workspace-id'];
    const environment = await this.appEnvironmentServices.get(organizationId, null, false);
    return decamelizeKeys({ environment });
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.GET_VERSIONS_BY_ENVIRONMENT)
  @Get(':id/versions')
  async getVersionsByEnvironment(@User() user, @Param('id') environmentId: string, @Query('app_id') appId: string) {
    const appVersions = await this.appEnvironmentServices.getVersionsByEnvironment(
      user?.organizationId,
      appId,
      environmentId
    );
    return { appVersions };
  }

  @Post(':versionId')
  @InitFeature(FEATURE_KEY.CREATE)
  async create(
    @User() user,
    @Param('versionId') versionId: string,
    @Body() createAppEnvironmentDto: CreateAppEnvironmentDto
  ): Promise<any> {
    throw new NotFoundException();
  }

  @Put(':versionId/:id')
  @InitFeature(FEATURE_KEY.UPDATE)
  async update(
    @User() user,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() updateAppEnvironmentDto: UpdateAppEnvironmentDto
  ): Promise<any> {
    throw new NotFoundException();
  }

  @Delete(':versionId/:id')
  @InitFeature(FEATURE_KEY.DELETE)
  async delete(@User() user, @Param('id') id: string, @Param('versionId') versionId: string): Promise<any> {
    throw new NotFoundException();
  }

  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @InitFeature(FEATURE_KEY.GET_BY_ID)
  @Get('/:id')
  async getEnvironmentById(@User() user, @Param('id') id: string) {
    const { organizationId } = user;
    const environment = await this.appEnvironmentServices.get(organizationId, id);
    return decamelizeKeys({ environment });
  }
}
