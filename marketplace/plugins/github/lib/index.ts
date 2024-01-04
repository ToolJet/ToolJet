import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { Octokit } from 'octokit';
import { getUserInfo, getRepo, getRepoIssues, getRepoPullRequests } from './query_operations';

export default class Github implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    const octokit: Octokit = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case Operation.GetUserInfo:
          result = await getUserInfo(octokit, queryOptions);
          break;

        case Operation.GetRepo:
          result = await getRepo(octokit, queryOptions);
          break;

        case Operation.GetRepoIssues:
          result = await getRepoIssues(octokit, queryOptions);
          break;

        case Operation.GetRepoPullRequests:
          result = await getRepoPullRequests(octokit, queryOptions);
          break;

        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
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
    const octokit = await this.getConnection(sourceOptions);

    try {
      const { status } = await octokit.rest.users.getAuthenticated();
      if (status) {
        return {
          status: 'ok',
        };
      }
    } catch (error) {
      return {
        status: 'failed',
        message: 'Invalid credentials',
      };
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const octokitClient = new Octokit({
      auth: sourceOptions.personal_token,
    });

    return octokitClient;
  }
}
