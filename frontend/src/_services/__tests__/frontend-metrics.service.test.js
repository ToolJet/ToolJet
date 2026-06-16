/**
 * Unit tests for frontend-metrics.service.js
 *
 * Tests are grouped by function. Module-level state (eventQueue, initialized,
 * flushTimer) is reset via teardownFrontendMetrics() in afterEach.
 *
 * Run: npm test -- frontend-metrics.service
 */

// ── Mocks (hoisted before imports) ────────────────────────────────────────────

jest.mock('config', () => ({ apiUrl: 'http://localhost:3000/api' }), { virtual: true });

jest.mock('@/_services', () => ({
  authenticationService: {
    currentSessionValue: { current_organization_id: 'ws-test-123' },
  },
}));

jest.mock('@/_helpers/auth-header', () => ({
  authHeader: () => ({ 'tj-workspace-id': 'ws-test-123' }),
}));

jest.mock('web-vitals', () => ({
  onLCP: jest.fn(),
  onINP: jest.fn(),
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onTTFB: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  recordMetricEvent,
  flush,
  initFrontendMetrics,
  teardownFrontendMetrics,
  recordPageView,
  recordPageLoad,
  recordAppOpen,
  recordAppLoad,
  recordQueryExec,
  recordQueryError,
  recordWidgetRender,
  recordWidgetError,
  recordJsError,
} from '../frontend-metrics.service';

import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

// ── Helpers ───────────────────────────────────────────────────────────────────

function enableOtel() {
  window.public_config = { ENABLE_OTEL: 'true' };
}

function disableOtel() {
  window.public_config = {};
}

/** Pull the events array from the last fetch call's body */
function getLastBatch() {
  const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
  return JSON.parse(lastCall[1].body);
}

function getMockAuth() {
  return jest.requireMock('@/_services').authenticationService;
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  enableOtel();
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  jest.useFakeTimers();
});

afterEach(() => {
  // Disable OTEL before teardown so the best-effort flush() inside teardown is a no-op
  disableOtel();
  teardownFrontendMetrics();
  jest.clearAllMocks();
  jest.useRealTimers();
  // Restore workspace ID after any test that nulled it out
  getMockAuth().currentSessionValue = { current_organization_id: 'ws-test-123' };
});

// ── isEnabled() — tested indirectly via recordMetricEvent ─────────────────────

describe('isEnabled()', () => {
  test('events are NOT queued when ENABLE_OTEL is absent', () => {
    disableOtel();
    recordMetricEvent('page_view', { page: 'dashboard' });
    flush();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('events are NOT queued when ENABLE_OTEL is any string other than "true"', () => {
    window.public_config = { ENABLE_OTEL: 'false' };
    recordMetricEvent('page_view', { page: 'dashboard' });
    flush();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('events are queued and sent when ENABLE_OTEL is "true"', () => {
    recordMetricEvent('page_view', { page: 'dashboard' });
    flush();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

// ── recordMetricEvent() ───────────────────────────────────────────────────────

describe('recordMetricEvent()', () => {
  test('queued event has correct type, ts, and attrs', () => {
    const before = Date.now();
    recordMetricEvent('page_view', { page: 'dashboard' });
    flush();
    const batch = getLastBatch();
    const event = batch.events[0];
    expect(event.type).toBe('page_view');
    expect(event.attrs).toEqual({ page: 'dashboard' });
    expect(event.ts).toBeGreaterThanOrEqual(before);
  });

  test('duration key is present only when provided', () => {
    recordMetricEvent('app_load', { app_id: 'app-1', mode: 'released' }, 1234);
    recordMetricEvent('app_open', { app_id: 'app-1', mode: 'edit' });
    flush();
    const { events } = getLastBatch();
    expect(events[0].duration).toBe(1234);
    expect('duration' in events[1]).toBe(false);
  });

  test('duration of 0 is recorded (cache-hit scenario)', () => {
    recordMetricEvent('app_load', { app_id: 'app-1', mode: 'released' }, 0);
    flush();
    expect(getLastBatch().events[0].duration).toBe(0);
  });

  test('auto-flushes when queue reaches 50 events', () => {
    // Push 49 events — no flush yet
    for (let i = 0; i < 49; i++) {
      recordMetricEvent('page_view', { page: 'dashboard' });
    }
    expect(fetch).not.toHaveBeenCalled();

    // 50th event triggers the flush
    recordMetricEvent('page_view', { page: 'dashboard' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(getLastBatch().events).toHaveLength(50);
  });

  test('queue is drained after auto-flush (no double-send)', () => {
    for (let i = 0; i < 50; i++) {
      recordMetricEvent('page_view', { page: 'dashboard' });
    }
    // Manual flush after auto-flush: queue should be empty, no second call
    flush();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

// ── flush() ───────────────────────────────────────────────────────────────────

describe('flush()', () => {
  test('does nothing when OTEL is disabled', () => {
    disableOtel();
    recordMetricEvent('page_view', { page: 'dashboard' }); // no-op (disabled)
    flush();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('does nothing when queue is empty', () => {
    flush();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('defers when workspace ID is null — events stay in queue for next tick', () => {
    getMockAuth().currentSessionValue = { current_organization_id: null };
    recordMetricEvent('page_view', { page: 'dashboard' });
    flush();

    // fetch should NOT have been called
    expect(fetch).not.toHaveBeenCalled();

    // Restore workspace ID — next flush should send the retained event
    getMockAuth().currentSessionValue = { current_organization_id: 'ws-test-123' };
    flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(getLastBatch().events).toHaveLength(1);
  });

  test('POSTs to the correct URL derived from config.apiUrl', () => {
    recordMetricEvent('page_view', { page: 'dashboard' });
    flush();
    expect(fetch.mock.calls[0][0]).toBe('http://localhost:3000/api/otel/frontend-metrics');
  });

  test('sends with credentials:include and keepalive:true', () => {
    recordMetricEvent('page_view', { page: 'dashboard' });
    flush();
    const [, options] = fetch.mock.calls[0];
    expect(options.credentials).toBe('include');
    expect(options.keepalive).toBe(true);
    expect(options.method).toBe('POST');
  });

  test('batch payload has collected_at and events (no workspace_id — server injects from JWT)', () => {
    recordMetricEvent('page_view', { page: 'dashboard' });
    flush();
    const batch = getLastBatch();
    expect(batch).toHaveProperty('events');
    expect(new Date(batch.collected_at).toString()).not.toBe('Invalid Date');
    expect(batch).not.toHaveProperty('workspace_id');
  });

  test('drains the queue atomically — second flush sends nothing', () => {
    recordMetricEvent('page_view', { page: 'dashboard' });
    recordMetricEvent('app_open', { app_id: 'app-1', mode: 'edit' });
    flush();
    flush(); // second flush — queue is empty
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(getLastBatch().events).toHaveLength(2);
  });

  test('periodic timer fires flush every 30 seconds', () => {
    initFrontendMetrics();
    fetch.mockClear(); // clear the initial page_view from initFrontendMetrics
    recordMetricEvent('page_view', { page: 'workflows' });

    // Advance 30 seconds
    jest.advanceTimersByTime(30_000);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

// ── getCurrentPage() — tested via initFrontendMetrics() initial page view ─────
//
// getCurrentPage() is not exported, so it's tested indirectly:
// initFrontendMetrics() immediately calls _onPopstate() = recordPageView(getCurrentPage()).
// We navigate to each path first, then call init, and check the page_view event.
//
// teardownFrontendMetrics() (in the outer afterEach) now restores history.pushState
// and removes all event listeners — no inner save/restore needed.

describe('getCurrentPage() URL mapping', () => {
  const cases = [
    ['/my-workspace/apps/my-app/page1', 'app-builder'],
    ['/my-workspace/apps/slug', 'app-builder'],
    ['/applications/xyz', 'app-viewer'],
    ['/embed-apps/xyz', 'app-viewer'],
    ['/my-workspace/workflows', 'workflows'],
    ['/my-workspace/database', 'database'],
    ['/my-workspace/workspace-settings/users', 'settings'],
    ['/my-workspace/workspace-constants', 'settings'],
    ['/my-workspace/modules', 'modules'],
    ['/my-workspace/integrations', 'integrations'],
    ['/login', 'auth'],
    ['/signup', 'auth'],
    ['/sso/google', 'auth'],
    ['/my-workspace/home', 'dashboard'],
    ['/my-workspace/', 'dashboard'],
    ['/my-workspace', 'dashboard'],
    ['/unknown/deeply/nested/path', 'other'],
  ];

  test.each(cases)('path "%s" maps to page "%s"', (path, expectedPage) => {
    history.pushState({}, '', path);
    initFrontendMetrics(); // immediately fires _onPopstate() → recordPageView(getCurrentPage())
    flush();
    const pvEvent = getLastBatch().events.find((e) => e.type === 'page_view');
    expect(pvEvent.attrs.page).toBe(expectedPage);
  });
});

// ── initFrontendMetrics() ─────────────────────────────────────────────────────

describe('initFrontendMetrics()', () => {
  test('records an initial page view on first call', () => {
    initFrontendMetrics();
    flush();
    const { events } = getLastBatch();
    expect(events.some((e) => e.type === 'page_view')).toBe(true);
  });

  test('is idempotent — second call does not register a second interval', () => {
    const spy = jest.spyOn(global, 'setInterval');
    initFrontendMetrics();
    initFrontendMetrics();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('registers all 5 web vitals callbacks', () => {
    initFrontendMetrics();
    expect(onLCP).toHaveBeenCalledTimes(1);
    expect(onINP).toHaveBeenCalledTimes(1);
    expect(onCLS).toHaveBeenCalledTimes(1);
    expect(onFCP).toHaveBeenCalledTimes(1);
    expect(onTTFB).toHaveBeenCalledTimes(1);
  });

  test('patches history.pushState to record page views on SPA navigation', () => {
    initFrontendMetrics();
    fetch.mockClear(); // ignore initial page view flush from init

    recordMetricEvent('page_view', { page: 'x' }); // ensure queue is non-empty
    window.history.pushState({}, '', '/my-workspace/home');

    flush();
    const batch = getLastBatch();
    const pvEvents = batch.events.filter((e) => e.type === 'page_view');
    // The pushState patch adds a page_view for /my-workspace/home → 'dashboard'
    const dashboardPV = pvEvents.find((e) => e.attrs.page === 'dashboard');
    expect(dashboardPV).toBeDefined();
  });

  test('does not initialize when OTEL is disabled', () => {
    disableOtel();
    const spy = jest.spyOn(global, 'setInterval');
    initFrontendMetrics();
    expect(spy).not.toHaveBeenCalled();
  });
});

// ── teardownFrontendMetrics() ─────────────────────────────────────────────────

describe('teardownFrontendMetrics()', () => {
  test('resets initialized flag so init can run again', () => {
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

  test('restores history.pushState so init→teardown→init does not double-wrap it', () => {
    initFrontendMetrics();
    const wrappedPush = history.pushState;
    teardownFrontendMetrics();

    // pushState is restored — it is a different reference from the wrapped version
    expect(history.pushState).not.toBe(wrappedPush);

    // After re-init, a single pushState triggers exactly one page_view (not two)
    enableOtel();
    initFrontendMetrics();
    flush(); // drain the initial page_view fired by init
    fetch.mockClear();
    window.history.pushState({}, '', '/my-workspace/home');
    flush();
    const pvEvents = getLastBatch().events.filter((e) => e.type === 'page_view');
    expect(pvEvents).toHaveLength(1);
  });
});

// ── CLS scaling ───────────────────────────────────────────────────────────────

describe('CLS web vital scaling', () => {
  test('CLS value is multiplied by 1000 before recording', () => {
    initFrontendMetrics();
    // Simulate web-vitals calling back with CLS = 0.05
    const clsCallback = onCLS.mock.calls[0][0];
    clsCallback({ value: 0.05 });
    flush();
    const batch = getLastBatch();
    const clsEvent = batch.events.find((e) => e.attrs?.vital === 'CLS');
    expect(clsEvent.duration).toBe(50); // 0.05 × 1000
  });

  test('other vitals are NOT scaled', () => {
    initFrontendMetrics();
    const fcpCallback = onFCP.mock.calls[0][0];
    fcpCallback({ value: 1234 });
    flush();
    const batch = getLastBatch();
    const fcpEvent = batch.events.find((e) => e.attrs?.vital === 'FCP');
    expect(fcpEvent.duration).toBe(1234); // unchanged
  });
});

// ── Truncation limits ─────────────────────────────────────────────────────────

describe('recordWidgetError() and recordJsError() truncation', () => {
  test('recordWidgetError truncates error_message to 200 chars', () => {
    recordWidgetError('Table', 'x'.repeat(300));
    flush();
    const event = getLastBatch().events[0];
    expect(event.type).toBe('widget_error');
    expect(event.attrs.widget_type).toBe('Table');
    expect(event.attrs.error_message).toHaveLength(200);
  });

  test('recordWidgetError uses empty string when no message provided', () => {
    recordWidgetError('Button');
    flush();
    const event = getLastBatch().events[0];
    expect(event.attrs.error_message).toBe('');
  });

  test('recordJsError truncates error_message to 200 and component_stack to 500', () => {
    recordJsError('e'.repeat(300), 's'.repeat(700));
    flush();
    const event = getLastBatch().events[0];
    expect(event.type).toBe('js_error');
    expect(event.attrs.error_message).toHaveLength(200);
    expect(event.attrs.component_stack).toHaveLength(500);
  });
});

// ── Convenience helpers ───────────────────────────────────────────────────────

describe('convenience helper functions', () => {
  test('recordPageView queues a page_view event', () => {
    recordPageView('dashboard');
    flush();
    expect(getLastBatch().events[0]).toMatchObject({ type: 'page_view', attrs: { page: 'dashboard' } });
  });

  test('recordPageLoad queues a page_load event with duration', () => {
    recordPageLoad('app-builder', 850);
    flush();
    expect(getLastBatch().events[0]).toMatchObject({
      type: 'page_load',
      attrs: { page: 'app-builder' },
      duration: 850,
    });
  });

  test('recordAppOpen queues an app_open event', () => {
    recordAppOpen('app-uuid-1', 'edit');
    flush();
    expect(getLastBatch().events[0]).toMatchObject({ type: 'app_open', attrs: { app_id: 'app-uuid-1', mode: 'edit' } });
  });

  test('recordAppLoad queues an app_load event with duration', () => {
    recordAppLoad('app-uuid-1', 'released', 1500);
    flush();
    expect(getLastBatch().events[0]).toMatchObject({
      type: 'app_load',
      attrs: { app_id: 'app-uuid-1', mode: 'released' },
      duration: 1500,
    });
  });

  test('recordQueryExec queues a query_exec event with status and duration', () => {
    recordQueryExec('query-1', 'app-1', 'success', 320);
    flush();
    expect(getLastBatch().events[0]).toMatchObject({
      type: 'query_exec',
      attrs: { query_id: 'query-1', app_id: 'app-1', status: 'success' },
      duration: 320,
    });
  });

  test('recordQueryError queues a query_error event', () => {
    recordQueryError('query-2', 'app-1', 'network_error');
    flush();
    expect(getLastBatch().events[0]).toMatchObject({
      type: 'query_error',
      attrs: { query_id: 'query-2', error_type: 'network_error' },
    });
  });

  test('recordWidgetRender queues a widget_render event with duration', () => {
    recordWidgetRender('Table', 45, 'app-1');
    flush();
    expect(getLastBatch().events[0]).toMatchObject({
      type: 'widget_render',
      attrs: { widget_type: 'Table', app_id: 'app-1' },
      duration: 45,
    });
  });
});
