import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import nodemailer from 'nodemailer';

export default class Smtp_server implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {

    return {
      status: 'ok',
      data: {},
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);
  
    if (!client) {
      throw new Error('Invalid credentials');
    }

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: SourceOptions, _options?: object): Promise<any> {
    const host = sourceOptions.host;
    const port = sourceOptions.port;
    const user = sourceOptions.user;
    const pass = sourceOptions.password;

    const connection = {
      host,
      port,
    }
    
    let transport = nodemailer.createTransport({
      port: Number(port),
      host,
      secure: true,
      auth: {
        user,
        pass,
      }
    });
    
    return transport;
  }
}
