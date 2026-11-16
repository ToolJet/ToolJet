import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { fireEvent, render, screen, userEvent, waitFor } from '@/test/test-utils';
import { MigrationsPage, formatMs } from '../index';

// App shell (sidebar, header, license) is out of scope here.
jest.mock('@/_ui/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const API = 'http://localhost:3000/api';

const failedRun = {
  id: 'run-1',
  fromVersion: '3.20.0',
  toVersion: '3.21.0',
  status: 'failed',
  migrationsDone: 1,
  migrationsTotal: 2,
  migrations: [
    { name: 'AddColumn1700000000000', status: 'done', durationMs: 12400 },
    { name: 'PocSlowBackfill1799999999999', status: 'failed', percent: 24 },
  ],
  logTail: ['query failed: deadlock detected'],
  error: 'deadlock detected',
  triggeredBy: 'boot',
  startedAt: '2026-10-19T10:00:00Z',
  finishedAt: '2026-10-19T10:05:00Z',
};

const runningRun = {
  ...failedRun,
  id: 'run-2',
  status: 'running',
  migrations: [
    { name: 'AddColumn1700000000000', status: 'done', durationMs: 12400 },
    { name: 'PocSlowBackfill1799999999999', status: 'running', percent: 24 },
  ],
  error: null,
  triggeredBy: 'admin@example.com',
  finishedAt: null,
};

const runs = (...list) => http.get(`${API}/migration-runs`, () => HttpResponse.json({ runs: list }));

describe('MigrationsPage', () => {
  beforeEach(() => jest.clearAllMocks());

  test('shows a failed run with its error, view-only', async () => {
    server.use(runs(failedRun));

    render(<MigrationsPage />);

    expect(await screen.findByText('Upgrade to 3.21.0 failed')).toBeInTheDocument();
    expect(
      screen.getByText('The data migrations were rolled back. Changes made in ToolJet are refused until they succeed.')
    ).toBeInTheDocument();
    expect(screen.getByText('deadlock detected')).toBeInTheDocument();
    expect(screen.getByText('12.4s')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  test('shows a running upgrade with overall and per-migration progress and keeps polling', async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/migration-runs`, () => {
        calls += 1;
        return HttpResponse.json({ runs: [runningRun, failedRun] });
      })
    );

    render(<MigrationsPage />);

    expect(await screen.findByText('Upgrading to 3.21.0')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Overall progress' })).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByRole('progressbar', { name: 'PocSlowBackfill1799999999999 progress' })).toHaveAttribute(
      'aria-valuenow',
      '24'
    );
    expect(screen.getByText(/by admin@example\.com/)).toBeInTheDocument();
    expect(screen.getByText('Earlier runs')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry migration' })).not.toBeInTheDocument();
    // mount + re-run on going active = 2; a third needs the running interval
    await waitFor(() => expect(calls).toBeGreaterThan(2), { timeout: 3500 });
  });

  test('refreshes an open migration log while that migration runs', async () => {
    let calls = 0;
    server.use(
      runs(runningRun),
      http.get(`${API}/migration-runs/run-2/log`, () => {
        calls += 1;
        return HttpResponse.json({ log: calls === 1 ? 'Backfill: 1/4' : 'Backfill: 2/4' });
      })
    );

    render(<MigrationsPage />);
    await userEvent.click(await screen.findByRole('button', { name: /^(?!Copy).*PocSlowBackfill1799999999999/ }));

    expect(await screen.findByText('Backfill: 1/4')).toBeInTheDocument();
    expect(await screen.findByText('Backfill: 2/4', {}, { timeout: 3500 })).toBeInTheDocument();
  });

  test('keeps the full log open when the run it follows succeeds', async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/migration-runs`, () => {
        calls += 1;
        const run = calls < 3 ? runningRun : { ...runningRun, status: 'succeeded', finishedAt: '2026-10-19T10:05:00Z' };
        return HttpResponse.json({ runs: [run] });
      })
    );

    render(<MigrationsPage />);
    const fullLog = await screen.findByRole('button', { name: /Full log/ });
    expect(fullLog).toHaveAttribute('aria-expanded', 'true');

    expect(await screen.findByText('Upgraded to 3.21.0', {}, { timeout: 3500 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Full log/ })).toHaveAttribute('aria-expanded', 'true');
  });

  describe('full log scrolling', () => {
    const scrollTops = new WeakMap();
    const props = {
      scrollHeight: { get: () => 1000 },
      clientHeight: { get: () => 300 },
      scrollTop: {
        get() {
          return scrollTops.get(this) ?? 0;
        },
        set(value) {
          scrollTops.set(this, value);
        },
      },
    };
    let originals;

    beforeEach(() => {
      originals = Object.fromEntries(
        Object.keys(props).map((key) => [key, Object.getOwnPropertyDescriptor(Element.prototype, key)])
      );
      Object.keys(props).forEach((key) =>
        Object.defineProperty(Element.prototype, key, { configurable: true, ...props[key] })
      );
    });

    afterEach(() =>
      Object.entries(originals).forEach(([key, descriptor]) =>
        descriptor ? Object.defineProperty(Element.prototype, key, descriptor) : delete Element.prototype[key]
      )
    );

    const longLog = (lines) => Array.from({ length: lines }, (_, i) => `line ${i + 1}`);

    test('opens at the newest line when the page loads mid-run', async () => {
      server.use(runs({ ...runningRun, logTail: longLog(60) }));

      render(<MigrationsPage />);

      const log = await screen.findByLabelText('Migration log');
      expect(log.scrollTop).toBe(1000);
    });

    test('stops following once the reader scrolls up', async () => {
      let calls = 0;
      server.use(
        http.get(`${API}/migration-runs`, () => {
          calls += 1;
          return HttpResponse.json({ runs: [{ ...runningRun, logTail: longLog(60 + calls) }] });
        })
      );

      render(<MigrationsPage />);
      const log = await screen.findByLabelText('Migration log');
      log.scrollTop = 0;
      fireEvent.scroll(log);

      await waitFor(() => expect(calls).toBeGreaterThan(2), { timeout: 3500 });
      expect(log.scrollTop).toBe(0);
    });
  });

  test('says the database was up to date when a run had nothing to migrate', async () => {
    server.use(
      runs({ ...runningRun, status: 'succeeded', migrations: [], migrationsDone: 0, migrationsTotal: 0, logTail: [] })
    );

    render(<MigrationsPage />);

    expect(await screen.findByText('Nothing to migrate. The database was already up to date.')).toBeInTheDocument();
    expect(screen.queryByText('Full log')).not.toBeInTheDocument();
  });

  test('does not claim nothing to migrate when a run failed before listing its migrations', async () => {
    server.use(runs({ ...failedRun, migrations: [], migrationsDone: 0, migrationsTotal: 0 }));

    render(<MigrationsPage />);

    expect(
      await screen.findByText('The run stopped before it could list its migrations. The log shows why.')
    ).toBeInTheDocument();
  });

  test("shows a migration's own log lines when its row is clicked", async () => {
    let asked;
    server.use(
      runs(failedRun),
      http.get(`${API}/migration-runs/run-1/log`, ({ request }) => {
        asked = new URL(request.url).searchParams.get('migration');
        return HttpResponse.json({ log: 'AddColumn: [PROGRESS] 3/3' });
      })
    );

    render(<MigrationsPage />);
    await userEvent.click(await screen.findByRole('button', { name: /^(?!Copy).*AddColumn1700000000000/ }));

    expect(await screen.findByText('AddColumn: [PROGRESS] 3/3')).toBeInTheDocument();
    expect(asked).toBe('AddColumn1700000000000');
  });

  test("says the log could not be loaded when a migration's log request fails", async () => {
    server.use(
      runs(failedRun),
      http.get(`${API}/migration-runs/run-1/log`, () => HttpResponse.json({}, { status: 500 }))
    );

    render(<MigrationsPage />);
    await userEvent.click(await screen.findByRole('button', { name: /^(?!Copy).*AddColumn1700000000000/ }));

    expect(await screen.findByText(/Could not load the log for this migration/)).toBeInTheDocument();
    expect(screen.queryByText('This migration logged nothing.')).not.toBeInTheDocument();
  });

  test('shows the empty state when no runs exist', async () => {
    server.use(runs());
    render(<MigrationsPage />);
    expect(await screen.findByText('No migration runs yet')).toBeInTheDocument();
  });

  test('offers to try again when the runs cannot be loaded', async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/migration-runs`, () => {
        calls += 1;
        return calls === 1 ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json({ runs: [failedRun] });
      })
    );

    render(<MigrationsPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Upgrade to 3.21.0 failed')).toBeInTheDocument();
  });

  test.each([
    [400, '<1s'],
    [12_400, '12.4s'],
    [125_000, '2m 5s'],
    [7_500_000, '2h 5m'],
  ])('formats %ims as %s', (ms, expected) => {
    expect(formatMs(ms)).toBe(expected);
  });
});
