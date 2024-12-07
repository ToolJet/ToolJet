import { QueryOptions } from './types';
import JSON5 from 'json5';
import { JiraClient } from './jira-client';

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

export async function userResource(queryOptions: QueryOptions, client: JiraClient) {
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

async function getUser(queryOptions: QueryOptions, client: JiraClient) {
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

async function findUsersByQuery(queryOptions: QueryOptions, client: JiraClient) {
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

async function findAssignableUsers(queryOptions: QueryOptions, client: JiraClient) {
  let returnValue = {};
  const isRecommended = queryOptions.recommend === 'Yes' ? true : false;

  await client.userSearch
    .findAssignableUsers({
      query: queryOptions.query,
      accountId: queryOptions.account_id,
      project: queryOptions.project_key,
      issueKey: queryOptions.issue_key,
      startAt: returnNumber(queryOptions.start_at),
      maxResults: returnNumber(queryOptions.max_results),
      actionDescriptorId: queryOptions.action_descriptor_id,
      recommend: isRecommended,
    })
    .then((res) => {
      returnValue = res;
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

export async function issueResource(queryOptions: QueryOptions, client: JiraClient) {
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

async function createIssue(queryOptions: QueryOptions, client: JiraClient) {
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

async function getIssue(queryOptions: QueryOptions, client: JiraClient) {
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

async function deleteIssue(queryOptions: QueryOptions, client: JiraClient): Promise<any> {
  let returnValue: any = {};
  const isSubtasks = queryOptions.delete_subtasks === 'Yes' ? true : false;
  const successMessage = isSubtasks
    ? `The issue '${queryOptions.issue_key}' and its subtasks have been deleted.`
    : `The issue '${queryOptions.issue_key}' has been deleted.`;

  try {
    await client.issues.deleteIssue({ issueIdOrKey: queryOptions.issue_key, deleteSubtasks: isSubtasks });
    returnValue = {
      response: { data: successMessage },
    };
  } catch (err) {
    returnValue = { statusCode: err.response?.status, response: err?.response?.data };
  }

  return returnValue;
}

async function assignIssue(queryOptions: QueryOptions, client: JiraClient) {
  let returnValue = {};

  try {
    await client.issues.assignIssue({ issueIdOrKey: queryOptions.issue_key, accountId: queryOptions.account_id });
    returnValue = {
      response: {
        data: `The issue '${queryOptions.issue_key}' has been assigned to accound id '${queryOptions.account_id}'.`,
      },
    };
  } catch (err) {
    returnValue = { statusCode: err.response?.status, response: err?.response?.data };
  }

  return returnValue;
}

async function editIssue(queryOptions: QueryOptions, client: JiraClient) {
  let returnValue = {};
  const { properties } = queryOptions;

  try {
    await client.issues.editIssue({ issueIdOrKey: queryOptions.issue_key, ...returnObject(properties) });
    returnValue = {
      response: { data: `The issue '${queryOptions.issue_key}' has been updated.` },
    };
  } catch (err) {
    returnValue = { statusCode: err.response?.status, response: err?.response?.data };
  }

  return returnValue;
}

export async function worklogResource(queryOptions: QueryOptions, client: JiraClient) {
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

async function issueWorklogs(queryOptions: QueryOptions, client: JiraClient) {
  let returnValue = {};
  await client.issueWorklogs
    .getIssueWorklog({
      issueIdOrKey: queryOptions.issue_key,
      startAt: returnNumber(queryOptions.start_at),
      maxResults: returnNumber(queryOptions.max_results),
      startedAfter: returnNumber(queryOptions.started_after),
      startedBefore: returnNumber(queryOptions.started_before),
    })
    .then((res) => {
      returnValue = res;
    })
    .catch((err) => {
      returnValue = { statusCode: err.response?.status, response: err?.response?.data };
    });

  return returnValue;
}

async function addWorklog(queryOptions: QueryOptions, client: JiraClient) {
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

async function deleteWorklog(queryOptions: QueryOptions, client: JiraClient) {
  let returnValue = {};

  try {
    await client.issueWorklogs.deleteWorklog({
      issueIdOrKey: queryOptions.issue_key,
      id: queryOptions.worklog_id,
      ...returnObject(queryOptions.properties),
    });
    returnValue = {
      response: { data: `The worklog with id '${queryOptions.worklog_id}' has been deleted.` },
    };
  } catch (err) {
    returnValue = { statusCode: err.response?.status, response: err?.response?.data };
  }

  return returnValue;
}

export async function boardResource(queryOptions: QueryOptions, client: JiraClient) {
  const { operation } = queryOptions;
  let res;
  switch (operation) {
    case 'get_issues_for_backlog': {
      res = await getIssuesForBacklog(queryOptions, client);
      break;
    }
    case 'get_all_boards': {
      res = await getAllBoards(queryOptions, client);
      break;
    }
    case 'get_issues_for_board': {
      res = await getIssuesForBoard(queryOptions, client);
      break;
    }
    default: {
      throw new Error('Select an operation');
    }
  }
  return res;
}

async function getAllBoards(queryOptions: QueryOptions, client: JiraClient) {
  let returnValue = {};

  await client.board
    .getAllBoards({
      projectKeyOrId: queryOptions.project_key,
      startAt: queryOptions.start_at,
      maxResults: queryOptions.max_results,
      name: queryOptions.board_name,
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

async function getIssuesForBacklog(queryOptions: QueryOptions, client: JiraClient) {
  let returnValue = {};

  await client.board
    .getIssuesForBacklog({
      boardId: queryOptions.board_id,
      startAt: queryOptions.start_at,
      maxResults: queryOptions.max_results,
      expand: queryOptions.expand,
      id: queryOptions.worklog_id,
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

async function getIssuesForBoard(queryOptions: QueryOptions, client: JiraClient) {
  let returnValue = {};

  await client.board
    .getIssuesForBoard({
      boardId: queryOptions.board_id,
      startAt: queryOptions.start_at,
      maxResults: queryOptions.max_results,
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
