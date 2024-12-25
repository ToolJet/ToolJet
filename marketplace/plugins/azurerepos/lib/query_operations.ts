
import { PullRequestStatus } from 'azure-devops-node-api/interfaces/GitInterfaces';
import { QueryOptions } from './types';
import { IGitApi } from "azure-devops-node-api/GitApi";



export async function getAzureRepositories(gitApi: IGitApi, queryOptions: QueryOptions) {
    const repos = await gitApi.getRepositories(queryOptions.project_name);
    return repos;
}


export async function getProjectPullRequests(gitApi: IGitApi, queryOptions: QueryOptions) {

    const pullRequests = await gitApi.getPullRequestsByProject(queryOptions.project_name, { status: queryOptions.status as unknown as PullRequestStatus });
    return pullRequests;
}

export async function getRepositoryCommits(gitApi: IGitApi, queryOptions: QueryOptions) {

    const commits = await gitApi.getCommits(queryOptions.repository_name, {}, queryOptions.project_name);
    return commits;
}

export async function getRepositoryBranches(gitApi: IGitApi, queryOptions: QueryOptions) {

    const branchs = await gitApi.getBranches(queryOptions.repository_name, queryOptions.project_name);
    return branchs;
}

export async function getRepositoryPushes(gitApi: IGitApi, queryOptions: QueryOptions) {

    const pushes = await gitApi.getPushes(queryOptions.repository_name, queryOptions.project_name);
    return pushes;
}
