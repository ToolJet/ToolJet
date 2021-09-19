import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataQuery } from '../../src/entities/data_query.entity';
import { CredentialsService } from './credentials.service';
import { allPlugins } from 'src/modules/data_sources/plugins';
import { DataSource } from 'src/entities/data_source.entity';
import RestapiQueryService from '@plugins/datasources/restapi';
import { DataSourcesService } from './data_sources.service';

@Injectable()
export class DataQueriesService {

  constructor(
    private credentialsService: CredentialsService,
    private dataSourcesService: DataSourcesService,
    @InjectRepository(DataQuery)
    private dataQueriesRepository: Repository<DataQuery>,
  ) { }

  async findOne(dataQueryId: string): Promise<DataQuery> {
    return await this.dataQueriesRepository.findOne(
      { id: dataQueryId },
      { relations: ['dataSource', 'app', 'app.appVersions'] },
    );
  }

  async all(user: User, appId: string): Promise<DataQuery[]> {

    return await this.dataQueriesRepository.find({
        where: {
          appId,
        },
        order: {
          name: 'ASC'
        }
    });
  }

  async create(user: User, name: string, kind: string, options: object, appId: string, dataSourceId: string): Promise<DataQuery> {
    const newDataQuery = this.dataQueriesRepository.create({
      name,
      kind,
      options,
      appId,
      dataSourceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return this.dataQueriesRepository.save(newDataQuery);
  }

  async delete(dataQueryId: string) {
    return await this.dataQueriesRepository.delete(dataQueryId);
  }

  async update(user: User, dataQueryId: string, name: string, options: object): Promise<DataQuery> {
    const dataQuery = this.dataQueriesRepository.save({
      id: dataQueryId,
      name,
      options,
      updatedAt: new Date(),
    })

    return dataQuery;
  }

  async runQuery(user: User, dataQuery: any, queryOptions: object): Promise<object> {

    const dataSource = dataQuery.dataSource?.id ? dataQuery.dataSource : {};
    const sourceOptions = await this.parseSourceOptions(dataSource.options);
    const parsedQueryOptions = await this.parseQueryOptions(dataQuery.options, queryOptions);
    const kind = dataQuery.kind;
    const plugins = await allPlugins;
    const pluginServiceClass = plugins[kind];

    const service = new pluginServiceClass();
    const result = await service.run(sourceOptions, parsedQueryOptions, dataSource.id, dataSource.updatedAt);

    return result;
  }

  /* This function fetches access token from authorization code */
  async authorizeOauth2(dataSource: DataSource, code:string): Promise<any> {
    const sourceOptions = await this.parseSourceOptions(dataSource.options);
    const queryService = new RestapiQueryService();
    const tokenData = await queryService.fetchOAuthToken(sourceOptions, code);

    const tokenOptions = [{
      key: 'tokenData',
      value: tokenData,
      encrypted: false
    }];

    return await this.dataSourcesService.updateOptions(dataSource.id, tokenOptions);
  }

  async parseSourceOptions(options: any): Promise<object> {

    // For adhoc queries such as REST API queries, source options will be null
    if(!options) return {};

    const parsedOptions = {};

    for(const key of Object.keys(options)) {
      const option = options[key];
      const encrypted = option['encrypted'];
      if(encrypted) {
        const credentialId = option['credential_id'];
        const value = await this.credentialsService.getValue(credentialId);
        parsedOptions[key] = value;
      } else {
        parsedOptions[key] = option['value']
      }
    }

    return parsedOptions;
  }

  async parseQueryOptions(object: any, options: object): Promise<object> {
    if( typeof object === 'object' ) {
      for( const key of Object.keys(object) ) {
        object[key] = await this.parseQueryOptions(object[key], options);
      }
      return object;

    } else if(typeof object === 'string') {

      if(object.startsWith('{{') && object.endsWith('}}') && (object.match(/{{/g) || []).length === 1) {
        object = options[object];
        return object;

      } else {
        const variables = object.match(/\{\{(.*?)\}\}/g);

        if(variables?.length > 0) {
          for(const variable of variables) {
            object = object.replace(variable, options[variable]);
          }
        } else {
          object = object;
        }

        return object;
      }

    } else if (Array.isArray(object)) {
      object.forEach(element => {
      });

      for(const [index, element] of object) {
        object[index] = await this.parseQueryOptions(element, options);
      }
      return object;
    }
    return object;
  }
}
