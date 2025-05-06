import { InitModule } from '@modules/app/decorators/init-module';
import { DataSourcesService } from './service';
import { MODULES } from '@modules/app/constants/modules';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from './ability/guard';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { User } from '@modules/app/decorators/user.decorator';
import { User as UserEntity } from '@entities/user.entity';
import {
  AuthorizeDataSourceOauthDto,
  CreateDataSourceDto,
  GetDataSourceOauthUrlDto,
  TestDataSourceDto,
  TestSampleDataSourceDto,
  UpdateDataSourceDto,
} from './dto';
import { OrganizationValidateGuard } from '@modules/app/guards/organization-validate.guard';
import { ValidateAppVersionGuard } from '@modules/versions/guards/validate-app-version.guard';
import { IDataSourcesController } from './interfaces/IController';
import { ValidateDataSourceGuard } from './guards/validate-query-source.guard';

// TODO: Create guard to get data source from id for FeatureAbilityGuard
@Controller('data-sources')
@InitModule(MODULES.GLOBAL_DATA_SOURCE)
@UseGuards(JwtAuthGuard)
export class DataSourcesController implements IDataSourcesController {
  constructor(protected readonly dataSourcesService: DataSourcesService) {}

  // Listing of all global data sources
  @InitFeature(FEATURE_KEY.GET)
  @Get(':organizationId')
  @UseGuards(OrganizationValidateGuard, FeatureAbilityGuard)
  async fetchGlobalDataSources(@User() user: UserEntity) {
    return this.dataSourcesService.getAll({}, user);
  }

  // TODO: Add guard to validate environmentId & version id
  @InitFeature(FEATURE_KEY.GET_FOR_APP)
  @UseGuards(OrganizationValidateGuard, ValidateAppVersionGuard, FeatureAbilityGuard)
  @Get(':organizationId/environments/:environmentId/versions/:versionId')
  async fetchGlobalDataSourcesForVersion(
    @User() user: UserEntity,
    @Param('versionId') appVersionId,
    @Param('environmentId') environmentId
  ) {
    return this.dataSourcesService.getForApp({ appVersionId, environmentId }, user);
  }

  @InitFeature(FEATURE_KEY.CREATE)
  @UseGuards(FeatureAbilityGuard)
  @Post()
  async createGlobalDataSources(@User() user: UserEntity, @Body() createDataSourceDto: CreateDataSourceDto) {
    return this.dataSourcesService.create(createDataSourceDto, user);
  }

  @InitFeature(FEATURE_KEY.UPDATE)
  @UseGuards(ValidateDataSourceGuard, FeatureAbilityGuard)
  @Put(':id')
  async update(
    @User() user,
    @Param('id') dataSourceId,
    @Query('environment_id') environmentId,
    @Body() updateDataSourceDto: UpdateDataSourceDto
  ) {
    await this.dataSourcesService.update(updateDataSourceDto, user, { dataSourceId, environmentId });
    return;
  }

  @InitFeature(FEATURE_KEY.DELETE)
  @UseGuards(ValidateDataSourceGuard, FeatureAbilityGuard)
  @Delete(':id')
  async delete(@User() user: UserEntity, @Param('id') dataSourceId) {
    await this.dataSourcesService.delete(dataSourceId, user);
    return;
  }

  @InitFeature(FEATURE_KEY.SCOPE_CHANGE)
  @UseGuards(ValidateDataSourceGuard, FeatureAbilityGuard)
  @Post(':id/scope')
  async changeScope(@User() user: UserEntity, @Param('id') dataSourceId) {
    await this.dataSourcesService.changeScope(dataSourceId, user);
    return;
  }

  @InitFeature(FEATURE_KEY.GET_BY_ENVIRONMENT)
  @UseGuards(ValidateDataSourceGuard, FeatureAbilityGuard)
  @Get(':id/environment/:environment_id')
  getDataSourceByEnvironment(
    @User() user: UserEntity,
    @Param('id') dataSourceId,
    @Param('environment_id') environmentId
  ) {
    return this.dataSourcesService.findOneByEnvironment(dataSourceId, user.organizationId, environmentId);
  }

  @InitFeature(FEATURE_KEY.TEST_CONNECTION)
  @UseGuards(FeatureAbilityGuard)
  @Post('sample-db/test-connection')
  testConnectionSampleDb(@User() user, @Body() testDataSourceDto: TestSampleDataSourceDto) {
    return this.dataSourcesService.testSampleDBConnection(testDataSourceDto, user);
  }

  @InitFeature(FEATURE_KEY.TEST_CONNECTION)
  @UseGuards(ValidateDataSourceGuard, FeatureAbilityGuard)
  @Post(':id/test-connection')
  testConnection(@User() user, @Body() testDataSourceDto: TestDataSourceDto) {
    return this.dataSourcesService.testConnection(testDataSourceDto, user.organizationId);
  }

  @InitFeature(FEATURE_KEY.GET_OAUTH2_BASE_URL)
  @UseGuards(FeatureAbilityGuard)
  @Get('fetch-oauth2-base-url')
  getAuthUrl(@Body() getDataSourceOauthUrlDto: GetDataSourceOauthUrlDto) {
    return this.dataSourcesService.getAuthUrl(getDataSourceOauthUrlDto);
  }

  @InitFeature(FEATURE_KEY.AUTHORIZE)
  @UseGuards(ValidateDataSourceGuard, FeatureAbilityGuard)
  @Post(':id/authorize_oauth2')
  async authorizeOauth2(
    @User() user: UserEntity,
    @Param('id') id: string,
    @Query('environment_id') environmentId,
    @Body() authorizeDataSourceOauthDto: AuthorizeDataSourceOauthDto
  ) {
    await this.dataSourcesService.authorizeOauth2(id, environmentId, authorizeDataSourceOauthDto, user);
    return;
  }

  @InitFeature(FEATURE_KEY.QUERIES_DATASOURCE_LINKED_TO_MARKETPLACE_PLUGIN)
  @UseGuards(FeatureAbilityGuard)
  @Get('dependent-queries/marketplace-plugin/:kind')
  async findDatasourcesAndQueriesOfMarketplacePlugin(@User() user: UserEntity, @Param('kind') dataSourceKind) {
    // Check for CE ( Admin ) & EE ( Super Admin )
    return await this.dataSourcesService.findDatasourcesAndQueriesOfMarketplacePlugin(user, dataSourceKind);
  }

  @InitFeature(FEATURE_KEY.QUERIES_LINKED_TO_DATASOURCE)
  @UseGuards(FeatureAbilityGuard)
  @Get('dependent-queries/:datasource_id')
  async findQueriesLinkedToDatasource(@User() user: UserEntity, @Param('datasource_id') datasourceId: string) {
    // User must have delete permission
    return await this.dataSourcesService.findQueriesLinkedToDatasource(user, datasourceId);
  }
}
