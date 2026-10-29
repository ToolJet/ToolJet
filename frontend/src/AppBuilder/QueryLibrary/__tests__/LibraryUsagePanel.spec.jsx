import '@/test/setupMsw';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import config from 'config';
import LibraryUsagePanel from '../LibraryUsagePanel';

const usageUrl = `${config.apiUrl}/query-library/usage`;
const pin = (overrides) => ({
  id: 'c1',
  name: 'getCustomer',
  appVersionName: 'v1',
  libraryQueryId: 'q1',
  versionName: 'v2',
  libraryQueryVersionId: 'saved-v2',
  status: 'PUBLISHED',
  ...overrides,
});
const rows = (heading) =>
  within(screen.getByText(heading).closest('section'))
    .queryAllByRole('listitem')
    .map((li) => li.textContent);

describe('LibraryUsagePanel', () => {
  it('splits consumers into apps and modules, one row per consumer query', async () => {
    server.use(
      http.get(usageUrl, () =>
        HttpResponse.json({
          apps: [{ id: 'a1', name: 'Support portal', queries: [pin()] }],
          modules: [
            { id: 'm1', name: 'Customer card', queries: [pin({ id: 'c2', name: 'lookup', appVersionName: 'v3' })] },
          ],
        })
      )
    );
    render(<LibraryUsagePanel libraryQueryId="q1" />);

    expect(await screen.findByText('Used by apps (1)')).toBeInTheDocument();
    expect(screen.getByText('Used by modules (1)')).toBeInTheDocument();
    expect(rows('Used by apps (1)')).toEqual(['Support portal · v1 · getCustomer · v2']);
    expect(rows('Used by modules (1)')).toEqual(['Customer card · v3 · lookup · v2']);
    expect(screen.getByRole('link', { name: 'Support portal' })).toHaveAttribute(
      'href',
      expect.stringMatching(/\/apps\/a1$/)
    );
    expect(screen.getByRole('link', { name: 'Customer card' })).toHaveAttribute(
      'href',
      expect.stringMatching(/\/apps\/m1$/)
    );
  });

  it('shows the pinned version environment next to the version', async () => {
    server.use(
      http.get(usageUrl, () =>
        HttpResponse.json({
          apps: [{ id: 'a1', name: 'Support portal', queries: [pin({ pinnedEnvironment: 'staging' })] }],
          modules: [],
        })
      )
    );
    render(<LibraryUsagePanel libraryQueryId="q1" />);

    expect(await screen.findByText('Used by apps (1)')).toBeInTheDocument();
    expect(rows('Used by apps (1)')).toEqual(['Support portal · v1 · getCustomer · v2 · Staging']);
  });

  it('prefixes app links with the deployment sub-path', async () => {
    window.public_config = { SUB_PATH: '/tooljet/' };
    window.history.pushState({}, '', '/tooljet/ws1/apps/home');
    try {
      server.use(
        http.get(usageUrl, () =>
          HttpResponse.json({ apps: [{ id: 'a1', name: 'Support portal', queries: [pin()] }], modules: [] })
        )
      );
      render(<LibraryUsagePanel libraryQueryId="q1" />);

      expect(await screen.findByRole('link', { name: 'Support portal' })).toHaveAttribute(
        'href',
        '/tooljet/ws1/apps/a1'
      );
    } finally {
      delete window.public_config;
      window.history.pushState({}, '', '/');
    }
  });

  it('shows both groups at 0 with None when nothing uses the query', async () => {
    server.use(http.get(usageUrl, () => HttpResponse.json({ apps: [], modules: [] })));
    render(<LibraryUsagePanel libraryQueryId="q1" />);

    expect(await screen.findByText('Used by apps (0)')).toBeInTheDocument();
    expect(screen.getByText('Used by modules (0)')).toBeInTheDocument();
    expect(screen.getAllByText('None')).toHaveLength(2);
  });

  it('shows both groups at 0 with None while creating a query', () => {
    render(<LibraryUsagePanel />);

    expect(screen.getByText('Used by apps (0)')).toBeInTheDocument();
    expect(screen.getByText('Used by modules (0)')).toBeInTheDocument();
    expect(screen.getAllByText('None')).toHaveLength(2);
  });

  it('shows None for a group with no consumers', async () => {
    server.use(
      http.get(usageUrl, () =>
        HttpResponse.json({ apps: [{ id: 'a1', name: 'Support portal', queries: [pin()] }], modules: [] })
      )
    );
    render(<LibraryUsagePanel libraryQueryId="q1" />);

    expect(await screen.findByText('Used by modules (0)')).toBeInTheDocument();
    expect(within(screen.getByText('Used by modules (0)').closest('section')).getByText('None')).toBeInTheDocument();
  });

  it('shows only consumers of the selected query and labels draft pins', async () => {
    server.use(
      http.get(usageUrl, () =>
        HttpResponse.json({
          apps: [
            {
              id: 'a1',
              name: 'Support portal',
              queries: [
                pin({ versionName: 'experiment', status: 'DRAFT' }),
                pin({ id: 'c9', name: 'otherUse', libraryQueryId: 'q2' }),
              ],
            },
            { id: 'a2', name: 'Unrelated app', queries: [pin({ id: 'c8', libraryQueryId: 'q2' })] },
          ],
          modules: [],
        })
      )
    );
    render(<LibraryUsagePanel libraryQueryId="q1" />);

    expect(await screen.findByText('Used by apps (1)')).toBeInTheDocument();
    expect(rows('Used by apps (1)')).toEqual(['Support portal · v1 · getCustomer · experiment · Draft']);
    expect(screen.queryByText('Unrelated app')).not.toBeInTheDocument();
  });

  it('says it could not load usage instead of claiming nothing uses the query', async () => {
    server.use(http.get(usageUrl, () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
    render(<LibraryUsagePanel libraryQueryId="q1" />);

    expect(await screen.findByText("Couldn't load usage")).toBeInTheDocument();
    expect(screen.queryByText('None')).not.toBeInTheDocument();
  });
});

it('renders a saved name draft verbatim', async () => {
  server.use(
    http.get(usageUrl, () =>
      HttpResponse.json({ apps: [{ id: 'a1', name: 'Portal', queries: [pin({ versionName: 'draft' })] }], modules: [] })
    )
  );
  render(<LibraryUsagePanel libraryQueryId="q1" />);
  await screen.findByText('Used by apps (1)');
  expect(rows('Used by apps (1)')).toEqual(['Portal · v1 · getCustomer · draft']);
});
