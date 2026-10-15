// A query result is parsed off the main thread; the value (or error) is the one handleResponse gives.
const encode = (value) => new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value)).buffer;
const okResponse = (body) => ({
  ok: true,
  headers: { get: () => null },
  arrayBuffer: () => Promise.resolve(encode(body)),
});

// A Worker running the real worker function in this process, a message per task like a real one.
class FakeWorker {
  constructor() {
    const { jsonWorker } = require('../transport');
    this.messages = 0;
    this.scope = {
      postMessage: (data) => {
        this.messages += 1;
        setTimeout(() => this.onmessage?.({ data }), 0);
      },
    };
    jsonWorker(this.scope);
  }
  postMessage(data) {
    setTimeout(() => this.scope.onmessage({ data }), 0);
  }
}

const load = () => {
  let module;
  jest.isolateModules(() => {
    module = require('../transport');
  });
  return module;
};

beforeEach(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:worker');
  global.Worker = undefined;
});

describe('readJsonResponse', () => {
  test('an error status goes to handleResponse unchanged', async () => {
    const { readJsonResponse } = load();
    const fallback = jest.fn(() => Promise.resolve('handled'));
    const response = { ok: false };
    await expect(readJsonResponse(response, fallback)).resolves.toBe('handled');
    expect(fallback).toHaveBeenCalledWith(response);
  });

  test('a small body is parsed at once; an empty one is "" as before', async () => {
    const { readJsonResponse } = load();
    await expect(readJsonResponse(okResponse({ status: 'ok', data: [1] }))).resolves.toEqual({
      status: 'ok',
      data: [1],
    });
    await expect(readJsonResponse(okResponse(''))).resolves.toBe('');
  });

  test('a large body is parsed in the worker, its rows arriving in chunks', async () => {
    let worker;
    global.Worker = class extends FakeWorker {
      constructor() {
        super();
        worker = this;
      }
    };
    const { readJsonResponse, OFF_THREAD_BYTES, ROWS_PER_MESSAGE } = load();
    const rows = Array.from({ length: ROWS_PER_MESSAGE * 3 + 5 }, (_, i) => ({ id: i, title: `row ${i}` }));
    const body = { status: 'ok', data: rows, metadata: { request: {} } };
    expect(encode(body).byteLength).toBeGreaterThan(OFF_THREAD_BYTES);
    await expect(readJsonResponse(okResponse(body))).resolves.toEqual(body);
    expect(worker.messages).toBe(1 + 4 + 1); // the rest of the body, 4 chunks of rows, done
  });

  test('without a worker, invalid JSON fails as JSON.parse does', async () => {
    const { parseJsonOffThread } = load();
    const big = '{"data": [' + '1,'.repeat(400000);
    await expect(parseJsonOffThread(encode(big))).rejects.toThrow(SyntaxError);
  });
});
