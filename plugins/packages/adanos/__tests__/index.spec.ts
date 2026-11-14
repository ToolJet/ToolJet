import AdanosQueryService from '../lib/index';
import got from 'got';

jest.mock('got');

describe('AdanosQueryService', () => {
  let service: AdanosQueryService;
  const mockSourceOptions = {
    api_key: 'test_adanos_secret_key_123',
    base_url: 'https://api.adanos.org/v1',
  };

  beforeEach(() => {
    service = new AdanosQueryService();
    jest.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should return success when connection verify succeeds', async () => {
      (got.get as jest.Mock).mockResolvedValueOnce({
        statusCode: 200,
        body: { status: 'ok', authenticated: true },
      });

      const result = await service.testConnection(mockSourceOptions);
      expect(result.status).toBe('success');
      expect(got.get).toHaveBeenCalledWith(
        'https://api.adanos.org/v1/auth/verify',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test_adanos_secret_key_123',
          }),
        })
      );
    });

    it('should return failed when API key is missing', async () => {
      const result = await service.testConnection({ api_key: '' });
      expect(result.status).toBe('failed');
      expect(result.message).toContain('API key is required');
    });

    it('should return failed when network request fails', async () => {
      (got.get as jest.Mock).mockRejectedValueOnce({
        message: 'Unauthorized API key',
        response: { body: { message: 'Invalid API key provided' } },
      });

      const result = await service.testConnection(mockSourceOptions);
      expect(result.status).toBe('failed');
      expect(result.message).toBe('Invalid API key provided');
    });
  });

  describe('run - get_asset_sentiment', () => {
    it('should fetch sentiment for a single asset', async () => {
      const mockResponse = {
        symbol: 'AAPL',
        sentiment_score: 0.78,
        mention_volume: 1420,
        bullish_percentage: 82.5,
        bearish_percentage: 17.5,
      };

      (got.get as jest.Mock).mockResolvedValueOnce({
        body: mockResponse,
      });

      const result = await service.run(mockSourceOptions, {
        operation: 'get_asset_sentiment',
        symbol: 'aapl',
        source: 'reddit_stocks',
        time_range: '24h',
      });

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockResponse);
      expect(got.get).toHaveBeenCalledWith(
        'https://api.adanos.org/v1/sentiment/asset/AAPL',
        expect.objectContaining({
          searchParams: {
            source: 'reddit_stocks',
            time_range: '24h',
          },
        })
      );
    });

    it('should throw error when symbol is omitted', async () => {
      await expect(
        service.run(mockSourceOptions, {
          operation: 'get_asset_sentiment',
          symbol: '',
        })
      ).rejects.toThrow('Symbol / Ticker is required');
    });
  });

  describe('run - get_trending_assets', () => {
    it('should fetch trending assets with category and limit', async () => {
      const mockTrending = {
        trending: [
          { symbol: 'NVDA', score: 0.92, volume: 5400 },
          { symbol: 'TSLA', score: 0.65, volume: 3200 },
        ],
      };

      (got.get as jest.Mock).mockResolvedValueOnce({
        body: mockTrending,
      });

      const result = await service.run(mockSourceOptions, {
        operation: 'get_trending_assets',
        category: 'stocks',
        limit: 10,
      });

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockTrending);
      expect(got.get).toHaveBeenCalledWith(
        'https://api.adanos.org/v1/sentiment/trending',
        expect.objectContaining({
          searchParams: {
            category: 'stocks',
            limit: '10',
          },
        })
      );
    });
  });

  describe('run - compare_assets', () => {
    it('should format comma-separated symbols and fetch comparison', async () => {
      const mockComparison = {
        comparison: [
          { symbol: 'AAPL', score: 0.8 },
          { symbol: 'MSFT', score: 0.85 },
        ],
      };

      (got.get as jest.Mock).mockResolvedValueOnce({
        body: mockComparison,
      });

      const result = await service.run(mockSourceOptions, {
        operation: 'compare_assets',
        symbols: 'AAPL, MSFT',
        time_range: '7d',
      });

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockComparison);
      expect(got.get).toHaveBeenCalledWith(
        'https://api.adanos.org/v1/sentiment/compare',
        expect.objectContaining({
          searchParams: {
            symbols: 'AAPL,MSFT',
            time_range: '7d',
          },
        })
      );
    });
  });

  describe('run - get_market_sentiment', () => {
    it('should fetch overall market sentiment', async () => {
      const mockMarket = {
        market_index: 68.4,
        sentiment: 'Greed',
        segment: 'us_equities',
      };

      (got.get as jest.Mock).mockResolvedValueOnce({
        body: mockMarket,
      });

      const result = await service.run(mockSourceOptions, {
        operation: 'get_market_sentiment',
        segment: 'us_equities',
      });

      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockMarket);
      expect(got.get).toHaveBeenCalledWith(
        'https://api.adanos.org/v1/sentiment/market',
        expect.objectContaining({
          searchParams: {
            segment: 'us_equities',
          },
        })
      );
    });
  });
});
