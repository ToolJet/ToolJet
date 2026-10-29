import Cloudflare_ai_search from '../lib';
import got from 'got';

jest.mock('got', () => ({ __esModule: true, default: jest.fn() }));

const mockGot = got as unknown as jest.Mock;

const sourceOptions = {
  api_token: 'synthetic-test-token',
  account_id: 'test-account-id',
};

const baseUrl = 'https://api.cloudflare.com/client/v4/accounts/test-account-id/ai-search/namespaces/default';

describe('Cloudflare AI Search', () => {
  let plugin: Cloudflare_ai_search;

  beforeEach(() => {
    jest.clearAllMocks();
    plugin = new Cloudflare_ai_search();

    mockGot.mockResolvedValue({
      body: {
        success: true,
        result: { id: 'test-instance' },
      },
    });
  });

  test('rejects missing API credentials', async () => {
    await expect(
      plugin.run(
        { api_token: '', account_id: 'test-account-id' },
        { operation: 'list_instances' },
        'test-data-source'
      )
    ).rejects.toMatchObject({
      message: 'Connection could not be established',
      description: 'API token and Account ID are required',
    });

    expect(mockGot).not.toHaveBeenCalled();
  });

  test('lists instances using the authenticated API', async () => {
    mockGot.mockResolvedValueOnce({
      body: {
        success: true,
        result: [{ id: 'instance-1' }],
      },
    });

    const result = await plugin.run(sourceOptions, { operation: 'list_instances' }, 'test-data-source');

    expect(mockGot).toHaveBeenCalledWith(
      `${baseUrl}/instances`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer synthetic-test-token',
        }),
        responseType: 'json',
      })
    );

    expect(result).toMatchObject({
      status: 'ok',
      data: { result: [{ id: 'instance-1' }] },
    });
  });

  test('gets an instance by ID', async () => {
    await plugin.run(
      sourceOptions,
      { operation: 'get_instance', instance_id: 'instance-123' },
      'test-data-source'
    );

    expect(mockGot).toHaveBeenCalledWith(
      `${baseUrl}/instances/instance-123`,
      expect.objectContaining({ method: 'GET' })
    );
  });

  test('searches an instance and passes metadata filters', async () => {
    const filters = JSON.stringify({ category: 'documentation' });

    await plugin.run(
      sourceOptions,
      {
        operation: 'search_instance',
        instance_id: 'instance-123',
        query: 'How does authentication work?',
        filters,
      },
      'test-data-source'
    );

    expect(mockGot).toHaveBeenCalledWith(
      `${baseUrl}/instances/instance-123/search`,
      expect.objectContaining({
        method: 'POST',
        json: {
          messages: [
            {
              role: 'user',
              content: 'How does authentication work?',
            },
          ],
          ai_search_options: {
            retrieval: {
              filters: { category: 'documentation' },
            },
          },
        },
      })
    );
  });

  test('rejects invalid JSON metadata filters', async () => {
    await expect(
      plugin.run(
        sourceOptions,
        {
          operation: 'search_instance',
          instance_id: 'instance-123',
          query: 'Find documentation',
          filters: '{invalid-json',
        },
        'test-data-source'
      )
    ).rejects.toMatchObject({
      message: 'Query could not be completed',
      description: 'Metadata filters must be valid JSON',
    });

    expect(mockGot).not.toHaveBeenCalled();
  });

  test('sends chat completion requests', async () => {
    await plugin.run(
      sourceOptions,
      {
        operation: 'chat_completions',
        instance_id: 'instance-123',
        query: 'Summarize the documentation',
      },
      'test-data-source'
    );

    expect(mockGot).toHaveBeenCalledWith(
      `${baseUrl}/instances/instance-123/chat/completions`,
      expect.objectContaining({
        method: 'POST',
        json: {
          messages: [
            {
              role: 'user',
              content: 'Summarize the documentation',
            },
          ],
        },
      })
    );
  });

  test('surfaces Cloudflare API errors', async () => {
    mockGot.mockRejectedValueOnce({
      message: 'Request failed',
      response: {
        statusCode: 403,
        body: {
          success: false,
          errors: [{ message: 'Permission denied' }],
        },
      },
    });

    await expect(
      plugin.run(sourceOptions, { operation: 'list_instances' }, 'test-data-source')
    ).rejects.toMatchObject({
      message: 'Query could not be completed',
      description: 'Permission denied',
      data: { statusCode: 403 },
    });
  });

  test('reports a successful connection', async () => {
    await expect(plugin.testConnection(sourceOptions)).resolves.toEqual({
      status: 'ok',
    });

    expect(mockGot).toHaveBeenCalledWith(`${baseUrl}/instances`, expect.objectContaining({ method: 'GET' }));
  });

  test('reports a failed connection when authentication fails', async () => {
    mockGot.mockRejectedValueOnce(new Error('Unauthorized'));

    await expect(plugin.testConnection(sourceOptions)).resolves.toMatchObject({
      status: 'failed',
    });
  });
});
