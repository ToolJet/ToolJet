'use strict';

const GrokService = require('../dist/index.js').default;

describe('GrokService', () => {
  let grokService;
  let mockOpenAIInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    grokService = new GrokService();

    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
      images: {
        generate: jest.fn(),
      },
      models: {
        list: jest.fn(),
        retrieve: jest.fn(),
      },
    };
  });

  describe('getConnection', () => {
    it('should throw an error if apiKey is missing or empty', async () => {
      await expect(grokService.getConnection({ apiKey: '' })).rejects.toThrow('API Key is required to connect to Grok');
    });

    it('should initialize OpenAI client with correct baseURL and apiKey', async () => {
      const client = await grokService.getConnection({ apiKey: 'xai-test-key-12345' });
      expect(client).toBeDefined();
      expect(client.baseURL).toBe('https://api.x.ai/v1');
      expect(client.apiKey).toBe('xai-test-key-12345');
    });
  });

  describe('testConnection', () => {
    it('should return ok when models can be retrieved', async () => {
      mockOpenAIInstance.models.list.mockResolvedValueOnce({
        data: [{ id: 'grok-2-latest' }],
      });
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      const result = await grokService.testConnection({ apiKey: 'xai-valid-key' });
      expect(result).toEqual({
        status: 'ok',
        message: 'Connection established successfully',
      });
      expect(mockOpenAIInstance.models.list).toHaveBeenCalledTimes(1);
    });

    it('should return failed when apiKey is invalid (401)', async () => {
      const error = new Error('Incorrect API key provided');
      error.status = 401;
      mockOpenAIInstance.models.list.mockRejectedValueOnce(error);
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      const result = await grokService.testConnection({ apiKey: 'xai-invalid-key' });
      expect(result.status).toBe('failed');
      expect(result.message).toContain('Authentication failed: Invalid xAI API Key');
      expect(result.message).not.toContain('xai-invalid-key');
    });

    it('should return failed without leaking credentials on network failure', async () => {
      const error = new Error('Connection error with xai-secret-key-99999');
      error.code = 'ENOTFOUND';
      mockOpenAIInstance.models.list.mockRejectedValueOnce(error);
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      const result = await grokService.testConnection({ apiKey: 'xai-secret-key-99999' });
      expect(result.status).toBe('failed');
      expect(result.message).not.toContain('xai-secret-key-99999');
      expect(result.message).toContain('Connection failed: Unable to reach the xAI Grok API');
    });
  });

  describe('invokeMethod (Dynamic model fetching)', () => {
    it('should fetch and format models for dynamic selector', async () => {
      mockOpenAIInstance.models.list.mockResolvedValueOnce({
        data: [
          { id: 'grok-2-latest', object: 'model' },
          { id: 'grok-2-vision-1212', object: 'model' },
        ],
      });
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      const response = await grokService.invokeMethod('listModels', {}, { apiKey: 'xai-valid-key' });

      expect(response).toEqual({
        data: [
          { label: 'grok-2-latest', value: 'grok-2-latest' },
          { label: 'grok-2-vision-1212', value: 'grok-2-vision-1212' },
        ],
      });
    });

    it('should throw QueryError if method is unsupported', async () => {
      await expect(grokService.invokeMethod('unknownMethod', {}, { apiKey: 'xai-valid-key' })).rejects.toThrow();
    });
  });

  describe('run - Chat Completion', () => {
    it('should execute chat completion with prompt and default model', async () => {
      const mockCompletion = {
        id: 'chatcmpl-123',
        choices: [{ message: { role: 'assistant', content: 'Hello there!' } }],
      };
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce(mockCompletion);
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      const result = await grokService.run(
        { apiKey: 'xai-valid-key' },
        {
          operation: 'chat',
          prompt: 'Hi',
        }
      );

      expect(result.status).toBe('ok');
      expect(result.data).toEqual(mockCompletion);
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'grok-2-latest',
          messages: [{ role: 'user', content: 'Hi' }],
        })
      );
    });

    it('should include system prompt, temperature, max_tokens, and custom_model', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({ id: 'chatcmpl-456' });
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      await grokService.run(
        { apiKey: 'xai-valid-key' },
        {
          operation: 'chat',
          custom_model: 'grok-beta',
          system_prompt: 'You are Grok.',
          prompt: 'Tell me a joke',
          temperature: 0.8,
          max_tokens: 500,
          top_p: 0.95,
        }
      );

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: 'You are Grok.' },
          { role: 'user', content: 'Tell me a joke' },
        ],
        temperature: 0.8,
        max_tokens: 500,
        top_p: 0.95,
      });
    });

    it('should handle JSON string messages history', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({ id: 'chatcmpl-789' });
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      const history = JSON.stringify([
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'First reply' },
      ]);

      await grokService.run(
        { apiKey: 'xai-valid-key' },
        {
          operation: 'chat',
          messages: history,
        }
      );

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'user', content: 'First message' },
            { role: 'assistant', content: 'First reply' },
          ],
        })
      );
    });

    it('should throw error if both prompt and messages are missing', async () => {
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      await expect(
        grokService.run(
          { apiKey: 'xai-valid-key' },
          {
            operation: 'chat',
          }
        )
      ).rejects.toThrow();
    });
  });

  describe('run - Chat Vision', () => {
    it('should execute vision chat completion with image input', async () => {
      const mockCompletion = { id: 'chatcmpl-vision-1' };
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce(mockCompletion);
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      const result = await grokService.run(
        { apiKey: 'xai-valid-key' },
        {
          operation: 'chat_vision',
          model: 'grok-2-vision-1212',
          prompt: 'What is in this image?',
          image_url: 'https://example.com/cat.jpg',
          detail: 'high',
          system_prompt: 'Be concise.',
        }
      );

      expect(result.status).toBe('ok');
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'grok-2-vision-1212',
          messages: [
            { role: 'system', content: 'Be concise.' },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'What is in this image?' },
                {
                  type: 'image_url',
                  image_url: {
                    url: 'https://example.com/cat.jpg',
                    detail: 'high',
                  },
                },
              ],
            },
          ],
        })
      );
    });

    it('should throw error if image_url is missing', async () => {
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      await expect(
        grokService.run(
          { apiKey: 'xai-valid-key' },
          {
            operation: 'chat_vision',
            prompt: 'Describe image',
          }
        )
      ).rejects.toThrow();
    });

    it('should throw error if prompt is missing in chat_vision', async () => {
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      await expect(
        grokService.run(
          { apiKey: 'xai-valid-key' },
          {
            operation: 'chat_vision',
            image_url: 'https://example.com/photo.jpg',
          }
        )
      ).rejects.toThrow();
    });
  });

  describe('run - Image Generation', () => {
    it('should generate image with valid prompt', async () => {
      const mockImageResponse = {
        data: [{ url: 'https://imgen.x.ai/result.png' }],
      };
      mockOpenAIInstance.images.generate.mockResolvedValueOnce(mockImageResponse);
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      const result = await grokService.run(
        { apiKey: 'xai-valid-key' },
        {
          operation: 'image_generation',
          prompt: 'A futuristic electric car on Mars',
          model: 'grok-2-image',
          n: 1,
          response_format: 'url',
        }
      );

      expect(result.status).toBe('ok');
      expect(result.data).toEqual(mockImageResponse);
      expect(mockOpenAIInstance.images.generate).toHaveBeenCalledWith({
        prompt: 'A futuristic electric car on Mars',
        model: 'grok-2-image',
        n: 1,
        response_format: 'url',
      });
    });

    it('should throw error if prompt is missing for image generation', async () => {
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      await expect(
        grokService.run(
          { apiKey: 'xai-valid-key' },
          {
            operation: 'image_generation',
          }
        )
      ).rejects.toThrow();
    });
  });

  describe('run - Models operations', () => {
    it('should list models', async () => {
      const mockModels = [{ id: 'grok-2-latest' }, { id: 'grok-2-vision-1212' }];
      mockOpenAIInstance.models.list.mockResolvedValueOnce({ data: mockModels });
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      const result = await grokService.run(
        { apiKey: 'xai-valid-key' },
        {
          operation: 'list_models',
        }
      );

      expect(result.status).toBe('ok');
      expect(result.data).toEqual(mockModels);
    });

    it('should get model metadata by model_id', async () => {
      const mockModel = { id: 'grok-2-latest', owned_by: 'xai' };
      mockOpenAIInstance.models.retrieve.mockResolvedValueOnce(mockModel);
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      const result = await grokService.run(
        { apiKey: 'xai-valid-key' },
        {
          operation: 'get_model',
          model_id: 'grok-2-latest',
        }
      );

      expect(result.status).toBe('ok');
      expect(result.data).toEqual(mockModel);
      expect(mockOpenAIInstance.models.retrieve).toHaveBeenCalledWith('grok-2-latest');
    });

    it('should throw error if model_id is missing for get_model', async () => {
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      await expect(
        grokService.run(
          { apiKey: 'xai-valid-key' },
          {
            operation: 'get_model',
          }
        )
      ).rejects.toThrow();
    });
  });

  describe('Error handling & security', () => {
    it('should handle 404 Model Not Found without leaking apiKey', async () => {
      const error = new Error('Model grok-unknown not found. Authorization: Bearer xai-secret-12345');
      error.status = 404;
      mockOpenAIInstance.models.retrieve.mockRejectedValueOnce(error);
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      await expect(
        grokService.run(
          { apiKey: 'xai-secret-12345' },
          {
            operation: 'get_model',
            model_id: 'grok-unknown',
          }
        )
      ).rejects.toThrow();

      try {
        await grokService.run(
          { apiKey: 'xai-secret-12345' },
          {
            operation: 'get_model',
            model_id: 'grok-unknown',
          }
        );
      } catch (err) {
        expect(err.description).toContain('Resource or model not found');
        expect(err.description).not.toContain('xai-secret-12345');
        expect(err.description).toContain('[REDACTED]');
      }
    });

    it('should handle 429 Rate Limit error', async () => {
      const error = new Error('Rate limit exceeded');
      error.status = 429;
      mockOpenAIInstance.chat.completions.create.mockRejectedValueOnce(error);
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      try {
        await grokService.run(
          { apiKey: 'xai-test-key' },
          {
            operation: 'chat',
            prompt: 'test',
          }
        );
      } catch (err) {
        expect(err.description).toContain('Rate limit exceeded');
      }
    });

    it('should handle 500 internal server error', async () => {
      const error = new Error('Internal server error');
      error.status = 500;
      mockOpenAIInstance.chat.completions.create.mockRejectedValueOnce(error);
      jest.spyOn(grokService, 'getConnection').mockResolvedValue(mockOpenAIInstance);

      try {
        await grokService.run(
          { apiKey: 'xai-test-key' },
          {
            operation: 'chat',
            prompt: 'test',
          }
        );
      } catch (err) {
        expect(err.description).toContain('xAI server error (500)');
      }
    });
  });
});
