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

function validateNumber(customErrorMessage, optionKey, value, min, max = undefined) {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue) || value < min || (max !== undefined && value > max)) {
    throw new Error(`Invalid ${optionKey}: ${customErrorMessage}`);
  }
  return true;
}

export async function getRepoIssues(octokit: Octokit, options: QueryOptions): Promise<object> {
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/issues', {
    owner: options.owner,
    repo: options.repo,
    state: options.state || 'all',
    ...(options.page &&
      validateNumber('The value must be greater than 1.', 'page', options.page, 1) && {
        page: parseInt(options.page, 10),
      }),
    ...(options.page_size &&
      validateNumber('The value must be in the range of 1 to 100', 'page size', options.page_size, 1, 100) && {
        per_page: parseInt(options.page_size, 10),
      }),
  });

  return data;
}

export async function getRepoPullRequests(octokit: Octokit, options: QueryOptions): Promise<object> {
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
    owner: options.owner,
    repo: options.repo,
    state: options.state || 'all',
    ...(options.page &&
      validateNumber('The value must be greater than 1.', 'page', options.page, 1) && {
        page: parseInt(options.page, 10),
      }),
    ...(options.page_size &&
      validateNumber('The value must be in the range of 1 to 100', 'page size', options.page_size, 1, 100) && {
        per_page: parseInt(options.page_size, 10),
      }),
  });

  return data;
}
