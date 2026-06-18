/**
 * Unit tests for frontend-metrics.service.js (Phase 1 — errors only)
 *
 * Exports under test: flush, initFrontendMetrics, teardownFrontendMetrics,
 *   recordJsError, recordWidgetError, recordQueryError.
 */

jest.mock('config', () => ({ apiUrl: 'http://localhost:3000/api' }), { virtual: true });

jest.mock('@/_services', () => ({
  authenticationService: {
    currentSessionValue: { current_organization_id: 'ws-test-123' },
  },
}));

jest.mock('@/_helpers/auth-header', () => ({
  authHeader: () => ({ 'tj-workspace-id': 'ws-test-123' }),
}));

import {
  flush,
  initFrontendMetrics,
  teardownFrontendMetrics,
  recordJsError,
  recordWidgetError,
  recordQueryError,
} from '../frontend-metrics.service';

function enableOtel() {
  window.public_config = { ENABLE_OTEL: 'true' };
}
function disableOtel() {
  window.public_config = {};
}
function getLastBatch() {
  const last = fetch.mock.calls[fetch.mock.calls.length - 1];
  return JSON.parse(last[1].body);
}
function getMockAuth() {
  return jest.requireMock('@/_services').authenticationService;
}

beforeEach(() => {
  enableOtel();
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  jest.useFakeTimers();
  // Reset location to a neutral path before each test
  history.pushState({}, '', '/');
});

afterEach(() => {
  disableOtel();
  teardownFrontendMetrics();
  jest.clearAllMocks();
  jest.useRealTimers();
  getMockAuth().currentSessionValue = { current_organization_id: 'ws-test-123' };
});

// ── isEnabled ────────────────────────────────────────────────────────────────

