import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import * as azdev from "azure-devops-node-api";
import { getAzureRepositories, getProjectPullRequests, getRepositoryBranchs, getRepositoryCommits, getRepositoryPushes } from './query_operations';

export default class Azurerepos implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const connection = await this.getConnection(sourceOptions)
    const gitApi = await connection.getGitApi();
    const operation: Operation = queryOptions.operation;

    let result = {};

    try {
      switch (operation) {
        case Operation.GetAzureRepo:
          result = await getAzureRepositories(gitApi, queryOptions);
          break;
        case Operation.GetProjectPullRequests:
          result = await getProjectPullRequests(gitApi, queryOptions);
          break;
        case Operation.GetRepoCommits:
          result = await getRepositoryCommits(gitApi, queryOptions);
          break;
        case Operation.GetRepositoryBranchs:
          result = await getRepositoryBranchs(gitApi, queryOptions);
          break;
        case Operation.getRepositoryPushes:
          result = await getRepositoryPushes(gitApi, queryOptions);
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
  async getConnection(sourceOptions: SourceOptions): Promise<any> {

    const organization: string = sourceOptions.organization_name
    const token: string = sourceOptions.personal_access_token

    const url = `https://dev.azure.com/${organization}`;

    let authHandler = azdev.getPersonalAccessTokenHandler(token);

    let connection = new azdev.WebApi(url, authHandler);

    return connection

  }
  async testConnection(sourceOptions: SourceOptions): Promise<any> {

    const connection = await this.getConnection(sourceOptions)
    try {

      const status = await connection.connect();

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

}

