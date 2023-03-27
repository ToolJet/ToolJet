import {
  Controller,
  Get,
  Param,
  Body,
  Post,
  Patch,
  Delete,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { decamelizeKeys } from 'humps';
import { DataQueriesService } from '../../src/services/data_queries.service';
import { DataSourcesService } from '../../src/services/data_sources.service';
import { QueryAuthGuard } from 'src/modules/auth/query-auth.guard';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { AppsService } from '@services/apps.service';
import { CreateDataQueryDto, UpdateDataQueryDto } from '@dto/data-query.dto';
import { User } from 'src/decorators/user.decorator';
import { decode } from 'js-base64';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager } from 'typeorm';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourceScopes, DataSourceTypes } from 'src/helpers/data_source.constants';
import { App } from 'src/entities/app.entity';

@Controller('data_queries')
export class DataQueriesController {
  constructor(
    private appsService: AppsService,
    private dataQueriesService: DataQueriesService,
    private dataSourcesService: DataSourcesService,
    private appsAbilityFactory: AppsAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@User() user, @Query() query) {
    const app = await this.appsService.findAppFromVersion(query.app_version_id);
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('getQueries', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const queries = await this.dataQueriesService.all(query);
    const seralizedQueries = [];

    // serialize
    for (const query of queries) {
      if (query.dataSource.type === DataSourceTypes.STATIC) {
        delete query['dataSourceId'];
      }
      delete query['dataSource'];

      const decamelizedQuery = decamelizeKeys(query);

      decamelizedQuery['options'] = query.options;

      if (query.plugin) {
        decamelizedQuery['plugin'].manifest_file.data = JSON.parse(
          decode(query.plugin.manifestFile.data.toString('utf8'))
        );
        decamelizedQuery['plugin'].icon_file.data = query.plugin.iconFile.data.toString('utf8');
      }

      seralizedQueries.push(decamelizedQuery);
    }

    const response = { data_queries: seralizedQueries };

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@User() user, @Body() dataQueryDto: CreateDataQueryDto): Promise<object> {
    const {
      kind,
      name,
      options,
      data_source_id: dataSourceId,
      plugin_id: pluginId,
      app_version_id: appVersionId,
    } = dataQueryDto;

    let dataSource: DataSource;
    let app: App;

    if (!dataSourceId && !(kind === 'restapi' || kind === 'runjs' || kind === 'tooljetdb' || kind === 'runpy')) {
      throw new BadRequestException();
    }

    return dbTransactionWrap(async (manager: EntityManager) => {
      if (!dataSourceId && (kind === 'restapi' || kind === 'runjs' || kind === 'tooljetdb' || kind === 'runpy')) {
        dataSource = await this.dataSourcesService.findDefaultDataSource(
          kind,
          appVersionId,
          pluginId,
          user.organizationId,
          manager
        );
      }
      dataSource = await this.dataSourcesService.findOne(dataSource?.id || dataSourceId, manager);

      if (dataSource.scope === DataSourceScopes.GLOBAL) {
        app = await this.appsService.findAppFromVersion(appVersionId);
      } else {
        app = await this.dataSourcesService.findApp(dataSource?.id || dataSourceId, manager);
      }

      const ability = await this.appsAbilityFactory.appsActions(user, app.id);

      if (!ability.can('createQuery', app)) {
        throw new ForbiddenException('you do not have permissions to perform this action');
      }

      // todo: pass the whole dto instead of indv. values
      const dataQuery = await this.dataQueriesService.create(
        name,
        options,
        dataSource?.id || dataSourceId,
        appVersionId,
        manager
      );
      return decamelizeKeys(dataQuery);
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@User() user, @Param('id') dataQueryId, @Body() updateDataQueryDto: UpdateDataQueryDto) {
    const { name, options } = updateDataQueryDto;

    const dataQuery = await this.dataQueriesService.findOne(dataQueryId);
    const ability = await this.appsAbilityFactory.appsActions(user, dataQuery.app.id);

    if (!ability.can('updateQuery', dataQuery.app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const result = await this.dataQueriesService.update(dataQueryId, name, options);
    return decamelizeKeys(result);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') dataQueryId) {
    const dataQuery = await this.dataQueriesService.findOne(dataQueryId);
    const ability = await this.appsAbilityFactory.appsActions(user, dataQuery.app.id);

    if (!ability.can('deleteQuery', dataQuery.app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const result = await this.dataQueriesService.delete(dataQueryId);
    return decamelizeKeys(result);
  }

  @UseGuards(QueryAuthGuard)
  @Post([':id/run/:environmentId', ':id/run'])
  async runQuery(
    @User() user,
    @Param('id') dataQueryId,
    @Param('environmentId') environmentId,
    @Body() updateDataQueryDto: UpdateDataQueryDto
  ) {
    const { options } = updateDataQueryDto;

    const dataQuery = await this.dataQueriesService.findOne(dataQueryId);

    if (user) {
      const ability = await this.appsAbilityFactory.appsActions(user, dataQuery.app.id);

      if (!ability.can('runQuery', dataQuery.app)) {
        throw new ForbiddenException('you do not have permissions to perform this action');
      }
    }

    let result = {};

    try {
      result = await this.dataQueriesService.runQuery(user, dataQuery, options, environmentId);
    } catch (error) {
      if (error.constructor.name === 'QueryError') {
        result = {
          status: 'failed',
          message: error.message,
          description: error.description,
          data: error.data,
        };
      } else {
        console.log(error);
        result = {
          status: 'failed',
          message: 'Internal server error',
          description: error.message,
          data: {},
        };
      }
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post(['/preview/:environmentId', '/preview'])
  async previewQuery(
    @User() user,
    @Body() updateDataQueryDto: UpdateDataQueryDto,
    @Param('environmentId') environmentId
  ) {
    const { options, query, app_version_id: appVersionId } = updateDataQueryDto;

    const app = await this.appsService.findAppFromVersion(appVersionId);

    if (!(query['data_source_id'] || appVersionId || environmentId)) {
      throw new BadRequestException('Data source id or app version id or environment id is mandatory');
    }

    const kind = query ? query['kind'] : null;
    const dataQueryEntity = {
      ...query,
      app,
      dataSource: query['data_source_id']
        ? await this.dataSourcesService.findOne(query['data_source_id'])
        : await this.dataSourcesService.findDefaultDataSourceByKind(kind, appVersionId),
    };

    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('previewQuery', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    let result = {};

    try {
      result = await this.dataQueriesService.runQuery(user, dataQueryEntity, options, environmentId);
    } catch (error) {
      if (error.constructor.name === 'QueryError') {
        result = {
          status: 'failed',
          message: error.message,
          description: error.description,
          data: error.data,
        };
      } else {
        console.log(error);
        result = {
          status: 'failed',
          message: 'Internal server error',
          description: error.message,
          data: {},
        };
      }
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/data_source')
  async changeQueryDataSource(@User() user, @Param('id') queryId, @Body() updateDataQueryDto: UpdateDataQueryDto) {
    const { data_source_id: dataSourceId } = updateDataQueryDto;

    const dataQuery = await this.dataQueriesService.findOne(queryId);
    const ability = await this.appsAbilityFactory.appsActions(user, dataQuery.app.id);

    if (!ability.can('updateQuery', dataQuery.app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }
    await this.dataQueriesService.changeQueryDataSource(queryId, dataSourceId);
    return;
  }
}
