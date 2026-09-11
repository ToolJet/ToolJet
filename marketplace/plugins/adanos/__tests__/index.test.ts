import AdanosService from '../lib/index';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AdanosService', () => {
  let service: AdanosService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    service = new AdanosService();
    mockAxiosInstance = {
      get: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('testConnection', () => {
    it('returns ok status when connection succeeds', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: { buzz_score: 55 },
      });

      const result = await service.testConnection({ api_key: 'sk_live_test123' });
      expect(result.status).toBe('ok');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/reddit/stocks/v1/market-sentiment');
    });

    it('returns failed status when connection fails', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { detail: 'Invalid API key' },
        },
      });

      const result = await service.testConnection({ api_key: 'sk_live_invalid' });
      expect(result.status).toBe('failed');
      expect(result.message).toBe('Invalid API key');
    });
  });

  describe('run - get_asset_sentiment', () => {
    it('fetches stock sentiment properly', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { ticker: 'TSLA', sentiment_score: 0.45, buzz_score: 80 },
      });

      const result = await service.run(
        { api_key: 'sk_live_test' },
        {
          operation: 'get_asset_sentiment',
          source: 'reddit_stocks',
          symbol: '$TSLA',
          from: '2026-08-01',
          to: '2026-08-28',
        }
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/reddit/stocks/v1/stock/TSLA', {
        params: { from: '2026-08-01', to: '2026-08-28' },
      });
      expect(result.status).toBe('ok');
      expect(result.data).toEqual({ ticker: 'TSLA', sentiment_score: 0.45, buzz_score: 80 });
    });

    it('fetches crypto sentiment using token path', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { symbol: 'BTC', sentiment_score: 0.65 },
      });

      const result = await service.run(
        { api_key: 'sk_live_test' },
        {
          operation: 'get_asset_sentiment',
          source: 'reddit_crypto',
          symbol: 'BTC',
        }
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/reddit/crypto/v1/token/BTC', {
        params: {},
      });
      expect(result.status).toBe('ok');
    });
  });

  describe('run - get_trending_assets', () => {
    it('fetches trending assets with pagination and filters', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: [{ ticker: 'NVDA', buzz_score: 95 }],
      });

      const result = await service.run(
        { api_key: 'sk_live_test' },
        {
          operation: 'get_trending_assets',
          source: 'news_stocks',
          limit: 10,
          offset: 0,
          type: 'stock',
        }
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/news/stocks/v1/trending', {
        params: { limit: 10, offset: 0, type: 'stock' },
      });
      expect(result.status).toBe('ok');
    });
  });

  describe('run - compare_assets', () => {
    it('fetches comparisons for stock tickers', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { stocks: [{ ticker: 'AAPL' }, { ticker: 'MSFT' }] },
      });

      const result = await service.run(
        { api_key: 'sk_live_test' },
        {
          operation: 'compare_assets',
          source: 'x_stocks',
          symbols: 'AAPL,MSFT',
        }
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/x/stocks/v1/compare', {
        params: { tickers: 'AAPL,MSFT' },
      });
      expect(result.status).toBe('ok');
    });

    it('fetches comparisons for crypto symbols', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { tokens: [{ symbol: 'BTC' }, { symbol: 'ETH' }] },
      });

      const result = await service.run(
        { api_key: 'sk_live_test' },
        {
          operation: 'compare_assets',
          source: 'reddit_crypto',
          symbols: 'BTC,ETH',
        }
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/reddit/crypto/v1/compare', {
        params: { symbols: 'BTC,ETH' },
      });
      expect(result.status).toBe('ok');
    });
  });

  describe('run - query error handling', () => {
    it('throws a QueryError with the API error message when a query fails', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: {
          status: 422,
          data: { detail: { message: 'Invalid ticker symbol' } },
        },
        name: 'Error',
      });

      await expect(
        service.run(
          { api_key: 'sk_live_test' },
          { operation: 'get_asset_sentiment', source: 'reddit_stocks', symbol: 'TSLA' }
        )
      ).rejects.toMatchObject({
        message: 'Query could not be completed',
        description: 'Invalid ticker symbol',
        data: { statusCode: 422, errorType: 'Error' },
      });
    });

    it('throws an error when an operation is unsupported', async () => {
      await expect(
        service.run({ api_key: 'sk_live_test' }, { operation: 'bogus_operation', source: 'reddit_stocks' } as any)
      ).rejects.toMatchObject({
        message: 'Query could not be completed',
        description: 'Unsupported operation: bogus_operation',
      });
    });
  });

  describe('run - get_market_sentiment', () => {
    it('fetches market sentiment properly', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { buzz_score: 60, trend: 'bullish' },
      });

      const result = await service.run(
        { api_key: 'sk_live_test' },
        {
          operation: 'get_market_sentiment',
          source: 'polymarket_stocks',
        }
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/polymarket/stocks/v1/market-sentiment', {
        params: {},
      });
      expect(result.status).toBe('ok');
    });
  });
});
