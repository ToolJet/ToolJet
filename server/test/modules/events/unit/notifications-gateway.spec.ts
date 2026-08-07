/// <reference types="jest" />
import { NotificationsGateway } from '@modules/events/notifications.gateway';

/** @group events */
describe('NotificationsGateway — redis-message relay', () => {
  type Ctor = ConstructorParameters<typeof NotificationsGateway>;
  const sessionUtilService = {} as unknown as Ctor[0];
  const redisService = {} as unknown as Ctor[1];

  // relay is private; reach it via a typed cast without exposing test-only surface.
  type WithRelay = { relay(raw: string): void; server: { clients: Set<unknown> } };

  const makeClient = (userId: string, readyState = 1 /* OPEN */) => ({ userId, readyState, send: jest.fn() });

  let gateway: NotificationsGateway;
  let asRelay: WithRelay;

  beforeEach(() => {
    gateway = new NotificationsGateway(sessionUtilService, redisService);
    asRelay = gateway as unknown as WithRelay;
  });

  it('sends only to open sockets whose userId matches the target', () => {
    const target = makeClient('u1');
    const other = makeClient('u2');
    const closed = makeClient('u1', 3 /* CLOSED */);
    asRelay.server = { clients: new Set([target, other, closed]) };

    asRelay.relay(JSON.stringify({ userId: 'u1', notification: { recipientId: 'r1', title: 'x' } }));

    expect(target.send).toHaveBeenCalledTimes(1);
    const frame = JSON.parse(target.send.mock.calls[0][0]);
    expect(frame).toMatchObject({ event: 'notification', data: { recipientId: 'r1' } });
    expect(other.send).not.toHaveBeenCalled();
    expect(closed.send).not.toHaveBeenCalled();
  });

  it('passes the toast flag through to the ws frame, defaulting to false', () => {
    const client = makeClient('u1');
    asRelay.server = { clients: new Set([client]) };

    asRelay.relay(JSON.stringify({ userId: 'u1', toast: true, notification: { recipientId: 'r1' } }));
    asRelay.relay(JSON.stringify({ userId: 'u1', notification: { recipientId: 'r2' } }));

    expect(JSON.parse(client.send.mock.calls[0][0]).toast).toBe(true);
    expect(JSON.parse(client.send.mock.calls[1][0]).toast).toBe(false);
  });

  it('ignores malformed frames and messages without a userId', () => {
    const client = makeClient('u1');
    asRelay.server = { clients: new Set([client]) };

    expect(() => asRelay.relay('not-json')).not.toThrow();
    asRelay.relay(JSON.stringify({ notification: { recipientId: 'r1' } })); // no userId
    expect(client.send).not.toHaveBeenCalled();
  });
});
