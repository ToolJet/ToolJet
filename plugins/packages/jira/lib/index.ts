import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { QueryOptions, SourceOptions } from './types';
import { Version3Client } from 'jira.js';
import { issueResource, userResource } from './operations';

export default class Jira implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const { url } = sourceOptions;
    const { resource } = queryOptions;

    let res: any;

    const client = new Version3Client({
      host: url,
      authentication: {
        basic: {
          username: sourceOptions.email,
          password: sourceOptions.personal_token,
        },
      },
    });

    console.log('queryOptions', queryOptions);

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
}
