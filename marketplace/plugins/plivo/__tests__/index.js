'use strict';

jest.mock('plivo', () => ({
  Client: jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn() },
    calls: { create: jest.fn() },
  })),
}));

const plivo = require('plivo');
const PlivoService = require('../lib').default;

describe('plivo', () => {
  let service;
  let clientInstance;

  beforeEach(() => {
    service = new PlivoService();
    clientInstance = new plivo.Client('auth_id', 'auth_token');
    jest.spyOn(service, 'getClient').mockReturnValue(clientInstance);
  });

  describe('send_sms', () => {
    it('sends an sms with from, to, body', async () => {
      clientInstance.messages.create.mockResolvedValue({ message: 'queued' });

      const result = await service.run(
        { authId: 'id', authToken: 'token' },
        { operation: 'send_sms', from: '+1000', to: '+2000', body: 'hello' }
      );

      expect(clientInstance.messages.create).toHaveBeenCalledWith('+1000', '+2000', 'hello');
      expect(result.status).toBe('ok');
      expect(result.data).toEqual({ message: 'queued' });
    });

    it('throws if body is missing', async () => {
      await expect(
        service.run({ authId: 'id', authToken: 'token' }, { operation: 'send_sms', from: '+1000', to: '+2000' })
      ).rejects.toThrow();
    });
  });

  describe('make_call', () => {
    it('makes a call with default POST answer method', async () => {
      clientInstance.calls.create.mockResolvedValue({ message: 'call fired' });

      const result = await service.run(
        { authId: 'id', authToken: 'token' },
        { operation: 'make_call', from: '+1000', to: '+2000', answerUrl: 'https://x.com/answer' }
      );

      expect(clientInstance.calls.create).toHaveBeenCalledWith(
        '+1000',
        '+2000',
        'https://x.com/answer',
        { answerMethod: 'POST' }
      );
      expect(result.status).toBe('ok');
      expect(result.data).toEqual({ message: 'call fired' });
    });

    it('respects an explicit GET answer method', async () => {
      clientInstance.calls.create.mockResolvedValue({ message: 'call fired' });

      await service.run(
        { authId: 'id', authToken: 'token' },
        { operation: 'make_call', from: '+1000', to: '+2000', answerUrl: 'https://x.com/answer', answerMethod: 'GET' }
      );

      expect(clientInstance.calls.create).toHaveBeenCalledWith(
        '+1000',
        '+2000',
        'https://x.com/answer',
        { answerMethod: 'GET' }
      );
    });

    it('rejects an invalid answer method', async () => {
      await expect(
        service.run(
          { authId: 'id', authToken: 'token' },
          { operation: 'make_call', from: '+1000', to: '+2000', answerUrl: 'https://x.com/answer', answerMethod: 'DELETE' }
        )
      ).rejects.toThrow();
    });

    it('throws if answerUrl is missing', async () => {
      await expect(
        service.run({ authId: 'id', authToken: 'token' }, { operation: 'make_call', from: '+1000', to: '+2000' })
      ).rejects.toThrow();
    });
  });
});