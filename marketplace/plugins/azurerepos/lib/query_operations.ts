
import { QueryOptions } from './types';



export async function getAzureRepositories(gitApi: any, queryOptions: QueryOptions) {

    const repos = await gitApi.getRepositories(queryOptions.project_name);
    return repos;
}


export async function getProjectPullRequests(gitApi: any, queryOptions: QueryOptions) {

    const pullRequests = await gitApi.getPullRequestsByProject(queryOptions.project_name, { status: queryOptions.status });
    return pullRequests;
}

export async function getRepositoryCommits(gitApi: any, queryOptions: QueryOptions) {

    const commits = await gitApi.getCommits(queryOptions.repository_name, {}, queryOptions.project_name);
    return commits;
}

export async function getRepositoryBranchs(gitApi: any, queryOptions: QueryOptions) {

    const branchs = await gitApi.getBranches(queryOptions.repository_name, queryOptions.project_name);
    return branchs;
}

export async function getRepositoryPushes(gitApi: any, queryOptions: QueryOptions) {

    const pushes = await gitApi.getPushes(queryOptions.repository_name, queryOptions.project_name);
    return pushes;
}
