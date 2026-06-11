import { BaseClient } from 'jira.js/out/clients';
import { Board } from 'jira.js/out/agile';
import { IssueWorklogs, IssueSearch, Issues, UserSearch, Users, Myself } from 'jira.js/out/version3';

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
