import { Injectable } from '@nestjs/common';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { ConnectionTestResult } from 'src/modules/data_sources/connection_test_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { Knex, knex } from 'knex'
import { QueryError } from 'src/modules/data_sources/query.error';
import { cacheConnection, getCachedConnection } from 'src/helpers/utils.helper';

@Injectable()
export default class MssqlQueryService implements QueryService {

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string, dataSourceUpdatedAt: string): Promise<QueryResult> {

    let result = { };
    let query = queryOptions.query;
    const knexInstance = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

    try {
      result = await knexInstance.raw(query);
    } catch (err) {
      throw new QueryError('Query could not be completed', err.message, {});
    }

    return { status: 'ok', data: result }
  }

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    const result = await knexInstance.raw('select @@version;');

    return {
      status: 'ok'
    }
  }

  async buildConnection(sourceOptions: any) {
    const config: Knex.Config = {
      client: 'mssql',
      connection: {
        host : sourceOptions.host,
        user : sourceOptions.username,
        password : sourceOptions.password,
        database : sourceOptions.database,
        port: sourceOptions.port,
        options: {
          encrypt: true
        }
      }
    };

    return knex(config);
  }

  async getConnection(sourceOptions: any, options:any, checkCache: boolean, dataSourceId?: string, dataSourceUpdatedAt?: string): Promise<any> { 
    if(checkCache) {
      let connection = await getCachedConnection(dataSourceId, dataSourceUpdatedAt);

      if(connection) {
        return connection;
      } else {
        connection = await this.buildConnection(sourceOptions);
        await cacheConnection(dataSourceId, connection);
        return connection;
      }
    } else {
      return await this.buildConnection(sourceOptions);
    }
   
  }
}
