import { aiService } from '../ai.service';
import { fetchEventSource } from '@microsoft/fetch-event-source';
jest.mock('config', () => ({ apiUrl: 'https://builder.example.test/api' }), {
  virtual: true,
});
jest.mock('@/_helpers', () => ({
  authHeader: () => ({ 'x-session': 'synthetic' }),
  handleResponse: jest.fn(),
}));
jest.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: jest.fn(),
}));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

// Only valid events reach subscribers and a closed stream leaves no deadline.
test('forwards ordered events, ignores malformed data and clears its deadline after closing', async () => {
  const receive = jest.fn();
  fetchEventSource.mockImplementation(async (_url, options) => {
    await options.onopen({ ok: true });
    options.onmessage({ event: 'heartbeat', data: '' });
    options.onmessage({ event: 'progress', data: 'not-json' });
    options.onmessage({ event: 'progress', data: '{"step":"layout"}' });
    options.onmessage({ event: 'complete', data: '{"done":true}' });
    options.onclose();
  });
  await expect(aiService.sendMessage({ content: 'Build an observatory schedule' }, receive)).resolves.toEqual([
    { step: 'layout' },
    { done: true },
  ]);
  expect(receive.mock.calls).toEqual([
    [{ type: 'progress', data: { step: 'layout' } }],
    [{ type: 'complete', data: { done: true } }],
  ]);
  expect(jest.getTimerCount()).toBe(0);
});

// HTTP rejection retains its status even when the response body cannot be parsed.
test.each([true, false])('propagates an HTTP rejection even when its error body is invalid (%s)', async (validJson) => {
  fetchEventSource.mockImplementation(async (_url, options) =>
    options.onopen({
      ok: false,
      status: 403,
      json: validJson
        ? async () => ({ message: 'Workspace access denied' })
        : async () => {
            throw new Error('invalid');
          },
    })
  );
  await expect(aiService.sendMessage({}, jest.fn())).rejects.toMatchObject({
    statusCode: 403,
    message: validJson ? 'Workspace access denied' : 'HTTP error! status: 403',
  });
  expect(jest.getTimerCount()).toBe(0);
});

// Heartbeats extend the deadline while silence hands control to recovery.
test('heartbeats renew the deadline and later silence hands recovery to the caller', async () => {
  let options;
  fetchEventSource.mockImplementation((_url, settings) => {
    options = settings;
    return new Promise((resolve) => settings.signal.addEventListener('abort', resolve));
  });
  const result = aiService.sendMessage({}, jest.fn()).catch((error) => error);
  await jest.advanceTimersByTimeAsync(25000);
  options.onmessage({ event: 'heartbeat', data: '' });
  await jest.advanceTimersByTimeAsync(25000);
  expect(options.signal.aborted).toBe(false);
  await jest.advanceTimersByTimeAsync(5000);
  expect(await result).toMatchObject({ stalled: true });
  expect(jest.getTimerCount()).toBe(0);
});

// A terminal stream error must not retry or leave a background timeout.
test('does not retry stream errors or leave a live timeout', async () => {
  fetchEventSource.mockImplementation(async (_url, options) => {
    expect(options.retryStrategy.next()).toBeNull();
    options.onerror('synthetic disconnect');
  });
  await expect(aiService.sendMessage({}, jest.fn())).rejects.toThrow('synthetic disconnect');
  expect(fetchEventSource).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});
