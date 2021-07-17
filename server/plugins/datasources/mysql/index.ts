import { Injectable } from '@nestjs/common';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { Knex, knex } from 'knex';

@Injectable()
export default class MysqlQueryService implements QueryService {

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    
    let result = { };
    let query = queryOptions.query;
    const knexInstance = await this.getConnection(sourceOptions);

    try {
      result = await knexInstance.raw(query);
    } catch (err) {
      console.log(err);
    }

    return {
      status: 'ok',
      data: result[0]
    }
  }

  async getConnection(sourceOptions: any): Promise<any> { 
    const config: Knex.Config = {
      client: 'mysql',
      connection: {
        host : sourceOptions.host,
        user : sourceOptions.username,
        password : sourceOptions.password,
        database : sourceOptions.database,
        port: sourceOptions.port,
      }
    };
    return knex(config);
  }
}
