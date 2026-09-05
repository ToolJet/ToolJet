export type SourceOptions = {
  api_key?: string;
  api_url?: string;
};

export type QueryOptions = {
  operation: 'scrape' | 'search' | 'crawl' | 'crawl_status' | 'map';
  url?: string;
  query?: string;
  job_id?: string;
  limit?: number | string;
  formats?: string;
  only_main_content?: boolean;
  wait_for?: number | string;
  include_tags?: string;
  exclude_tags?: string;
  search_options?: string;
  crawl_options?: string;
};
