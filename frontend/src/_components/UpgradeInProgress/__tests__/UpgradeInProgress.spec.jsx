import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, waitFor } from '@/test/test-utils';
import { UpgradeInProgress } from '../index';

const STATUS_URL = 'http://localhost:3000/api/migration-status';

const respondWith = (...bodies) => {
  let call = 0;
  server.use(http.get(STATUS_URL, () => HttpResponse.json(bodies[Math.min(call++, bodies.length - 1)])));
};

const renderPage = () =>
  render(
    <UpgradeInProgress>
      <p>error page</p>
    </UpgradeInProgress>
  );

describe('UpgradeInProgress', () => {
  test('shows maintenance progress instead of the error page while an upgrade runs', async () => {
    respondWith({ state: 'running', startedAt: '2026-10-19T10:00:00Z', progress: { done: 3, total: 9 } });
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Scheduled maintenance in progress' })).toBeInTheDocument();
    expect(screen.getByText('This page will be available again soon.')).toBeInTheDocument();
    expect(screen.getByText('3 of 9 done (33%)')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
    expect(screen.queryByText('error page')).not.toBeInTheDocument();
  });

  test('shows 0% before the run reports its migrations', async () => {
    respondWith({ state: 'running' });
    renderPage();

    expect(await screen.findByText('0%')).toBeInTheDocument();
  });

  test.each(['idle', 'failed', 'succeeded'])('shows the error page when the state is %s', async (state) => {
    respondWith({ state });
    renderPage();

    expect(await screen.findByText('error page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Scheduled maintenance in progress' })).not.toBeInTheDocument();
  });

  test('goes back to the app once the upgrade ends', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    const assign = jest.fn();
    const { location } = window;
    delete window.location;
    window.location = { ...location, assign };
    try {
      respondWith({ state: 'running', progress: { done: 1, total: 2 } }, { state: 'succeeded' });
      renderPage();
      await screen.findByRole('heading', { name: 'Scheduled maintenance in progress' });

      jest.advanceTimersByTime(3000);

      await waitFor(() => expect(assign).toHaveBeenCalledWith('/'));
    } finally {
      window.location = location;
      jest.useRealTimers();
    }
  });
});
