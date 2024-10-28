export type QueryOptions = {
  resource?: string;
  properties?: any;
  account_id?: string;
  issue_key?: string;
  issue_keys?: string;
  project_key?: string;
  operation?: string;
  query?: string;
  start_at?: any;
  max_results?: any;
  board_name?: string;

  expand?: string;

  action_descriptor_id?: any;
  recommend?: string;

  delete_subtasks?: string;

  started_after?: any;
  started_before?: any;

  // worklog
  worklog_id?: any;

  // board
  board_id?: any;
  done?: string;
};

export type SourceOptions = {
  url: string;
  // auth_type: string;
  personal_token: string;
  email: string;
};
