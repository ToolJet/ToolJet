import { Injectable } from '@nestjs/common';
import { cacheConnection, getCachedConnection } from 'src/helpers/utils.helper';
import { ConnectionTestResult } from 'src/modules/data_sources/connection_test_result.type';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
const { Pool } = require('pg');

@Injectable()
export default class PostgresqlQueryService implements QueryService {

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string, dataSourceUpdatedAt: string): Promise<QueryResult> {

    const pool = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

    let result = {
      rows: []
    };
    let query = '';

    if(queryOptions.mode === 'gui') {
      if(queryOptions.operation === 'bulk_update_pkey') { 
        query = await this.buildBulkUpdateQuery(queryOptions);
      }
    } else { 
      query = queryOptions.query;
    }

    result = await pool.query(query);

    return {
      status: 'ok',
      data: result.rows
    }
  }

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    const pool = await this.getConnection(sourceOptions, {}, false);
    const result = await pool.query('SELECT version();');

    return {
      status: 'ok'
    }
  }

  async buildConnection(sourceOptions: any) {
    return new Pool({
      user: sourceOptions.username,
      host: sourceOptions.host,
      database: sourceOptions.database,
      password: sourceOptions.password,
      port: sourceOptions.port,
      ssl: { rejectUnauthorized: false },
    });
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

  async buildBulkUpdateQuery(queryOptions: any): Promise<string> {
    let queryText = '';

    const tableName = queryOptions['table'];
    const primaryKey = queryOptions['primary_key_column'];
    const records = queryOptions['records'];

    for(const record of records ) {
      queryText = `${queryText} UPDATE ${tableName} SET`;

      for(const key of Object.keys(record)) {
        if(key !== primaryKey) {
          queryText = ` ${queryText} ${key} = '${record[key]}',`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `${queryText} WHERE ${primaryKey} = ${record[primaryKey]};`;
    }

    return queryText.trim();
  }
}
