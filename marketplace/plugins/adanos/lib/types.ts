export type SourceOptions = {
  api_key: string;
};

export type QueryOptions = {
  operation: 'get_asset_sentiment' | 'get_trending_assets' | 'compare_assets' | 'get_market_sentiment';
  source?: 'reddit_stocks' | 'x_stocks' | 'news_stocks' | 'polymarket_stocks' | 'reddit_crypto';
  symbol?: string;
  symbols?: string;
  from?: string;
  to?: string;
  limit?: string | number;
  offset?: string | number;
  type?: 'all' | 'stock' | 'etf';
};
