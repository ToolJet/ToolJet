/** @group working */
import { CancellationDelivery } from '@ee/ai/cancellation-delivery';

describe('cancellation delivery', () => {
  let socket: any;
  let delivery: CancellationDelivery;
  const ack = (accepted = true, request_id = 'roster-run') => ({
    accepted,
    request_id,
  });
  const reply = (socket, ...args) => socket.emit.mock.calls.at(-1)[2](...args);

  beforeEach(() => {
    jest.useFakeTimers();
    socket = {
      connected: true,
      emit: jest.fn(),
      timeout: jest.fn(() => socket),
    };
    delivery = new CancellationDelivery(socket, 'roster-run');
  });
  afterEach(() => {
    delivery.close();
    expect(jest.getTimerCount()).toBe(0);
    jest.useRealTimers();
  });

  it('waits for reattachment, suppresses duplicates and stops after accepted acknowledgement', () => {
    delivery.request();
    expect(socket.emit).not.toHaveBeenCalled();
    delivery.attached();
    delivery.request();
    expect(socket.timeout).toHaveBeenCalledWith(2000);
    expect(socket.emit).toHaveBeenCalledTimes(1);
    reply(socket, null, ack());
    delivery.request();
    jest.advanceTimersByTime(60000);
    expect(socket.emit).toHaveBeenCalledTimes(1);
  });

  it('retries missing, rejected and mismatched acknowledgements with capped backoff', () => {
    delivery.attached();
    delivery.request();
    for (const [delay, error, response] of [
      [1000, new Error('ack timeout'), undefined],
      [2000, null, ack(false)],
      [4000, null, ack(true, 'different-run')],
      [8000, new Error('ack timeout'), undefined],
      [8000, new Error('ack timeout'), undefined],
    ] as const) {
      const attempts = socket.emit.mock.calls.length;
      reply(socket, error, response);
      delivery.request();
      jest.advanceTimersByTime(delay - 1);
      expect(socket.emit).toHaveBeenCalledTimes(attempts);
      jest.advanceTimersByTime(1);
      expect(socket.emit).toHaveBeenCalledTimes(attempts + 1);
    }
    reply(socket, null, ack());
    expect(jest.getTimerCount()).toBe(0);
  });

  it('reconciles after reconnect and ignores an acknowledgement from the old connection', () => {
    delivery.attached();
    delivery.request();
    const staleReply = socket.emit.mock.calls[0][2];
    delivery.disconnected();
    staleReply(null, ack());
    delivery.request();
    expect(socket.emit).toHaveBeenCalledTimes(1);
    delivery.attached();
    expect(socket.emit).toHaveBeenCalledTimes(2);
    reply(socket, null, ack());
    delivery.disconnected();
    delivery.attached();
    expect(socket.emit).toHaveBeenCalledTimes(3);
  });

  it('clears retries and ignores late acknowledgements on completion', () => {
    delivery.attached();
    delivery.request();
    reply(socket, new Error('ack timeout'));
    delivery.close();
    reply(socket, new Error('late ack timeout'));
    jest.advanceTimersByTime(60000);
    expect(socket.emit).toHaveBeenCalledTimes(1);
  });
});
