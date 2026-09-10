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
      timeout: jest.fn(() => socket),
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
    const query = jest.fn();
    (dbTransactionWrap as jest.Mock).mockImplementation((fn) => fn({ update, query }));
    const user = { id: 'builder-a', organizationId: 'workspace-a' };
    expect(await util.cancelGeneration('inventory-chat', 'old-run', user)).toEqual({ cancelling: false });
    expect(query).not.toHaveBeenCalled();
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

  it('publishes the authorized cancellation in the same transaction as the saved flag', async () => {
    const update = jest.fn().mockResolvedValue({ affected: 1 });
    const query = jest.fn().mockResolvedValue([]);
    (dbTransactionWrap as jest.Mock).mockImplementation((fn) => fn({ update, query }));
    expect(
      await util.cancelGeneration('inventory-chat', 'current-run', { id: 'builder-a', organizationId: 'workspace-a' })
    ).toEqual({ cancelling: true });
    expect(query).toHaveBeenCalledWith('SELECT pg_notify($1, $2)', ['tooljet_ai_cancel', 'current-run']);
    expect(update.mock.invocationCallOrder[0]).toBeLessThan(query.mock.invocationCallOrder[0]);
    expect(dbTransactionWrap).toHaveBeenCalledTimes(1);
  });

  it('still persists cancellation if the notification transaction fails', async () => {
    const update = jest.fn().mockResolvedValue({ affected: 1 });
    const query = jest.fn().mockRejectedValue(new Error('Synthetic notification failure'));
    (dbTransactionWrap as jest.Mock).mockImplementation((fn) => fn({ update, query }));
    expect(
      await util.cancelGeneration('inventory-chat', 'current-run', { id: 'builder-a', organizationId: 'workspace-a' })
    ).toEqual({ cancelling: true });
    expect(dbTransactionWrap).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenCalledTimes(1);
  });

  const start = async (util, shouldCancel, subscribeCancellation?) => {
    const pending = util.callAgent(
      'deep-agent',
      {
        thread_id: 'inventory-chat',
        app_id: 'inventory-app',
        user_id: 'builder-a',
      },
      { id: 'builder-a' },
      'workspace-a',
      { shouldCancel, subscribeCancellation }
    );
    // Settle the credential/routing promises without advancing the cancellation poll.
    for (let i = 0; i < 20; i++) await Promise.resolve();
    events.connect();
    events.connected({ session_id: 'synthetic-session', known_thread: false });
    return { pending };
  };

  it('does not dispatch a build cancelled during connection setup', async () => {
    const { pending } = await start(util, jest.fn().mockResolvedValue(true));
    await events['ingest-complete']({ data: { message: 'ingested' } });
    expect(socket.emit).not.toHaveBeenCalled();
    expect((await pending)[1]).toMatchObject({
      cancelled: true,
      reload: false,
    });
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
    await events.response({
      request_id: 'earlier-run',
      data: { cancelled: true },
    });
    expect(socket.disconnect).not.toHaveBeenCalled();
    shouldCancel.mockResolvedValue(true);
    await jest.advanceTimersByTimeAsync(10000);
    expect(socket.emit).toHaveBeenCalledWith('cancel', { request_id: runId }, expect.any(Function));
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
    events.disconnect('transport close');
    await events.connect_error(new Error('Synthetic reconnect failure'));
    expect(socket.disconnect).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(10000);
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(0);
    socket.connected = true;
    events.connect();
    // A transport connection alone must not send cancellation before thread reattachment.
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(0);
    events.connected({ session_id: 'synthetic-session', known_thread: true });
    shouldCancel.mockClear();
    await jest.advanceTimersByTimeAsync(10000);
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
    await jest.advanceTimersByTimeAsync(10000);
    await events.response({ data: { intent: 'modify' } });
    resolveCheck(true);
    await Promise.resolve();
    expect((await pending)[1].cancelled).toBeUndefined();
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('checks once per ten seconds as recovery and unsubscribes after detecting a pushed flag', async () => {
    let notify;
    const unsubscribe = jest.fn();
    const shouldCancel = jest.fn().mockResolvedValue(false);
    const { pending } = await start(util, shouldCancel, (check) => {
      notify = check;
      return unsubscribe;
    });
    await events['ingest-complete']({ data: { message: 'ingested' } });
    shouldCancel.mockClear();
    await jest.advanceTimersByTimeAsync(9999);
    expect(shouldCancel).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(shouldCancel).toHaveBeenCalledTimes(1);
    shouldCancel.mockResolvedValue(true);
    notify();
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    shouldCancel.mockClear();
    await jest.advanceTimersByTimeAsync(10000);
    expect(shouldCancel).not.toHaveBeenCalled();
    await events.response({ data: { cancelled: true } });
    await pending;
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('rechecks a notification that arrives during an older saved-state read', async () => {
    let notify;
    let resolveOldRead;
    const shouldCancel = jest.fn().mockResolvedValue(false);
    const { pending } = await start(util, shouldCancel, (check) => {
      notify = check;
      return jest.fn();
    });
    await events['ingest-complete']({ data: { message: 'ingested' } });
    shouldCancel
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOldRead = resolve;
          })
      )
      .mockResolvedValue(true);
    notify();
    notify();
    resolveOldRead(false);
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(1);
    await events.response({ data: { cancelled: true } });
    await pending;
  });

  it('unsubscribes on normal completion and ignores a late push', async () => {
    let notify;
    const unsubscribe = jest.fn();
    const shouldCancel = jest.fn().mockResolvedValue(false);
    const { pending } = await start(util, shouldCancel, (check) => {
      notify = check;
      return unsubscribe;
    });
    await events.response({ data: { intent: 'modify' } });
    await pending;
    shouldCancel.mockClear();
    notify();
    expect(shouldCancel).not.toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });
});
