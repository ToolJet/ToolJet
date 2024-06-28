import { QueryOptions } from './types';
import { Version3Client } from 'jira.js';
import JSON5 from 'json5';

function returnObject(data: any) {
  if (!data) {
    return undefined;
  }
  return typeof data === 'string' ? JSON5.parse(data) : data;
}

function returnNumber(data: any) {
  if (!data) {
    return undefined;
  }
  return typeof data === 'string' ? Number.parseInt(data) : data;
}

//users
export async function userResource(queryOptions: QueryOptions, client: Version3Client) {
  const { operation } = queryOptions;
  let res;
  switch (operation) {
    case 'get_user': {
      res = await getUser(queryOptions, client);
      break;
    }
    case 'find_users_by_query': {
      res = await findUsersByQuery(queryOptions, client);
      break;
    }
    case 'find_assignable_users': {
      res = await findAssignableUsers(queryOptions, client);
      break;
    }
    default: {
      throw new Error('Select an operation');
    }
  }
  return res;
}

async function getUser(queryOptions: QueryOptions, client: Version3Client) {
  let returnValue = {};

  await client.users
    .getUser({ accountId: queryOptions.account_id, expand: queryOptions.expand })
    .then((res) => {
      returnValue = res;
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

async function findUsersByQuery(queryOptions: QueryOptions, client: Version3Client) {
  const { query, start_at, max_results } = queryOptions;
  let returnValue = {};

  await client.userSearch
    .findUsersByQuery({ query: query, startAt: returnNumber(start_at), maxResults: returnNumber(max_results) })
    .then((res) => {
      returnValue = res;
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

// GET all users
async function findAssignableUsers(queryOptions: QueryOptions, client: Version3Client) {
  let returnValue = {};

  await client.userSearch
    .findAssignableUsers({
      query: queryOptions.query,
      sessionId: queryOptions.session_id,
      accountId: queryOptions.account_id,
      project: queryOptions.project_key,
      issueKey: queryOptions.issue_key,
      startAt: returnNumber(queryOptions.start_at),
      maxResults: returnNumber(queryOptions.max_results),
      actionDescriptorId: queryOptions.action_descriptor_id,
      recommend: queryOptions.recommend,
    })
    .then((res) => {
      returnValue = res;
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

//issues
export async function issueResource(queryOptions: QueryOptions, client: Version3Client) {
  const { operation } = queryOptions;
  let res;
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
    case 'edit_issue': {
      res = await editIssue(queryOptions, client);
      break;
    }
    default: {
      throw new Error('Select an operation');
    }
  }
  return res;
}

async function createIssue(queryOptions: QueryOptions, client: Version3Client) {
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

async function getIssue(queryOptions: QueryOptions, client: Version3Client) {
  let returnValue = {};

  await client.issues
    .getIssue({ issueIdOrKey: queryOptions.issue_key, ...returnObject(queryOptions.properties) })
    .then((res) => {
      returnValue = res;
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

async function deleteIssue(queryOptions: QueryOptions, client: Version3Client) {
  let returnValue = {};

  await client.issues
    .deleteIssue({ issueIdOrKey: queryOptions.issue_key, deleteSubtasks: queryOptions.delete_subtasks })
    .then(() => {
      returnValue = 'issue deleted';
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

async function assignIssue(queryOptions: QueryOptions, client: Version3Client) {
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

async function editIssue(queryOptions: QueryOptions, client: Version3Client) {
  let returnValue = {};
  const { properties } = queryOptions;
  await client.issues
    .editIssue({ issueIdOrKey: queryOptions.issue_key, ...returnObject(properties) })
    .then(() => {
      returnValue = 'issue updated';
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

// issue worklog
export async function worklogResource(queryOptions: QueryOptions, client: Version3Client) {
  const { operation } = queryOptions;
  let res;
  switch (operation) {
    case 'issue_worklogs': {
      res = await issueWorklogs(queryOptions, client);
      break;
    }
    case 'add_worklog': {
      res = await addWorklog(queryOptions, client);
      break;
    }
    case 'delete_worklog': {
      res = await deleteWorklog(queryOptions, client);
      break;
    }
    default: {
      throw new Error('Select an operation');
    }
  }
  return res;
}

async function issueWorklogs(queryOptions: QueryOptions, client: Version3Client) {
  let returnValue = {};
  await client.issueWorklogs
    .getIssueWorklog({
      issueIdOrKey: queryOptions.issue_key,
      startAt: returnNumber(queryOptions.start_at),
      maxResults: returnNumber(queryOptions.max_results),
      startedAfter: returnNumber(queryOptions.started_after),
      startedBefore: returnNumber(queryOptions.started_before),
      expand: queryOptions.expand,
    })
    .then((res) => {
      returnValue = res;
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

async function addWorklog(queryOptions: QueryOptions, client: Version3Client) {
  let returnValue = {};

  await client.issueWorklogs
    .addWorklog({
      issueIdOrKey: queryOptions.issue_key,
      ...returnObject(queryOptions.properties),
    })
    .then((res) => {
      returnValue = res;
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

async function deleteWorklog(queryOptions: QueryOptions, client: Version3Client) {
  let returnValue = {};

  await client.issueWorklogs
    .deleteWorklog({
      issueIdOrKey: queryOptions.issue_key,
      id: queryOptions.worklog_id,
      ...returnObject(queryOptions.properties),
    })
    .then(() => {
      returnValue = 'worklog deleted';
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}
