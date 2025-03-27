import { QueryError, QueryResult, QueryService } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import * as azdev from "azure-devops-node-api";
import { getAzureRepositories, getProjectPullRequests, getRepositoryBranches, getRepositoryCommits, getRepositoryPushes } from './query_operations';
import { IGitApi } from "azure-devops-node-api/GitApi";

export default class Azurerepos implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {

    const connection = await this.getConnection(sourceOptions)
    const gitApi: IGitApi = await connection.getGitApi();
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
        case Operation.GetRepositoryBranches:
          result = await getRepositoryBranches(gitApi, queryOptions);
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

    const authHandler = azdev.getPersonalAccessTokenHandler(token);

    const connection = new azdev.WebApi(url, authHandler);

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

