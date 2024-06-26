import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { QueryOptions, SourceOptions } from './types';
import { Version3Client } from 'jira.js';
import { assignIssue, createIssue, deleteIssue, getIssue } from './operations';

export default class Jira implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const { url } = sourceOptions;
    const { operation } = queryOptions;

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

    // switch (auth_type) {
    //     case 'personal_access_token':
    //
    //         break
    // }

    try {
      switch (operation) {
        case 'create_issue': {
          res = await createIssue(queryOptions, client);
          break;
        }
        case 'delete_issue': {
          res = await deleteIssue(queryOptions, client);
          break;
        }
        case 'assign_issue': {
          res = await assignIssue(queryOptions, client);
          break;
        }
        case 'get_issue': {
          res = await getIssue(queryOptions, client);
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
