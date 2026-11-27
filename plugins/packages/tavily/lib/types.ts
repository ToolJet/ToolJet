export type SourceOptions = {
  api_key: string;
  base_url?: string;
};

export type QueryOptions = {
  operation: 'search' | 'qna_search' | 'extract';
  query?: string;
  search_depth?: 'basic' | 'advanced';
  topic?: 'general' | 'news';
  max_results?: number;
  include_answer?: boolean;
  include_raw_content?: boolean;
  include_images?: boolean;
  include_domains?: string[] | string;
  exclude_domains?: string[] | string;
  urls?: string[] | string;
};

export type TavilySearchPayload = {
  query: string;
  search_depth?: 'basic' | 'advanced';
  topic?: 'general' | 'news';
  max_results?: number;
  include_answer?: boolean;
  include_raw_content?: boolean;
  include_images?: boolean;
  include_domains?: string[];
  exclude_domains?: string[];
};

export type TavilyExtractPayload = {
  urls: string[];
};
