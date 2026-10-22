import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { toast } from 'react-hot-toast';
import { server } from '@/test/msw/server';
import { render, screen, userEvent, waitFor } from '@/test/test-utils';
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

  test('shows a failed run with its error and retries it', async () => {
    let started = 0;
    server.use(
      runs(failedRun),
      http.post(`${API}/migration-runs/run`, () => {
        started += 1;
        return HttpResponse.json({ ok: true }, { status: 201 });
      })
    );

    render(<MigrationsPage />);

    expect(await screen.findByText('Upgrade to 3.21.0 failed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The data migrations were rolled back. Changes made in ToolJet are refused until a retry succeeds.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('deadlock detected')).toBeInTheDocument();
    expect(screen.getByText('12.4s')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry migration' }));

    expect(await screen.findByRole('button', { name: 'Starting' })).toBeDisabled();
    expect(started).toBe(1);
  });

  test('shows the server reason when there is nothing to run', async () => {
    server.use(
      runs(failedRun),
      http.post(`${API}/migration-runs/run`, () =>
        HttpResponse.json({ message: 'A migration is already running.' }, { status: 409 })
      )
    );

    render(<MigrationsPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Retry migration' }));

    expect(await screen.findByRole('button', { name: 'Retry migration' })).toBeEnabled();
    expect(toast.error).toHaveBeenCalledWith('A migration is already running.');
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
    await waitFor(() => expect(calls).toBeGreaterThan(1), { timeout: 3500 });
  });

  test('says the database was up to date when a run had nothing to migrate', async () => {
    server.use(
      runs({ ...runningRun, status: 'succeeded', migrations: [], migrationsDone: 0, migrationsTotal: 0, logTail: [] })
    );

    render(<MigrationsPage />);

    expect(await screen.findByText('Nothing to migrate. The database was already up to date.')).toBeInTheDocument();
    expect(screen.queryByText('Log')).not.toBeInTheDocument();
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
    await userEvent.click(await screen.findByRole('button', { name: /AddColumn1700000000000/ }));

    expect(await screen.findByText('AddColumn: [PROGRESS] 3/3')).toBeInTheDocument();
    expect(asked).toBe('AddColumn1700000000000');
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
