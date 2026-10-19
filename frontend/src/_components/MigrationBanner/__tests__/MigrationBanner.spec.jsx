import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { act, render, screen, userEvent } from '@/test/test-utils';
import { MigrationBanner } from '../index';

const STATUS_URL = 'http://localhost:3000/api/migration-status';
const RUNNING_TEXT = /ToolJet is being upgraded/;

const respondWith = (body, init) => server.use(http.get(STATUS_URL, () => HttpResponse.json(body, init)));

beforeEach(() => sessionStorage.clear());

describe('MigrationBanner', () => {
  test('shows the upgrade notice while a migration is running', async () => {
    respondWith({ state: 'running', startedAt: '2026-10-19T10:00:00Z' });
    render(<MigrationBanner />);
    expect(await screen.findByText(RUNNING_TEXT)).toBeInTheDocument();
  });

  test('shows the failure notice when the last upgrade failed', async () => {
    respondWith({ state: 'failed', startedAt: '2026-10-19T10:00:00Z' });
    render(<MigrationBanner />);
    expect(await screen.findByText(/latest ToolJet upgrade failed/)).toBeInTheDocument();
  });

  test('renders nothing when idle', async () => {
    let called = false;
    server.use(
      http.get(STATUS_URL, () => {
        called = true;
        return HttpResponse.json({ state: 'idle' });
      })
    );
    const { container } = render(<MigrationBanner />);
    await act(() => new Promise((r) => setTimeout(r, 20)));
    expect(called).toBe(true);
    expect(container).toBeEmptyDOMElement();
  });

  test('treats a non-200 response as idle', async () => {
    respondWith({ state: 'running', startedAt: 'run-x' }, { status: 503 });
    const { container } = render(<MigrationBanner />);
    await act(() => new Promise((r) => setTimeout(r, 20)));
    expect(container).toBeEmptyDOMElement();
  });

  test('close hides it for the same run and persists the run key in sessionStorage', async () => {
    respondWith({ state: 'running', startedAt: 'run-1' });
    const { unmount } = render(<MigrationBanner />);
    await userEvent.click(await screen.findByRole('button', { name: 'Dismiss upgrade notice' }));
    expect(screen.queryByText(RUNNING_TEXT)).not.toBeInTheDocument();
    expect(sessionStorage.getItem('migration-banner-dismissed')).toBe('run-1');
    unmount();

    // Same run after a remount: stays hidden.
    const second = render(<MigrationBanner />);
    await act(() => new Promise((r) => setTimeout(r, 20)));
    expect(screen.queryByText(RUNNING_TEXT)).not.toBeInTheDocument();
    second.unmount();

    // A new run shows again.
    respondWith({ state: 'running', startedAt: 'run-2' });
    render(<MigrationBanner />);
    expect(await screen.findByText(RUNNING_TEXT)).toBeInTheDocument();
  });
});