describe('isEnabled()', () => {
  test('does nothing when ENABLE_OTEL is absent', () => {
    disableOtel();
    recordJsError('oops');
    flush();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('does nothing when ENABLE_OTEL is not "true"', () => {
    window.public_config = { ENABLE_OTEL: 'false' };
    recordJsError('oops');
    flush();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('queues and sends when ENABLE_OTEL is "true"', () => {
    recordJsError('oops');
    flush();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

// ── flush ────────────────────────────────────────────────────────────────────

describe('flush()', () => {
  test('does nothing when queue is empty', () => {
    flush();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('defers when workspace ID is null — events stay for next flush', () => {
    getMockAuth().currentSessionValue = { current_organization_id: null };
    recordJsError('oops');
    flush();
    expect(fetch).not.toHaveBeenCalled();

    getMockAuth().currentSessionValue = { current_organization_id: 'ws-test-123' };
    flush();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('POSTs to /api/otel/frontend-metrics', () => {
    recordJsError('oops');
    flush();
    expect(fetch.mock.calls[0][0]).toBe('http://localhost:3000/api/otel/frontend-metrics');
  });

  test('sends with keepalive:true and credentials:include', () => {
    recordJsError('oops');
    flush();
    const [, opts] = fetch.mock.calls[0];
    expect(opts.keepalive).toBe(true);
    expect(opts.credentials).toBe('include');
  });

  test('drains queue — second flush sends nothing', () => {
    recordJsError('oops');
    flush();
    flush();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('auto-flushes when queue reaches 50 events', () => {
    for (let i = 0; i < 49; i++) recordJsError('err');
    expect(fetch).not.toHaveBeenCalled();
    recordJsError('err'); // 50th
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(getLastBatch().events).toHaveLength(50);
  });

  test('periodic timer fires every 30 s', () => {
    initFrontendMetrics();
    recordJsError('deferred');
    jest.advanceTimersByTime(30_000);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

// ── initFrontendMetrics ──────────────────────────────────────────────────────

describe('initFrontendMetrics()', () => {
  test('is idempotent — second call does not register a second interval', () => {
    const spy = jest.spyOn(global, 'setInterval');
    initFrontendMetrics();
    initFrontendMetrics();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('does not initialize when OTEL is disabled', () => {
    disableOtel();
    const spy = jest.spyOn(global, 'setInterval');
    initFrontendMetrics();
    expect(spy).not.toHaveBeenCalled();
  });
});

// ── teardownFrontendMetrics ──────────────────────────────────────────────────

describe('teardownFrontendMetrics()', () => {
  test('allows re-initialization after teardown', () => {
    initFrontendMetrics();
    teardownFrontendMetrics();
    enableOtel();
    const spy = jest.spyOn(global, 'setInterval');
    initFrontendMetrics();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('clears the flush interval', () => {
    const clearSpy = jest.spyOn(global, 'clearInterval');
    initFrontendMetrics();
    disableOtel();
    teardownFrontendMetrics();
    expect(clearSpy).toHaveBeenCalled();
  });
});

// ── recordJsError ────────────────────────────────────────────────────────────

describe('recordJsError()', () => {
  test('queues a js_error event with app_context and error_message', () => {
    history.pushState({}, '', '/my-workspace/home');
    recordJsError('Something broke', 'at Component.render');
    flush();
    const event = getLastBatch().events[0];
    expect(event.type).toBe('js_error');
    expect(event.attrs.error_message).toBe('Something broke');
    expect(event.attrs.app_context).toBe('platform');
  });

  test('app_context is "released_app" on /applications/* paths', () => {
    history.pushState({}, '', '/applications/my-app/view');
    recordJsError('crash');
    flush();
    expect(getLastBatch().events[0].attrs.app_context).toBe('released_app');
  });

  test('app_context is "released_app" on /embed-apps/* paths', () => {
    history.pushState({}, '', '/embed-apps/my-app');
    recordJsError('crash');
    flush();
    expect(getLastBatch().events[0].attrs.app_context).toBe('released_app');
  });

  test('truncates error_message to 200 chars and component_stack to 500', () => {
    recordJsError('e'.repeat(300), 's'.repeat(700));
    flush();
    const { attrs } = getLastBatch().events[0];
    expect(attrs.error_message).toHaveLength(200);
    expect(attrs.component_stack).toHaveLength(500);
  });
});

// ── recordWidgetError ────────────────────────────────────────────────────────

describe('recordWidgetError()', () => {
  test('queues a widget_error event with widget_type', () => {
    recordWidgetError('Table', 'render failed');
    flush();
    const event = getLastBatch().events[0];
    expect(event.type).toBe('widget_error');
    expect(event.attrs.widget_type).toBe('Table');
    expect(event.attrs.error_message).toBe('render failed');
  });

  test('uses empty string when no message provided', () => {
    recordWidgetError('Button');
    flush();
    expect(getLastBatch().events[0].attrs.error_message).toBe('');
  });

  test('truncates error_message to 200 chars', () => {
    recordWidgetError('Table', 'x'.repeat(300));
    flush();
    expect(getLastBatch().events[0].attrs.error_message).toHaveLength(200);
  });
});

// ── recordQueryError ─────────────────────────────────────────────────────────

describe('recordQueryError()', () => {
  test('uses the provided appId when given', () => {
    recordQueryError('q-123', 'app-456', 'server_error');
    flush();
    const { attrs } = getLastBatch().events[0];
    expect(attrs.type).toBeUndefined(); // type is on the event, not attrs
    expect(attrs.query_id).toBe('q-123');
    expect(attrs.app_id).toBe('app-456');
    expect(attrs.error_type).toBe('server_error');
  });

  test('falls back to URL-derived ID when appId is null — editor path', () => {
    history.pushState({}, '', '/apps/uuid-from-editor/edit');
    recordQueryError('q-1', null, 'network_error');
    flush();
    expect(getLastBatch().events[0].attrs.app_id).toBe('uuid-from-editor');
  });

  test('falls back to URL-derived slug when appId is null — released app', () => {
    history.pushState({}, '', '/applications/my-app-slug/view');
    recordQueryError('q-2', null, 'server_error');
    flush();
    expect(getLastBatch().events[0].attrs.app_id).toBe('my-app-slug');
  });

  test('falls back to null when appId is null and path has no app segment', () => {
    history.pushState({}, '', '/my-workspace/home');
    recordQueryError('q-3', null, 'server_error');
    flush();
    expect(getLastBatch().events[0].attrs.app_id).toBeNull();
  });

  test('queues event type as query_error', () => {
    recordQueryError('q-1', 'app-1', 'server_error');
    flush();
    expect(getLastBatch().events[0].type).toBe('query_error');
  });
});

// ── Global error handlers ────────────────────────────────────────────────────

describe('global error handlers (window.error / unhandledrejection)', () => {
  beforeEach(() => {
    initFrontendMetrics();
  });

  test('window error event queues a js_error', () => {
    window.dispatchEvent(
      Object.assign(new Event('error'), {
        message: 'script error',
        filename: window.location.origin + '/bundle.js',
        lineno: 42,
      })
    );
    flush();
    const event = getLastBatch().events[0];
    expect(event.type).toBe('js_error');
    expect(event.attrs.error_message).toBe('script error');
  });

  test('skips errors from browser extensions (foreign filename)', () => {
    window.dispatchEvent(
      Object.assign(new Event('error'), {
        message: 'ext error',
        filename: 'chrome-extension://foobar/content.js',
        lineno: 1,
      })
    );
    flush();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('unhandledrejection queues a js_error with rejection message', () => {
    window.dispatchEvent(
      Object.assign(new Event('unhandledrejection'), {
        reason: new Error('promise blew up'),
      })
    );
    flush();
    const event = getLastBatch().events[0];
    expect(event.type).toBe('js_error');
    expect(event.attrs.error_message).toBe('promise blew up');
    expect(event.attrs.component_stack).toBe('unhandled_promise_rejection');
  });

  test('unhandledrejection with non-Error reason stringifies it', () => {
    window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'bare string rejection' }));
    flush();
    expect(getLastBatch().events[0].attrs.error_message).toBe('bare string rejection');
  });

  test('handlers are removed after teardown', () => {
    teardownFrontendMetrics();
    window.dispatchEvent(
      Object.assign(new Event('error'), {
        message: 'post-teardown',
        filename: window.location.origin + '/app.js',
        lineno: 1,
      })
    );
    flush();
    expect(fetch).not.toHaveBeenCalled();
  });
});
