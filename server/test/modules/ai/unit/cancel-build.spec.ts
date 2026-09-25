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

  it.each([0, 1])('only marks an authorized run and reports the affected count (%i)', async (affected) => {
    const update = jest.fn().mockResolvedValue({ affected });
    (dbTransactionWrap as jest.Mock).mockImplementation((fn) => fn({ update }));
    const user = { id: 'builder-a', organizationId: 'workspace-a' };
    expect(await util.cancelGeneration('inventory-chat', 'old-run', user)).toEqual({ cancelling: !!affected });
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

  const start = async (util, shouldCancel, ownEvents = events) => {
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
    ownEvents.connect();
    ownEvents.connected({ session_id: 'synthetic-session', known_thread: false });
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
    await jest.advanceTimersByTimeAsync(3000);
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
    await jest.advanceTimersByTimeAsync(3000);
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(0);
    socket.connected = true;
    events.connect();
    // A transport connection alone must not send cancellation before thread reattachment.
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(0);
    events.connected({ session_id: 'synthetic-session', known_thread: true });
    shouldCancel.mockClear();
    await jest.advanceTimersByTimeAsync(3000);
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
    await jest.advanceTimersByTimeAsync(3000);
    await events.response({ data: { intent: 'modify' } });
    resolveCheck(true);
    await Promise.resolve();
    expect((await pending)[1].cancelled).toBeUndefined();
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('polls every three seconds, stops DB reads after detection, and leaves delivery retries to the ACK helper', async () => {
    const shouldCancel = jest.fn().mockResolvedValue(false);
    const { pending } = await start(util, shouldCancel);
    await events['ingest-complete']({ data: { message: 'ingested' } });
    shouldCancel.mockClear();
    await jest.advanceTimersByTimeAsync(1000);
    expect(shouldCancel).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1999);
    expect(shouldCancel).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(shouldCancel).toHaveBeenCalledTimes(1);
    // Stop arrives just after the last false read; detection waits for the next tick.
    shouldCancel.mockResolvedValue(true);
    await jest.advanceTimersByTimeAsync(2999);
    expect(shouldCancel).toHaveBeenCalledTimes(1);
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(0);
    await jest.advanceTimersByTimeAsync(1);
    const attempts = () => socket.emit.mock.calls.filter(([event]) => event === 'cancel');
    expect(attempts()).toHaveLength(1);
    shouldCancel.mockClear();
    // A rejected ACK retries without another database read.
    attempts()[0][2](null, { accepted: false });
    await jest.advanceTimersByTimeAsync(1000);
    expect(attempts()).toHaveLength(2);
    const requestId = attempts()[1][1].request_id;
    attempts()[1][2](null, { accepted: true, request_id: requestId });
    await jest.advanceTimersByTimeAsync(9000);
    expect(shouldCancel).not.toHaveBeenCalled();
    expect(attempts()).toHaveLength(2);
    expect(socket.disconnect).not.toHaveBeenCalled();
    await events.response({ request_id: requestId, data: { cancelled: true } });
    expect((await pending)[1].cancelled).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('checks saved cancellation on reattachment when no read is in flight', async () => {
    const shouldCancel = jest.fn().mockResolvedValue(false);
    const { pending } = await start(util, shouldCancel);
    await events['ingest-complete']({ data: { message: 'ingested' } });
    socket.connected = false;
    socket.active = true;
    events.disconnect('transport close');
    shouldCancel.mockResolvedValue(true);
    socket.connected = true;
    events.connect();
    events.connected({ session_id: 'synthetic-session', known_thread: true });
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(1);
    await events.response({ data: { cancelled: true } });
    await pending;
    expect(jest.getTimerCount()).toBe(0);
  });
  it('keeps one accepted cancellation quiet during tool cleanup without affecting another active run', async () => {
    const firstCheck = jest.fn().mockResolvedValue(false);
    const first = await start(util, firstCheck);
    await events['ingest-complete']({ data: { message: 'ingested' } });
    const secondEvents: Record<string, (...args: any[]) => any> = {};
    const secondSocket = {
      connected: true,
      active: false,
      emit: jest.fn(),
      timeout: jest.fn(() => secondSocket),
      on: jest.fn((event, callback) => {
        secondEvents[event] = callback;
      }),
      io: { on: jest.fn() },
      disconnect: jest.fn(() => {
        secondSocket.connected = false;
        secondEvents.disconnect?.('io client disconnect');
      }),
    };
    (io as jest.Mock).mockReturnValueOnce(secondSocket);
    const secondCheck = jest.fn().mockResolvedValue(false);
    const second = await start(util, secondCheck, secondEvents);
    await secondEvents['ingest-complete']({ data: { message: 'ingested' } });
    const firstId = socket.emit.mock.calls.find(([event]) => event === 'request')[1].request_id;
    const secondId = secondSocket.emit.mock.calls.find(([event]) => event === 'request')[1].request_id;
    expect(firstId).not.toBe(secondId);
    firstCheck.mockResolvedValue(true);
    await jest.advanceTimersByTimeAsync(3000);
    const cancel = socket.emit.mock.calls.find(([event]) => event === 'cancel');
    expect(cancel[1]).toEqual({ request_id: firstId });
    cancel[2](null, { accepted: true, request_id: firstId });
    firstCheck.mockClear();
    secondCheck.mockClear();
    // The terminal response is withheld for the full tool grace period after acceptance.
    await jest.advanceTimersByTimeAsync(30000);
    expect(firstCheck).not.toHaveBeenCalled();
    expect(secondCheck).toHaveBeenCalledTimes(10);
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(1);
    expect(secondSocket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(0);
    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(secondSocket.disconnect).not.toHaveBeenCalled();
    await secondEvents.response({ request_id: secondId, data: { intent: 'modify' } });
    expect((await second.pending)[1].cancelled).toBeUndefined();
    await events.response({ request_id: firstId, data: { cancelled: true } });
    expect((await first.pending)[1].cancelled).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('detects cancellation at the next three-second tick if reattachment races an older read', async () => {
    const shouldCancel = jest.fn().mockResolvedValue(false);
    const { pending } = await start(util, shouldCancel);
    await events['ingest-complete']({ data: { message: 'ingested' } });
    let resolveOldRead;
    shouldCancel.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOldRead = resolve;
        })
    );
    await jest.advanceTimersByTimeAsync(3000);
    socket.connected = false;
    socket.active = true;
    events.disconnect('transport close');
    shouldCancel.mockResolvedValue(true);
    socket.connected = true;
    events.connect();
    events.connected({ session_id: 'synthetic-session', known_thread: true });
    resolveOldRead(false);
    for (let i = 0; i < 5; i++) await Promise.resolve();
    await jest.advanceTimersByTimeAsync(2999);
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(0);
    await jest.advanceTimersByTimeAsync(1);
    expect(socket.emit.mock.calls.filter(([event]) => event === 'cancel')).toHaveLength(1);
    await events.response({ data: { cancelled: true } });
    await pending;
    expect(jest.getTimerCount()).toBe(0);
  });
});
