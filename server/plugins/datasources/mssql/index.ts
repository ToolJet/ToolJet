import { Injectable } from '@nestjs/common';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { Knex, knex } from 'knex'
import { QueryError } from 'src/modules/data_sources/query.error';

@Injectable()
export default class MssqlQueryService implements QueryService {

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {

    let result = { };
    let query = queryOptions.query;
    const knexInstance = await this.getConnection(sourceOptions);

    try {
      result = await knexInstance.raw(query);
    } catch (err) {
      throw new QueryError('Query could not be completed', err.message, {});
    }

    return { status: 'ok', data: result }
  }

  async getConnection(sourceOptions: any): Promise<any> { 
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
}
