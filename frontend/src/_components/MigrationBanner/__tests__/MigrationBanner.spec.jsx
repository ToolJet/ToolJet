import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { act, render, screen, userEvent, waitFor } from '@/test/test-utils';
import { MigrationBanner } from '../index';

const STATUS_URL = 'http://localhost:3000/api/migration-status';

const respondWith = (body, init) => server.use(http.get(STATUS_URL, () => HttpResponse.json(body, init)));
const visibleBanner = () => document.querySelector('[data-cy="migration-banner"]');
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));

beforeEach(() => sessionStorage.clear());

describe('MigrationBanner', () => {
  test.each([
    ['running', /ToolJet is being upgraded/],
    ['failed', /latest ToolJet upgrade failed/],
  ])('shows the %s notice and announces it', async (state, text) => {
    respondWith({ state, startedAt: '2026-10-19T10:00:00Z' });
    render(<MigrationBanner />);

    await waitFor(() => expect(visibleBanner()).toHaveTextContent(text));
    expect(screen.getByRole('status')).toHaveTextContent(text);
  });

  test.each([
    ['running', /Scheduled maintenance in progress/],
    ['failed', /Maintenance is taking longer than expected/],
  ])('shows end users a generic %s notice without the product name', async (state, text) => {
    respondWith({ state, startedAt: '2026-10-19T10:00:00Z' });
    render(<MigrationBanner endUser floating />);

    await waitFor(() => expect(visibleBanner()).toHaveTextContent(text));
    expect(visibleBanner()).not.toHaveTextContent(/ToolJet|administrator/);
  });

  test('renders no banner when idle, keeping an empty announcement region', async () => {
    let called = false;
    server.use(
      http.get(STATUS_URL, () => {
        called = true;
        return HttpResponse.json({ state: 'idle' });
      })
    );
    render(<MigrationBanner />);
    await settle();

    expect(called).toBe(true);
    expect(visibleBanner()).toBeNull();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  test('treats a non-200 response as idle', async () => {
    respondWith({ state: 'running', startedAt: 'run-x' }, { status: 503 });
    render(<MigrationBanner />);
    await settle();

    expect(visibleBanner()).toBeNull();
  });

  test('close hides it for the same run and state, and a new run shows again', async () => {
    respondWith({ state: 'running', startedAt: 'run-1' });
    const { unmount } = render(<MigrationBanner />);
    await userEvent.click(await screen.findByRole('button', { name: 'Dismiss upgrade notice' }));
    expect(visibleBanner()).toBeNull();
    expect(sessionStorage.getItem('migration-banner-dismissed')).toBe('running:run-1');
    unmount();

    // Same run after a remount: stays hidden.
    const second = render(<MigrationBanner />);
    await settle();
    expect(visibleBanner()).toBeNull();
    second.unmount();

    // The same run failing is news: it shows again.
    respondWith({ state: 'failed', startedAt: 'run-1' });
    const third = render(<MigrationBanner />);
    await waitFor(() => expect(visibleBanner()).toHaveTextContent(/upgrade failed/));
    third.unmount();

    // A new run shows again.
    respondWith({ state: 'running', startedAt: 'run-2' });
    render(<MigrationBanner />);
    await waitFor(() => expect(visibleBanner()).toHaveTextContent(/being upgraded/));
  });
});
