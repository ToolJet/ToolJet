import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
const JSON5 = require('json5');
import { createClient } from '@clickhouse/client';


export default class Click implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { query, operation, fields, tablename } = queryOptions;
    let result = {};
    const clickhouseClient = await this.getConnection(sourceOptions);
    try {
      switch (operation) {
        case 'sql': {
          let resultSet= await clickhouseClient.query({
            query,
            format: 'JSONEachRow'
          });
          
          let data = await resultSet.json();    
          if (!data || (Array.isArray(data) && data.length === 0)) {
            result = { r: 1 };
          } else {
            result = data;
          }  
          break;
          
        }
        case 'insert': {
          const rows = this.parseJSON(query);
          await clickhouseClient.insert({
            table: tablename,
            values: rows,
            columns: fields,
            format: 'JSONEachRow'
          });
          result = { message: 'Data inserted successfully' };
          break;
        }
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }
    return {
      status: 'ok',
      data: result,
    };
  }
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    
    try{
      const clickhouse = await this.getConnection(sourceOptions);
      if (!clickhouse) {
        throw new Error('Invalid credentials');
      }
      const resultSet =await clickhouse.query({
          query: 'SHOW DATABASES',
          format: 'JSON',
        });
      await resultSet.json();
      return {
        status: 'ok',
      };
    }catch (err: any) {
      throw new QueryError('Connection failed', err.message, {});
    }
    
  }
  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const { port, host, protocol, database, username, password } = sourceOptions;
    const url = `${protocol}://${host}:${port}`;
    const clickhouse=createClient({
      host: url,
      username: username || 'default',
      password: password || '',
      database: database || 'default',
    });
    return clickhouse;
  }

  private parseJSON(json?: string): object {
    if (!json) return {};

    return JSON5.parse(json);
  }
}
