import { refreshSsoInfo } from '@/_helpers/refreshSsoInfo';
import { markAcyclic } from './cycles';

// Bodies smaller than this are parsed right away; a worker only pays off for large ones.
export const OFF_THREAD_BYTES = 512 * 1024;
// Rows of a large `data` array come back from the worker this many per message: each message is turned back into
// objects on the main thread, so it must stay small.
export const ROWS_PER_MESSAGE = 10000;

// The worker (run in `scope`, its global): decodes and parses a body, then sends a large `data` array back in chunks.
export function jsonWorker(scope) {
  scope.onmessage = ({ data: { id, buffer, rowsPerMessage } }) => {
    try {
      const text = new TextDecoder().decode(buffer);
      const value = text && JSON.parse(text);
      const rows = value && Array.isArray(value.data) ? value.data : null;
      if (!rows || rows.length <= rowsPerMessage) {
        scope.postMessage({ id, value });
        return;
      }
      scope.postMessage({ id, head: { ...value, data: null } });
      for (let i = 0; i < rows.length; i += rowsPerMessage) {
        scope.postMessage({ id, rows: rows.slice(i, i + rowsPerMessage) });
      }
      scope.postMessage({ id, done: true });
    } catch (error) {
      scope.postMessage({ id, failed: true });
    }
  };
}

let worker = null;
let workerBroken = false;
let nextId = 0;
const pending = new Map(); // id → { resolve, reject, head, rows }

const startWorker = () => {
  if (worker || workerBroken) return worker;
  try {
    const url = URL.createObjectURL(new Blob([`(${jsonWorker.toString()})(self)`], { type: 'text/javascript' }));
    worker = new Worker(url);
    worker.onmessage = ({ data }) => {
      const request = pending.get(data.id);
      if (!request) return;
      if (data.failed) return request.fail();
      if ('value' in data) return request.done(data.value);
      if (data.head) {
        request.head = data.head;
        request.rows = [];
        return;
      }
      if (data.rows) {
        for (let i = 0; i < data.rows.length; i++) request.rows.push(data.rows[i]);
        return;
      }
      if (data.done) request.done({ ...request.head, data: request.rows });
    };
    // A worker that can't load (eg. a content security policy without blob: workers) leaves the main thread to it.
    worker.onerror = () => {
      workerBroken = true;
      worker = null;
      pending.forEach((request) => request.fail());
    };
  } catch {
    workerBroken = true;
    worker = null;
  }
  return worker;
};

// What handleResponse makes of a body: '' when empty, else its JSON (throwing as JSON.parse throws).
const parseHere = (buffer) => {
  const text = new TextDecoder().decode(buffer);
  return text && JSON.parse(text);
};

/**
 * Parses a large JSON body off the main thread: what `JSON.parse(text)` gives, delivered without one long task — a
 * large `data` array arrives in chunks, assembled between frames. Falls back to parsing here if no worker can run.
 */
export function parseJsonOffThread(buffer) {
  if (buffer.byteLength < OFF_THREAD_BYTES || !startWorker()) {
    try {
      return Promise.resolve(parseHere(buffer));
    } catch (error) {
      return Promise.reject(error);
    }
  }
  const id = (nextId += 1);
  return new Promise((resolve, reject) => {
    // The buffer moves to the worker; a copy stays in case it fails and the body has to be parsed here.
    const copy = buffer.slice(0);
    pending.set(id, {
      done: (value) => {
        pending.delete(id);
        resolve(value);
      },
      fail: () => {
        pending.delete(id);
        try {
          resolve(parseHere(copy));
        } catch (error) {
          reject(error);
        }
      },
    });
    worker.postMessage({ id, buffer, rowsPerMessage: ROWS_PER_MESSAGE }, [buffer]);
  });
}

/**
 * handleResponse for a successful response whose body may be large (a query result): the same value, parsed off the
 * main thread. Anything else (an error status) goes to `fallback` — handleResponse — unchanged.
 */
export function readJsonResponse(response, fallback) {
  if (!response.ok) return fallback(response);
  if (response.headers.get('X-SSO-Info-Updated') === 'true') refreshSsoInfo();
  // Parsed JSON can't contain itself: a script returning it isn't walked for cycles again.
  return response
    .arrayBuffer()
    .then(parseJsonOffThread)
    .then((value) => {
      markAcyclic(value);
      if (value && typeof value === 'object') markAcyclic(value.data);
      return value;
    });
}
