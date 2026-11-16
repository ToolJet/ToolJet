import { aiService, attachmentStreamFetch } from '../ai.service';
import { fetchEventSource } from '@microsoft/fetch-event-source';

jest.mock('config', () => ({ apiUrl: 'https://app.example.test/api' }), { virtual: true });
jest.mock('@/_helpers', () => ({
  authHeader: () => ({ 'Content-Type': 'application/json', 'x-test-auth': 'synthetic-session' }),
  handleResponse: jest.fn(),
}));
jest.mock('@microsoft/fetch-event-source', () => ({ fetchEventSource: jest.fn() }));

// jest-fixed-jsdom preserves Node FormData; use its matching File implementation.
const browserFile = global.File;
beforeAll(() => {
  global.File = require('buffer').File;
});
afterAll(() => {
  global.File = browserFile;
});

beforeEach(() => {
  fetchEventSource.mockImplementation(async (_url, options) => {
    await options.onopen({ ok: true });
    options.onclose();
  });
});

test('sends original files and the AI message together with a browser-generated multipart boundary', async () => {
  const original = new File(['rack,count\nBirch,6'], 'racks.csv', { type: 'text/csv' });
  const payload = { conversationId: 'owned-chat', content: 'Summarize the rack counts.' };
  await aiService.sendMessage({ ...payload, attachments: [original] }, jest.fn());
  const [url, options] = fetchEventSource.mock.calls[0];
  expect(url).toBe('https://app.example.test/api/ai/conversation/message');
  expect(options.headers['Content-Type']).toBeUndefined();
  expect(options.headers['x-test-auth']).toBe('synthetic-session');
  expect(options.body).toBeInstanceOf(FormData);
  expect(JSON.parse(options.body.get('payload'))).toEqual(payload);
  expect(options.body.getAll('files')).toHaveLength(1);
  expect(options.body.get('files').name).toBe(original.name);
  expect(options.body.get('files').size).toBe(original.size);
  expect(await options.body.get('files').text()).toBe('rack,count\nBirch,6');
});

test('keeps text-only requests as JSON and preserves earlier attachment references', async () => {
  await aiService.sendMessage(
    {
      conversationId: 'owned-chat',
      content: 'Explain the earlier file.',
      attachments: [{ id: 'stored-original', name: 'racks.csv' }],
    },
    jest.fn()
  );
  const options = fetchEventSource.mock.calls[0][1];
  expect(options.headers['Content-Type']).toBe('application/json');
  expect(JSON.parse(options.body)).toEqual({
    conversationId: 'owned-chat',
    content: 'Explain the earlier file.',
    attachmentIds: ['stored-original'],
  });
});

test('does not send originals to the docs-only endpoint', async () => {
  await expect(
    aiService.sendMessage(
      { content: 'Read the inventory.', attachments: [new File(['bins,4'], 'bins.csv')] },
      jest.fn(),
      true
    )
  ).rejects.toThrow('builder chats');
  expect(fetchEventSource).not.toHaveBeenCalled();
});

test('a progress-making upload can exceed two minutes, and silence aborts it', async () => {
  jest.useFakeTimers();
  const originalXHR = global.XMLHttpRequest;
  let xhr;
  global.XMLHttpRequest = class {
    constructor() {
      xhr = this;
      this.upload = {};
    }
    open() {}
    setRequestHeader() {}
    send() {}
    abort() {
      this.onabort();
    }
  };
  fetchEventSource.mockImplementation((_url, options) => {
    // Match the library's behavior: external abort resolves the SSE promise.
    options.fetch(_url, options).catch(() => {});
    return new Promise((resolve) => options.signal.addEventListener('abort', resolve));
  });
  try {
    const pending = aiService.sendMessage(
      {
        content: 'Review the seed list.',
        attachments: [new File(['seed'], 'seeds.txt')],
      },
      jest.fn()
    );
    // eslint-disable-next-line jest/valid-expect -- awaited below, after the timers that trigger the rejection
    const rejection = expect(pending).rejects.toMatchObject({ stalled: true });
    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(60000);
      xhr.upload.onprogress({ loaded: i + 1 });
    }
    expect(fetchEventSource.mock.calls[0][1].signal.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(120000);
    await rejection;
  } finally {
    global.XMLHttpRequest = originalXHR;
    jest.useRealTimers();
  }
});

test('multipart response streams preserve split unicode and status headers', async () => {
  const originalXHR = global.XMLHttpRequest;
  let xhr;
  global.XMLHttpRequest = class {
    constructor() {
      xhr = this;
      this.upload = {};
    }
    open() {}
    setRequestHeader() {}
    send() {}
    abort() {
      this.onabort();
    }
    getAllResponseHeaders() {
      return 'content-type: text/event-stream';
    }
  };
  try {
    const response = attachmentStreamFetch(
      '/synthetic',
      { method: 'POST', headers: {}, signal: new AbortController().signal },
      jest.fn()
    );
    Object.assign(xhr, {
      readyState: 2,
      status: 200,
      statusText: 'OK',
      responseText: 'data: "\ud83c',
    });
    xhr.onreadystatechange();
    const result = await response;
    const text = result.text();
    xhr.onprogress();
    xhr.responseText += '\udf31"\n\n';
    xhr.onload();
    expect(await text).toBe('data: "🌱"\n\n');
    expect(result.headers.get('content-type')).toBe('text/event-stream');
  } finally {
    global.XMLHttpRequest = originalXHR;
  }
});

test('ends a long attachment stream so the existing generation watcher can take over', async () => {
  const originalXHR = global.XMLHttpRequest;
  let xhr;
  global.XMLHttpRequest = class {
    constructor() {
      xhr = this;
      this.upload = {};
    }
    open() {}
    setRequestHeader() {}
    send() {}
    abort() {
      this.aborted = true;
      this.onabort();
    }
    getAllResponseHeaders() {
      return 'content-type: text/event-stream';
    }
  };
  try {
    const pending = attachmentStreamFetch(
      '/synthetic',
      {
        method: 'POST',
        headers: {},
        signal: new AbortController().signal,
      },
      jest.fn()
    );
    Object.assign(xhr, { readyState: 2, status: 200, statusText: 'OK', responseText: 'x'.repeat(9 * 1024 * 1024) });
    xhr.onreadystatechange();
    const response = await pending;
    // eslint-disable-next-line jest/valid-expect -- awaited below, after onprogress triggers the abort
    const rejected = expect(response.text()).rejects.toThrow('response buffer limit');
    xhr.onprogress();
    await rejected;
    expect(xhr.aborted).toBe(true);
  } finally {
    global.XMLHttpRequest = originalXHR;
  }
});
