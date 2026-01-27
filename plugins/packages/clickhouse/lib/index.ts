import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
const JSON5 = require('json5');
import { createClient } from '@clickhouse/client';
import { Parser } from 'node-sql-parser';


export default class Click implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { query, operation, fields, tablename } = queryOptions;
    let result = {};
    const clickhouseClient = await this.getConnection(sourceOptions);
    try {
      switch (operation) {
        case 'sql': {
          const isDRLQuery = this.isDRLQuery(query);

          if (isDRLQuery) {
            const format = 'JSONEachRow';
            const resultSet = await clickhouseClient.query({
              query,
              format: format
            });

            let data = await resultSet.json();

            result = data;

          } else {
            await clickhouseClient.command({
              query
            });
            result = { r:1 }; //for backward compatibility
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
          result = { r:1 }; //for backward compatibility
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


    const clickhouse = await this.getConnection(sourceOptions);
    if (!clickhouse) {
      throw new Error('Invalid credentials');
    }
    const resultSet = await clickhouse.query({
      query: 'SHOW DATABASES',
      format: 'JSON',
    });
    await resultSet.json();
    return {
      status: 'ok',
    };


  }
  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const { port, host, protocol, database, username, password } = sourceOptions;
    const url = `${protocol}://${host}:${port}`;
    const clickhouse = createClient({
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

  private isDRLQuery(query: string): boolean {
    try {
      const parser = new Parser();
      const trimmed = query.trim();

      const parsed = parser.astify(trimmed);
      const ast = Array.isArray(parsed) ? parsed[0] : parsed;

      if (!ast || !ast.type) return false;

      // DRL types
      const drlTypes = ['select', 'show', 'describe', 'desc', 'exists'];

      return drlTypes.includes(ast.type.toLowerCase());
    } catch (e) {
      // Fallback for simple queries without AST support
      const q = query.trim().toUpperCase();
      return (
        q.startsWith('SELECT') ||
        q.startsWith('SHOW') ||
        q.startsWith('DESCRIBE') ||
        q.startsWith('DESC') ||
        q.startsWith('EXISTS')
      );
    }
  }

}
