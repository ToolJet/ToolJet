import { QueryOptions } from './types';
import { Version3Client } from 'jira.js';
import JSON5 from 'json5';

function returnObject(data: any) {
  if (!data) {
    return undefined;
  }
  return typeof data === 'string' ? JSON5.parse(data) : data;
}

export async function createIssue(queryOptions: QueryOptions, client: Version3Client) {
  const { properties } = queryOptions;
  let returnValue = {};

  await client.issues
    .createIssue(returnObject(properties))
    .then((response) => {
      returnValue = response;
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

export async function getIssue(queryOptions: QueryOptions, client: Version3Client) {
  let returnValue = {};

  await client.issues
    .getIssue({ issueIdOrKey: queryOptions.issue_key })
    .then((res) => {
      returnValue = res;
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

export async function deleteIssue(queryOptions: QueryOptions, client: Version3Client) {
  let returnValue = {};

  await client.issues
    .deleteIssue({ issueIdOrKey: queryOptions.issue_key })
    .then(() => {
      returnValue = 'issue deleted';
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

export async function assignIssue(queryOptions: QueryOptions, client: Version3Client) {
  let returnValue = {};
  await client.issues
    .assignIssue({ issueIdOrKey: queryOptions.issue_key, accountId: queryOptions.account_id })
    .then(() => {
      returnValue = 'issue assigned';
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}
