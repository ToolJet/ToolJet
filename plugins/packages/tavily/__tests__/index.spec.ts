import Tavily from '../lib/index';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Tavily Plugin', () => {
  let plugin: Tavily;
  const mockSourceOptions = {
    api_key: 'tvly-test-api-key-12345',
  };

  beforeEach(() => {
    plugin = new Tavily();
    jest.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should successfully test connection with valid API key', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { results: [] } });
      (mockedAxios.create as jest.Mock).mockReturnValue({ post: mockPost } as any);

      const result = await plugin.testConnection(mockSourceOptions);
      expect(result).toEqual({ status: 'ok' });
      expect(mockPost).toHaveBeenCalledWith('/search', expect.objectContaining({
        api_key: 'tvly-test-api-key-12345',
        query: 'ping',
      }));
    });

    it('should fail connection test when api_key is missing', async () => {
      await expect(plugin.testConnection({ api_key: '' })).rejects.toThrow(
        'API Key is required to test connection'
      );
    });

    it('should throw descriptive error on 401 unauthorized', async () => {
      const mockPost = jest.fn().mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Invalid API key provided' },
        },
      });
      (mockedAxios.create as jest.Mock).mockReturnValue({ post: mockPost } as any);

      await expect(plugin.testConnection(mockSourceOptions)).rejects.toThrow(
        'Connection test failed: Invalid API key provided'
      );
    });
  });

  describe('run - search operation', () => {
    it('should execute basic search with query parameters', async () => {
      const mockData = {
        query: 'open source AI',
        results: [
          { title: 'ToolJet', url: 'https://tooljet.com', content: 'Low code platform' },
        ],
        response_time: 0.15,
      };

      const mockPost = jest.fn().mockResolvedValue({ data: mockData });
      (mockedAxios.create as jest.Mock).mockReturnValue({ post: mockPost } as any);

      const result = await plugin.run(
        mockSourceOptions,
        {
          operation: 'search',
          query: 'open source AI',
          max_results: 5,
          search_depth: 'basic',
        },
        'ds-123'
      );

      expect(result.status).toEqual('ok');
      expect(result.data).toEqual(mockData);
      expect(mockPost).toHaveBeenCalledWith('/search', expect.objectContaining({
        query: 'open source AI',
        max_results: 5,
        search_depth: 'basic',
      }));
    });

    it('should parse domain filter strings properly', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { results: [] } });
      (mockedAxios.create as jest.Mock).mockReturnValue({ post: mockPost } as any);

      await plugin.run(
        mockSourceOptions,
        {
          operation: 'search',
          query: 'test',
          include_domains: 'github.com, docs.tooljet.com',
          exclude_domains: 'spam.com',
        },
        'ds-123'
      );

      expect(mockPost).toHaveBeenCalledWith('/search', expect.objectContaining({
        include_domains: ['github.com', 'docs.tooljet.com'],
        exclude_domains: ['spam.com'],
      }));
    });
  });

  describe('run - qna_search operation', () => {
    it('should return concise answer and citations', async () => {
      const mockData = {
        query: 'What is ToolJet?',
        answer: 'ToolJet is an open-source low-code platform.',
        results: [{ title: 'Overview', url: 'https://tooljet.com', content: 'Docs' }],
        response_time: 0.22,
      };

      const mockPost = jest.fn().mockResolvedValue({ data: mockData });
      (mockedAxios.create as jest.Mock).mockReturnValue({ post: mockPost } as any);

      const result = await plugin.run(
        mockSourceOptions,
        {
          operation: 'qna_search',
          query: 'What is ToolJet?',
        },
        'ds-123'
      );

      expect(result.status).toEqual('ok');
      expect(result.data).toEqual(expect.objectContaining({
        answer: 'ToolJet is an open-source low-code platform.',
        query: 'What is ToolJet?',
      }));
    });
  });

  describe('run - extract operation', () => {
    it('should extract content from provided URLs', async () => {
      const mockData = {
        results: [
          { url: 'https://example.com', raw_content: '<html>Example</html>' },
        ],
      };

      const mockPost = jest.fn().mockResolvedValue({ data: mockData });
      (mockedAxios.create as jest.Mock).mockReturnValue({ post: mockPost } as any);

      const result = await plugin.run(
        mockSourceOptions,
        {
          operation: 'extract',
          urls: 'https://example.com',
        },
        'ds-123'
      );

      expect(result.status).toEqual('ok');
      expect(result.data).toEqual(mockData);
      expect(mockPost).toHaveBeenCalledWith('/extract', expect.objectContaining({
        urls: ['https://example.com'],
      }));
    });

    it('should throw error when URLs are missing', async () => {
      await expect(
        plugin.run(
          mockSourceOptions,
          {
            operation: 'extract',
            urls: '',
          },
          'ds-123'
        )
      ).rejects.toThrow();
    });
  });
});
