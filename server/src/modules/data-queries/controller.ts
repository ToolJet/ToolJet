import { Controller, Get, Param, Body, Post, Patch, Delete, UseGuards, Put, Res } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { DataQueriesService } from './service';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import { DataSource, DataSourceEntity } from '@modules/app/decorators/data-source.decorator';
import { App } from 'src/entities/app.entity';
import { Response } from 'express';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { CreateDataQueryDto, UpdateDataQueryDto, UpdateSourceDto, UpdatingReferencesOptionsDto } from './dto';
import { ValidateQueryAppGuard } from './guards/validate-query-app.guard';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard as AppFeatureAbilityGuard } from './ability/app/guard';
import { FeatureAbilityGuard as DataSourceFeatureAbilityGuard } from './ability/data-source/guard';
import { ValidateQuerySourceGuard } from './guards/validate-query-source.guard';
import { ValidateAppVersionGuard } from '@modules/versions/guards/validate-app-version.guard';
import { AbilityDecorator as Ability } from '@modules/app/decorators/ability.decorator';
import { AppAbility } from '@modules/casl/casl-ability.factory';
import { AppDecorator } from '@modules/app/decorators/app.decorator';
import { DataQuery } from '@entities/data_query.entity';
import { IDataQueriesController } from './interfaces/IController';
@Controller('data-queries')
@InitModule(MODULES.DATA_QUERY)
export class DataQueriesController implements IDataQueriesController {
  constructor(protected dataQueriesService: DataQueriesService) {}

  @InitFeature(FEATURE_KEY.GET)
  @UseGuards(
    JwtAuthGuard,
    ValidateAppVersionGuard,
    ValidateQueryAppGuard,
    AppFeatureAbilityGuard,
    ValidateQuerySourceGuard,
    DataSourceFeatureAbilityGuard
  )
  @Get(':versionId')
  index(@Param('versionId') versionId: string) {
    return this.dataQueriesService.getAll(versionId);
  }

  @InitFeature(FEATURE_KEY.CREATE)
  @UseGuards(
    JwtAuthGuard,
    ValidateAppVersionGuard,
    ValidateQueryAppGuard,
    AppFeatureAbilityGuard,
    ValidateQuerySourceGuard,
    DataSourceFeatureAbilityGuard
  )
  @Post('/data-sources/:dataSourceId/versions/:versionId')
  create(
    @User() user: UserEntity,
    @DataSource() dataSource: DataSourceEntity,
    @Param('versionId') versionId: string,
    @Body() dataQueryDto: CreateDataQueryDto
  ): Promise<object> {
    dataQueryDto.app_version_id = versionId;
    return this.dataQueriesService.create(user, dataSource, dataQueryDto);
  }

  @InitFeature(FEATURE_KEY.UPDATE_ONE)
  @UseGuards(
    JwtAuthGuard,
    ValidateQueryAppGuard,
    AppFeatureAbilityGuard,
    ValidateQuerySourceGuard,
    DataSourceFeatureAbilityGuard
  )
  @Patch(':id/versions/:versionId')
  async updateDataQuery(
    @User() user: UserEntity,
    @AppDecorator() app: App,
    @Param('id') dataQueryId,
    @Param('versionId') versionId,
    @Body() updateDataQueryDto: UpdateDataQueryDto
  ) {
    await this.dataQueriesService.update(user, versionId, dataQueryId, updateDataQueryDto);
    return;
  }

  @InitFeature(FEATURE_KEY.UPDATE)
  //* On Updating references, need update the options of multiple queries
  @UseGuards(JwtAuthGuard, ValidateAppVersionGuard, ValidateQueryAppGuard, AppFeatureAbilityGuard)
  @Patch('versions/:versionId')
  async bulkUpdate(@User() user: UserEntity, @Body() updatingReferencesOptions: UpdatingReferencesOptionsDto) {
    return await this.dataQueriesService.bulkUpdateQueryOptions(user, updatingReferencesOptions.data_queries_options);
  }

  @InitFeature(FEATURE_KEY.DELETE)
  @UseGuards(
    JwtAuthGuard,
    ValidateQueryAppGuard,
    AppFeatureAbilityGuard,
    ValidateQuerySourceGuard,
    DataSourceFeatureAbilityGuard
  )
  @Delete(':id/versions/:versionId')
  async delete(@Param('id') dataQueryId) {
    await this.dataQueriesService.delete(dataQueryId);
    return;
  }

  @InitFeature(FEATURE_KEY.RUN_EDITOR)
  @UseGuards(
    JwtAuthGuard,
    ValidateQueryAppGuard,
    AppFeatureAbilityGuard,
    ValidateQuerySourceGuard,
    DataSourceFeatureAbilityGuard
  )
  @Post(':id/versions/:versionId/run/:environmentId')
  runQueryOnBuilder(
    @User() user: UserEntity,
    @AppDecorator() app: App,
    @Param('id') dataQueryId,
    @Param('environmentId') environmentId,
    @Body() updateDataQueryDto: UpdateDataQueryDto,
    @Ability() ability: AppAbility,
    @DataSource() dataSource: DataSourceEntity,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.dataQueriesService.runQueryOnBuilder(
      user,
      dataQueryId,
      environmentId,
      updateDataQueryDto,
      ability,
      dataSource,
      response
    );
  }

  @InitFeature(FEATURE_KEY.RUN_VIEWER)
  @UseGuards(
    JwtAuthGuard,
    ValidateQueryAppGuard,
    AppFeatureAbilityGuard,
    ValidateQuerySourceGuard,
    DataSourceFeatureAbilityGuard
  )
  @Post(':id/run')
  async runQuery(
    @User() user: UserEntity,
    @AppDecorator() app: App,
    @Param('id') dataQueryId,
    @Body() updateDataQueryDto: UpdateDataQueryDto,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.dataQueriesService.runQueryForApp(user, dataQueryId, updateDataQueryDto, response);
  }

  @InitFeature(FEATURE_KEY.PREVIEW)
  @UseGuards(
    JwtAuthGuard,
    ValidateQueryAppGuard,
    AppFeatureAbilityGuard,
    ValidateQuerySourceGuard,
    DataSourceFeatureAbilityGuard
  )
  @Post(':id/versions/:versionId/preview/:environmentId')
  async previewQuery(
    @User() user: UserEntity,
    @AppDecorator() app: App,
    @DataSource() dataSource: DataSourceEntity,
    @Body() updateDataQueryDto: UpdateDataQueryDto,
    @Param('environmentId') environmentId,
    @Res({ passthrough: true }) response: Response
  ) {
    const dataQuery: DataQuery = dataSource.dataQueries[0];
    const { options, query } = updateDataQueryDto;
    const dataQueryEntity = Object.assign(new DataQuery(), {
      ...dataQuery,
      ...query,
      dataSource,
      app,
    });

    return this.dataQueriesService.preview(user, dataQueryEntity, environmentId, options, response);
  }

  @InitFeature(FEATURE_KEY.UPDATE_DATA_SOURCE)
  @UseGuards(
    JwtAuthGuard,
    ValidateQueryAppGuard,
    AppFeatureAbilityGuard,
    ValidateQuerySourceGuard,
    DataSourceFeatureAbilityGuard
  )
  @Put(':id/versions/:versionId/data-source')
  async changeQueryDataSource(
    @User() user: UserEntity,
    @DataSource() dataSource: DataSourceEntity,
    @Param('id') queryId,
    @Body() updateDataQueryDto: UpdateSourceDto
  ) {
    await this.dataQueriesService.changeQueryDataSource(user, queryId, dataSource, updateDataQueryDto.data_source_id);
    return;
  }
}
