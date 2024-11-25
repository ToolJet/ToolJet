import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { QueryOptions, SourceOptions } from './types';
import { JiraClient } from './jira-client';

import { boardResource, issueResource, userResource, worklogResource } from './query_operations';
export { userResource, issueResource, worklogResource, boardResource, JiraClient };

export default class Jira implements QueryService {
  async getConnection(sourceOptions: SourceOptions) {
    const { url } = sourceOptions;
    const client = new JiraClient({
      host: url,
      authentication: {
        basic: {
          username: sourceOptions.email,
          password: sourceOptions.personal_token,
        },
      },
    });

    return client;
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const { resource } = queryOptions;

    const client = await this.getConnection(sourceOptions);

    let res: any;

    try {
      switch (resource) {
        case 'issue': {
          res = await issueResource(queryOptions, client);
          break;
        }
        case 'user': {
          res = await userResource(queryOptions, client);
          break;
        }
        case 'worklog': {
          res = await worklogResource(queryOptions, client);
          break;
        }
        case 'board': {
          res = await boardResource(queryOptions, client);
          break;
        }
        default: {
          throw new Error('Select an operation');
        }
      }
    } catch (error) {
      res = error.toString();
      throw new QueryError('Query could not be completed', error.message, res);
    }

    return {
      status: 'ok',
      data: res,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);

    await client.myself.getCurrentUser({}).catch((error) => {
      throw new Error(error);
    });

    return {
      status: 'ok',
    };
  }
}
