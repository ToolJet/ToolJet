/** @group working */
jest.mock('@helpers/database.helper', () => ({ dbTransactionWrap: jest.fn() }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));

import { AiUtilService } from '@ee/ai/util.service';
import { AiActiveRun } from '@entities/ai_active_run.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { io } from 'socket.io-client';

describe('AI build cancellation', () => {
  let util: any;
  let socket: any;
  let events: Record<string, (...args: any[]) => any>;

  beforeEach(() => {
    jest.useFakeTimers();
    events = {};
    socket = {
      connected: true,
      active: false,
      emit: jest.fn(),
      on: jest.fn((event, callback) => {
        events[event] = callback;
      }),
      io: { on: jest.fn() },
      disconnect: jest.fn(() => {
        socket.connected = false;
        events.disconnect?.('io client disconnect');
      }),
    };
    (io as jest.Mock).mockReturnValue(socket);
    util = Object.create(AiUtilService.prototype);
    Object.assign(util, {
      licenseTermsService: {
        getLicenseTerms: jest.fn().mockResolvedValue({ ai: { apiKey: 'synthetic' }, metadata: {} }),
      },
      resolveAgentRouting: jest.fn().mockResolvedValue({ provider: 'anthropic', headers: {} }),
      getAiServerBaseUrl: jest.fn().mockResolvedValue('http://unused.invalid'),
      personalAccessTokensService: {
        getOrCreateServicePat: jest.fn().mockResolvedValue({}),
        createSessionFromPat: jest.fn().mockResolvedValue({}),
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('only marks the requested run belonging to the user and workspace', async () => {
    const update = jest.fn().mockResolvedValue({ affected: 0 });
    (dbTransactionWrap as jest.Mock).mockImplementation((fn) => fn({ update }));
    const user = { id: 'builder-a', organizationId: 'workspace-a' };
    expect(await util.cancelGeneration('inventory-chat', 'old-run', user)).toEqual({ cancelling: false });
    expect(update).toHaveBeenCalledWith(
      AiActiveRun,
      {
        id: 'old-run',
        conversationId: 'inventory-chat',
        userId: 'builder-a',
        organizationId: 'workspace-a',
      },
      { cancelRequested: true }
    );
  });

  const start = async (util, shouldCancel) => {
    const pending = util.callAgent(
      'deep-agent',
      {
        thread_id: 'inventory-chat',
        app_id: 'inventory-app',
        user_id: 'builder-a',
      },
      { id: 'builder-a' },
      'workspace-a',
      { shouldCancel }
    );
    // Settle the credential/routing promises without advancing the cancellation poll.
    for (let i = 0; i < 20; i++) await Promise.resolve();
    return { pending };
  };

  it('does not dispatch a build cancelled during connection setup', async () => {
    const { pending } = await start(util, jest.fn().mockResolvedValue(true));
    await events['ingest-complete']({ data: { message: 'ingested' } });
    expect(socket.emit).not.toHaveBeenCalled();
    expect((await pending)[1]).toMatchObject({ cancelled: true, reload: false });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('cleans up cancellation polling when the initial connection fails', async () => {
    const { pending } = await start(util, jest.fn().mockResolvedValue(false));
    await events.connect_error(new Error('Synthetic connection failure'));
    expect((await pending)[0].message).toBe('Synthetic connection failure');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('uses the owning socket and waits for the agent to drain before disconnecting', async () => {
    const shouldCancel = jest.fn().mockResolvedValue(false);
    const { pending } = await start(util, shouldCancel);
    await events['ingest-complete']({ data: { message: 'ingested' } });
    const runId = socket.emit.mock.calls.find(([event]) => event === 'request')[1].request_id;
    await events.response({ request_id: 'earlier-run', data: { cancelled: true } });
    expect(socket.disconnect).not.toHaveBeenCalled();
    shouldCancel.mockResolvedValue(true);
    await jest.advanceTimersByTimeAsync(1000);
    expect(socket.emit).toHaveBeenCalledWith('cancel', { request_id: runId });
    expect(socket.disconnect).not.toHaveBeenCalled();
    await events.response({ request_id: runId, data: { cancelled: true } });
    expect((await pending)[1].cancelled).toBe(true);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('keeps a cancellation pending across socket reconnects', async () => {
    const shouldCancel = jest.fn().mockResolvedValue(false);
    const { pending } = await start(util, shouldCancel);
    await events['ingest-complete']({ data: { message: 'ingested' } });
    shouldCancel.mockResolvedValue(true);
    socket.connected = false;
    socket.active = true;
    events.connect();
    events.disconnect('transport close');
    await events.connect_error(new Error('Synthetic reconnect failure'));
    expect(socket.disconnect).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1000);
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(0);
    socket.connected = true;
    events.connect();
    shouldCancel.mockClear();
    await jest.advanceTimersByTimeAsync(1000);
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(1);
    expect(shouldCancel).not.toHaveBeenCalled();
    await events.response({ data: { cancelled: true } });
    await pending;
    expect(jest.getTimerCount()).toBe(0);
  });

  it('lets a completed run win over an in-flight cancellation check', async () => {
    let resolveCheck;
    const shouldCancel = jest.fn().mockResolvedValue(false);
    const { pending } = await start(util, shouldCancel);
    await events['ingest-complete']({ data: { message: 'ingested' } });
    shouldCancel.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCheck = resolve;
        })
    );
    await jest.advanceTimersByTimeAsync(1000);
    await events.response({ data: { intent: 'modify' } });
    resolveCheck(true);
    await Promise.resolve();
    expect((await pending)[1].cancelled).toBeUndefined();
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });
});
