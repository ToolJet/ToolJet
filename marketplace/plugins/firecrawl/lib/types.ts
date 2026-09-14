export type SourceOptions = {
  apiKey: string;
  apiUrl: string;
};

export type QueryOptions = {
  operation: Operation;
  url?: string;
  query?: string;
  formats?: string;
  sources?: string;
  search?: string;
  limit?: string;
  jobId?: string;
  options?: string;
};

export enum Operation {
  Scrape = 'scrape',
  Search = 'search',
  Map = 'map',
  StartCrawl = 'start_crawl',
  CrawlStatus = 'crawl_status',
}
