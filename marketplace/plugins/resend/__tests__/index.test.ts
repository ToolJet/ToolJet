import ResendService from '../lib/index';
import { QueryError } from '@tooljet-marketplace/common';

describe('ResendService', () => {
  let service: ResendService;

  beforeEach(() => {
    service = new ResendService();
    jest.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should throw QueryError if apiKey is missing', async () => {
      await expect(service.testConnection({ apiKey: '' })).rejects.toThrow(
        QueryError,
      );
    });

    it('should return { status: "ok" } when connection succeeds', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: [] }),
      });
      global.fetch = mockFetch as any;

      const result = await service.testConnection({ apiKey: 're_123456789' });
      expect(result).toEqual({ status: 'ok' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/domains',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer re_123456789',
          }),
        }),
      );
    });

    it('should throw QueryError when API returns unauthorized 401', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'API key is invalid' }),
      });
      global.fetch = mockFetch as any;

      await expect(
        service.testConnection({ apiKey: 'invalid_key' }),
      ).rejects.toThrow(QueryError);
    });
  });

  describe('run operation', () => {
    it('should throw QueryError if apiKey is missing', async () => {
      await expect(
        service.run({ apiKey: '' }, { operation: 'send_email' }),
      ).rejects.toThrow(QueryError);
    });

    it('should send email successfully', async () => {
      const mockResponse = { id: 'email_123' };
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => mockResponse,
      });
      global.fetch = mockFetch as any;

      const result = await service.run(
        { apiKey: 're_123' },
        {
          operation: 'send_email',
          from: 'Acme <onboarding@resend.dev>',
          to: 'delivered@resend.dev',
          subject: 'Hello World',
          html: '<p>Hi</p>',
        },
      );

      expect(result).toEqual({ status: 'ok', data: mockResponse });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            from: 'Acme <onboarding@resend.dev>',
            to: ['delivered@resend.dev'],
            subject: 'Hello World',
            html: '<p>Hi</p>',
          }),
        }),
      );
    });

    it('should retrieve email by id', async () => {
      const mockResponse = {
        id: 'email_123',
        from: 'test@example.com',
        to: ['user@example.com'],
      };
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => mockResponse,
      });
      global.fetch = mockFetch as any;

      const result = await service.run(
        { apiKey: 're_123' },
        {
          operation: 'get_email',
          email_id: 'email_123',
        },
      );

      expect(result).toEqual({ status: 'ok', data: mockResponse });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails/email_123',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should throw QueryError for unsupported operations', async () => {
      await expect(
        service.run({ apiKey: 're_123' }, { operation: 'invalid_op' }),
      ).rejects.toThrow(QueryError);
    });
  });
});
