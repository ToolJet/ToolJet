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
    const app = await this.appsService.find(query.app_id);
    const ability = await this.appsAbilityFactory.appsActions(user, query.app_id);

    if (!ability.can('getQueries', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const queries = await this.dataQueriesService.all(user, query);
    const seralizedQueries = [];

    // serialize
    for (const query of queries) {
      const decamelizedQuery = decamelizeKeys(query);

      decamelizedQuery['options'] = query.options;
      seralizedQueries.push(decamelizedQuery);
    }

    const response = { data_queries: seralizedQueries };

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@User() user, @Body() dataQueryDto: CreateDataQueryDto): Promise<object> {
    const { kind, name, options, app_id, app_version_id, data_source_id } = dataQueryDto;
    const appId = app_id;
    const appVersionId = app_version_id;
    const dataSourceId = data_source_id;

    const app = await this.appsService.find(appId);
    const ability = await this.appsAbilityFactory.appsActions(user, appId);

    if (!ability.can('createQuery', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    // Make sure that the data source belongs ot the app
    if (dataSourceId) {
      const dataSource = await this.dataSourcesService.findOne(dataSourceId);
      if (dataSource.appId !== appId) {
        throw new ForbiddenException('you do not have permissions to perform this action');
      }
    }

    const dataQuery = await this.dataQueriesService.create(
      user,
      name,
      kind,
      options,
      appId,
      dataSourceId,
      appVersionId
    );
    return decamelizeKeys(dataQuery);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@User() user, @Param() params, @Body() updateDataQueryDto: UpdateDataQueryDto) {
    const { name, options } = updateDataQueryDto;
    const dataQueryId = params.id;

    const dataQuery = await this.dataQueriesService.findOne(dataQueryId);
    const ability = await this.appsAbilityFactory.appsActions(user, dataQuery.appId);

    if (!ability.can('updateQuery', dataQuery.app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const result = await this.dataQueriesService.update(user, dataQueryId, name, options);
    return decamelizeKeys(result);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@User() user, @Param() params) {
    const dataQueryId = params.id;

    const dataQuery = await this.dataQueriesService.findOne(dataQueryId);
    const ability = await this.appsAbilityFactory.appsActions(user, dataQuery.appId);

    if (!ability.can('deleteQuery', dataQuery.app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const result = await this.dataQueriesService.delete(params.id);
    return decamelizeKeys(result);
  }

  @UseGuards(QueryAuthGuard)
  @Post(':id/run')
  async runQuery(@User() user, @Param('id') dataQueryId, @Body() updateDataQueryDto: UpdateDataQueryDto) {
    const { options } = updateDataQueryDto;

    const dataQuery = await this.dataQueriesService.findOne(dataQueryId);

    if (user) {
      const ability = await this.appsAbilityFactory.appsActions(user, dataQuery.appId);

      if (!ability.can('runQuery', dataQuery.app)) {
        throw new ForbiddenException('you do not have permissions to perform this action');
      }
    }

    let result = {};

    try {
      result = await this.dataQueriesService.runQuery(user, dataQuery, options);
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
  @Post('/preview')
  async previewQuery(@User() user, @Body() updateDataQueryDto: UpdateDataQueryDto) {
    const { options, query } = updateDataQueryDto;
    const dataQueryEntity = {
      ...query,
      dataSource: await this.dataSourcesService.findOne(query['data_source_id']),
    };

    if (dataQueryEntity.dataSource) {
      const ability = await this.appsAbilityFactory.appsActions(user, dataQueryEntity.dataSource.appId);

      if (!ability.can('previewQuery', dataQueryEntity.dataSource.app)) {
        throw new ForbiddenException('you do not have permissions to perform this action');
      }
    }

    let result = {};

    try {
      result = await this.dataQueriesService.runQuery(user, dataQueryEntity, options);
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
}
