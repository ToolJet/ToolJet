/** @group working */
jest.mock('pg', () => ({ Client: jest.fn() }));
import { EventEmitter } from 'events';
import { Client } from 'pg';
import {
  AI_CANCELLATION_CHANNEL,
  cancellationConnectionOptions,
  CancellationNotifications,
} from '@ee/ai/cancellation-notifications';

const settle = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

describe('cross-replica cancellation notifications', () => {
  let clients: any[];
  let listener: CancellationNotifications;
  beforeEach(() => {
    jest.useFakeTimers();
    clients = [];
    (Client as unknown as jest.Mock).mockImplementation(() => {
      const client = Object.assign(new EventEmitter(), {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue({}),
        end: jest.fn().mockResolvedValue(undefined),
      });
      clients.push(client);
      return client;
    });
    listener = new CancellationNotifications(() => ({ host: 'unused.invalid' }));
  });
  afterEach(() => {
    listener.close();
    expect(jest.getTimerCount()).toBe(0);
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('shares one dedicated connection and routes notifications only to the matching run', async () => {
    const first = jest.fn(),
      second = jest.fn();
    const offFirst = listener.subscribe('roster-run', first);
    const offSecond = listener.subscribe('calendar-run', second);
    await settle();
    expect(clients).toHaveLength(1);
    expect(clients[0].query).toHaveBeenCalledWith(`LISTEN ${AI_CANCELLATION_CHANNEL}`);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    clients[0].emit('notification', { channel: AI_CANCELLATION_CHANNEL, payload: 'roster-run' });
    clients[0].emit('notification', { channel: 'unrelated', payload: 'calendar-run' });
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(1);
    offFirst();
    expect(clients[0].end).not.toHaveBeenCalled();
    offSecond();
    expect(clients[0].end).toHaveBeenCalledTimes(1);
  });

  it('reads saved state after LISTEN commits and when a subscriber joins an existing listener', async () => {
    let finishListen;
    const first = jest.fn();
    listener.subscribe('roster-run', first);
    clients[0].query.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishListen = resolve;
        })
    );
    await settle();
    expect(first).not.toHaveBeenCalled();
    finishListen({});
    await settle();
    expect(first).toHaveBeenCalledTimes(1);
    const second = jest.fn();
    listener.subscribe('calendar-run', second);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('does not unsubscribe a newer run watcher when an old cleanup is repeated', async () => {
    const oldOff = listener.subscribe('roster-run', jest.fn());
    await settle();
    oldOff();
    const check = jest.fn();
    listener.subscribe('roster-run', check);
    await settle();
    oldOff();
    expect(clients[1].end).not.toHaveBeenCalled();
    clients[1].emit('notification', { channel: AI_CANCELLATION_CHANNEL, payload: 'roster-run' });
    expect(check).toHaveBeenCalledTimes(2);
  });

  it('recovers a lost connection and rereads every watched run after relistening', async () => {
    const check = jest.fn();
    listener.subscribe('roster-run', check);
    await settle();
    clients[0].emit('error', new Error('Synthetic listener disconnect'));
    clients[0].emit('end');
    expect(clients[0].end).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);
    await jest.advanceTimersByTimeAsync(1000);
    expect(clients).toHaveLength(2);
    expect(check).toHaveBeenCalledTimes(2);
    clients[0].emit('notification', { channel: AI_CANCELLATION_CHANNEL, payload: 'roster-run' });
    expect(check).toHaveBeenCalledTimes(2);
    clients[1].emit('notification', { channel: AI_CANCELLATION_CHANNEL, payload: 'roster-run' });
    expect(check).toHaveBeenCalledTimes(3);
  });

  it('backs off failed LISTEN attempts without preventing subscription or leaking timers', async () => {
    listener.subscribe('roster-run', jest.fn());
    clients[0].query.mockRejectedValue(new Error('Synthetic LISTEN rejection'));
    await settle();
    expect(clients[0].end).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);
    await jest.advanceTimersByTimeAsync(999);
    expect(clients).toHaveLength(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(clients).toHaveLength(2);
    listener.close();
    clients[1].emit('end');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('closes an in-flight connection when the last subscriber leaves and can start anew', async () => {
    let finishConnect;
    (Client as unknown as jest.Mock).mockImplementationOnce(() => {
      const client = Object.assign(new EventEmitter(), {
        connect: jest.fn(
          () =>
            new Promise((resolve) => {
              finishConnect = resolve;
            })
        ),
        query: jest.fn(),
        end: jest.fn().mockResolvedValue(undefined),
      });
      clients.push(client);
      return client;
    });
    const check = jest.fn();
    const off = listener.subscribe('roster-run', check);
    off();
    expect(clients[0].end).toHaveBeenCalledTimes(1);
    listener.subscribe('calendar-run', check);
    finishConnect();
    await settle();
    expect(clients[0].query).not.toHaveBeenCalled();
    expect(clients[1].query).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('retries connection configuration failures and stops retries when idle', async () => {
    listener.close();
    listener = new CancellationNotifications(() => {
      throw new Error('Synthetic unavailable database');
    });
    const off = listener.subscribe('roster-run', jest.fn());
    await settle();
    expect(jest.getTimerCount()).toBe(1);
    off();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('uses the primary database connection and TLS settings with bounded connection/query waits', () => {
    const ssl = { rejectUnauthorized: true, ca: 'synthetic-ca' };
    expect(
      cancellationConnectionOptions({
        type: 'postgres',
        ssl,
        extra: { keepAliveInitialDelayMillis: 1000 },
        replication: {
          master: {
            host: 'primary.invalid',
            port: 5440,
            username: 'synthetic-user',
            password: 'synthetic-password',
            database: 'synthetic-db',
          },
          slaves: [],
        },
      })
    ).toMatchObject({
      host: 'primary.invalid',
      port: 5440,
      user: 'synthetic-user',
      database: 'synthetic-db',
      ssl,
      connectionTimeoutMillis: 5000,
      query_timeout: 5000,
      keepAlive: true,
    });
  });
});
