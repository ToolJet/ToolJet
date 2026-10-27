import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { act, render, screen, userEvent, waitFor } from '@/test/test-utils';
import { authenticationService } from '@/_services/authentication.service';
import { MigrationBanner } from '../index';

const STATUS_URL = 'http://localhost:3000/api/migration-status';

const respondWith = (body, init) => server.use(http.get(STATUS_URL, () => HttpResponse.json(body, init)));
const visibleBanner = () => document.querySelector('[data-cy="migration-banner"]');
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));

const initialSession = authenticationService.currentSessionValue;

beforeEach(() => sessionStorage.clear());
afterEach(() => authenticationService.updateCurrentSession(initialSession));

const asSuperAdmin = (superAdmin) =>
  act(() => authenticationService.updateCurrentSession({ ...initialSession, super_admin: superAdmin }));

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
    ['builders', {}, 'running', /ToolJet is being upgraded and is unavailable until it finishes/],
    ['builders', {}, 'failed', /ToolJet is unavailable until an administrator fixes it/],
    ['end users', { endUser: true, floating: true }, 'running', /This app is unavailable until it finishes/],
  ])('tells %s ToolJet is unavailable (%s) when the server refuses reads too', async (_who, props, state, text) => {
    respondWith({ state, startedAt: '2026-10-19T10:00:00Z', readsBlocked: true });
    render(<MigrationBanner {...props} />);

    await waitFor(() => expect(visibleBanner()).toHaveTextContent(text));
  });

  test('links a super admin to the migrations page when the upgrade failed', async () => {
    asSuperAdmin(true);
    respondWith({ state: 'failed', startedAt: '2026-10-19T10:00:00Z' });
    render(<MigrationBanner endUser floating />);

    expect(await screen.findByRole('link', { name: /See what failed/ })).toHaveAttribute(
      'href',
      '/settings/migrations'
    );
  });

  test('adds the link when the super admin session loads after the banner', async () => {
    respondWith({ state: 'failed', startedAt: '2026-10-19T10:00:00Z' });
    render(<MigrationBanner />);
    await waitFor(() => expect(visibleBanner()).toBeInTheDocument());
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    asSuperAdmin(true);

    expect(await screen.findByRole('link', { name: /See what failed/ })).toBeInTheDocument();
  });

  test.each([
    ['a super admin while it runs', true, 'running'],
    ['other users when it failed', false, 'failed'],
  ])('shows no link to %s', async (_case, superAdmin, state) => {
    asSuperAdmin(superAdmin);
    respondWith({ state, startedAt: '2026-10-19T10:00:00Z' });
    render(<MigrationBanner />);

    await waitFor(() => expect(visibleBanner()).toBeInTheDocument());
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
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

  test("shows end users the operator's text when the server sends one, and builders keep theirs", async () => {
    const custom = 'Orders portal is under maintenance until 10pm.';
    respondWith({ state: 'running', startedAt: '2026-10-19T10:00:00Z', endUserMessage: custom });
    const { unmount } = render(<MigrationBanner endUser floating />);
    await waitFor(() => expect(visibleBanner()).toHaveTextContent(custom));
    unmount();

    render(<MigrationBanner />);
    await waitFor(() => expect(visibleBanner()).toHaveTextContent(/ToolJet is being upgraded/));
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
