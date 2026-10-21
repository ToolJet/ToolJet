import '@/test/setupMsw';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import config from 'config';
import LibraryUsagePanel from '../LibraryUsagePanel';

it('lists consumer apps with a count', async () => {
  server.use(
    http.get(`${config.apiUrl}/data-queries/v1/library-usage`, () =>
      HttpResponse.json({
        apps: [
          { id: 'a1', name: 'Support portal', queries: [{ id: 'c1', name: 'getCustomer', libraryQueryId: 'q1' }] },
          { id: 'a2', name: 'Sales dashboard', queries: [{ id: 'c2', name: 'cust', libraryQueryId: 'q1' }] },
        ],
      })
    )
  );
  render(<LibraryUsagePanel versionId="v1" />);
  expect(await screen.findByText('Used by (2)')).toBeInTheDocument();
  expect(screen.getByText('Support portal')).toBeInTheDocument();
});

it('says when nothing uses the library yet', async () => {
  server.use(http.get(`${config.apiUrl}/data-queries/v1/library-usage`, () => HttpResponse.json({ apps: [] })));
  render(<LibraryUsagePanel versionId="v1" />);
  expect(await screen.findByText('No apps use this library yet.')).toBeInTheDocument();
});
