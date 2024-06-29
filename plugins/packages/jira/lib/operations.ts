import { QueryOptions } from './types';
import { BaseClient } from 'jira.js';
import JSON5 from 'json5';
import { Board } from 'jira.js/out/agile';
import { IssueWorklogs, IssueSearch, Issues, UserSearch, Users, Myself } from 'jira.js/out/version3';

// Lazy Initialization
export class JiraClient extends BaseClient {
  private _board?: Board;
  private _issues?: Issues;
  private _issueSearch?: IssueSearch;
  private _issueWorklogs?: IssueWorklogs;
  private _userSearch?: UserSearch;
  private _users?: Users;
  private _myself?: Myself;

  get board(): Board {
    if (!this._board) {
      this._board = new Board(this);
    }
    return this._board;
  }

  get issues(): Issues {
    if (!this._issues) {
      this._issues = new Issues(this);
    }
    return this._issues;
  }

  get issueSearch(): IssueSearch {
    if (!this._issueSearch) {
      this._issueSearch = new IssueSearch(this);
    }
    return this._issueSearch;
  }

  get issueWorklogs(): IssueWorklogs {
    if (!this._issueWorklogs) {
      this._issueWorklogs = new IssueWorklogs(this);
    }
    return this._issueWorklogs;
  }

  get userSearch(): UserSearch {
    if (!this._userSearch) {
      this._userSearch = new UserSearch(this);
    }
    return this._userSearch;
  }

  get users(): Users {
    if (!this._users) {
      this._users = new Users(this);
    }
    return this._users;
  }

  get myself(): Myself {
    if (!this._myself) {
      this._myself = new Myself(this);
    }
    return this._myself;
  }
}

// convert string to json
function returnObject(data: any) {
  if (!data) {
    return undefined;
  }
  return typeof data === 'string' ? JSON5.parse(data) : data;
}

// convert string to number
function returnNumber(data: any) {
  if (!data) {
    return undefined;
  }
  return typeof data === 'string' ? Number.parseInt(data) : data;
}

//users
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

// GET all users
async function findAssignableUsers(queryOptions: QueryOptions, client: JiraClient) {
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

async function deleteIssue(queryOptions: QueryOptions, client: JiraClient) {
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

async function assignIssue(queryOptions: QueryOptions, client: JiraClient) {
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

async function editIssue(queryOptions: QueryOptions, client: JiraClient) {
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

// board
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
      expand: queryOptions.expand,
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
