export type SourceOptions = {
  api_key: string;
  base_url?: string;
};

export type QueryOptions = {
  operation: 'get_asset_sentiment' | 'get_trending_assets' | 'compare_assets' | 'get_market_sentiment';
  symbol?: string;
  symbols?: string;
  source?: string;
  time_range?: string;
  category?: string;
  limit?: string | number;
  segment?: string;
};
