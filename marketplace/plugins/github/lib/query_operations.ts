import { Octokit } from 'octokit';
import { QueryOptions } from './types';

export async function getUserInfo(octokit: Octokit, options: QueryOptions): Promise<object> {
  const { data } = await octokit.request('GET /users/{username}', {
    username: options.username,
  });
  return data;
}

export async function getRepo(octokit: Octokit, options: QueryOptions): Promise<object> {
  const { data } = await octokit.request('GET /repos/{owner}/{repo}', {
    owner: options.owner,
    repo: options.repo,
  });
  return data;
}

export async function getRepoIssues(octokit: Octokit, options: QueryOptions): Promise<object> {
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/issues', {
    owner: options.owner,
    repo: options.repo,
    state: options.state || 'all',
  });
  return data;
}

export async function getRepoPullRequests(octokit: Octokit, options: QueryOptions): Promise<object> {
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
    owner: options.owner,
    repo: options.repo,
    state: options.state || 'all',
  });
  return data;
}
