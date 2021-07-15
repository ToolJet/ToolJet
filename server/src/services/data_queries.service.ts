import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataQuery } from '../../src/entities/data_query.entity';
import { CredentialsService } from './credentials.service';
import FirestoreQueryService from '../../plugins/datasources/firestore';
import PostgresqlQueryService from '../../plugins/datasources/postgresql';
import MysqlQueryService from '../../plugins/datasources/mysql';

@Injectable()
export class DataQueriesService {

  private plugins = {
     postgresql: PostgresqlQueryService, 
     firestore: FirestoreQueryService,
     mysql: MysqlQueryService
  };

  constructor(
    private credentialsService: CredentialsService,
    @InjectRepository(DataQuery)
    private dataQueriesRepository: Repository<DataQuery>,
  ) { }

  async all(user: User, appId: string): Promise<DataQuery[]> {

    return await this.dataQueriesRepository.find({
        where: {
          appId,
        },
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

  async update(user: User,dataQueryId: string, name: string, options: object): Promise<DataQuery> {
    const dataQuery = this.dataQueriesRepository.save({
      id: dataQueryId,
      name,
      options,
      updatedAt: new Date(),
    })

    return dataQuery;
  }

  async runQuery(user: User, dataQueryId: string, queryOptions: object): Promise<object> {

    const dataQuery = await this.dataQueriesRepository.findOne(dataQueryId, { relations: ['dataSource'] });
    const dataSource = dataQuery.dataSource;
    const sourceOptions = await this.parseSourceOptions(dataSource.options);
    const parsedQueryOptions = await this.parseQueryOptions(dataQuery.options, queryOptions);
    const kind = dataSource.kind;
    const pluginServiceClass = this.plugins[kind];

    const service = new pluginServiceClass();
    const result = await service.run(sourceOptions, parsedQueryOptions, dataSource.id);

    return result;
  }

  async parseSourceOptions(options: any): Promise<object> {

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
