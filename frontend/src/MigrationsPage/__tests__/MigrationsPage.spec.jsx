import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { toast } from 'react-hot-toast';
import { server } from '@/test/msw/server';
import { render, screen, userEvent } from '@/test/test-utils';
import { MigrationsPage } from '../index';

// App shell (sidebar, header, license) is out of scope here.
jest.mock('@/_ui/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const API = 'http://localhost:3000/api';

const failedRun = {
  id: 'run-1',
  fromVersion: '3.20.0',
  toVersion: '3.21.0',
  status: 'failed',
  currentMigration: 'PocSlowBackfill1799999999999',
  progress: '1200/5000',
  migrationsDone: 1,
  migrationsTotal: 2,
  migrations: [
    { name: 'AddColumn1700000000000', status: 'done' },
    { name: 'PocSlowBackfill1799999999999', status: 'failed' },
  ],
  logTail: ['query failed: deadlock detected'],
  error: 'deadlock detected',
  triggeredBy: 'boot',
  startedAt: '2026-10-19T10:00:00Z',
  finishedAt: '2026-10-19T10:05:00Z',
};

describe('MigrationsPage', () => {
  test('renders the failed state and retries the migration', async () => {
    let retried = 0;
    server.use(
      http.get(`${API}/migration-runs`, () => HttpResponse.json({ runs: [failedRun] })),
      http.post(`${API}/migration-runs/retry`, () => {
        retried += 1;
        return HttpResponse.json({ ok: true }, { status: 201 });
      })
    );

    render(<MigrationsPage />);

    expect(await screen.findByText('Upgrade to 3.21.0 failed. Nothing was committed.')).toBeInTheDocument();
    expect(screen.getByText('Upgrading 3.20.0 → 3.21.0')).toBeInTheDocument();
    expect(screen.getByText('query failed: deadlock detected')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry migration' }));

    expect(await screen.findByRole('button', { name: 'Retry requested' })).toBeDisabled();
    expect(retried).toBe(1);
    expect(toast.success).toHaveBeenCalled();
  });

  test('shows an error toast when there is nothing to retry', async () => {
    server.use(
      http.get(`${API}/migration-runs`, () => HttpResponse.json({ runs: [failedRun] })),
      http.post(`${API}/migration-runs/retry`, () =>
        HttpResponse.json({ message: 'Nothing to retry' }, { status: 409 })
      )
    );

    render(<MigrationsPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Retry migration' }));

    expect(await screen.findByRole('button', { name: 'Retry migration' })).toBeEnabled();
    expect(toast.error).toHaveBeenCalledWith('There is nothing to retry.');
  });

  test('shows the empty history state when no runs exist', async () => {
    server.use(http.get(`${API}/migration-runs`, () => HttpResponse.json({ runs: [] })));
    render(<MigrationsPage />);
    expect(await screen.findByText('No migrations have run in async mode yet.')).toBeInTheDocument();
  });
});
