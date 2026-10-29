export type SourceOptions = {
  api_token: string;
  account_id: string;
};

export type QueryOptions = {
  operation: 'search_instance' | 'chat_completions' | 'list_instances' | 'get_instance';
  instance_id?: string;
  query?: string;
  filters?: string;
};
