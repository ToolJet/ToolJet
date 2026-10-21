import '@/test/setupMsw';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import config from 'config';
import { Library } from '../Library';

// CodeHinter (the parameter inputs) observes its own visibility; jsdom has no IntersectionObserver.
beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  server.use(
    http.get(`${config.apiUrl}/apps`, () =>
      HttpResponse.json({ apps: [{ id: 'lib1', name: 'Customer queries', app_versions: [{ id: 'v1' }] }] })
    ),
    http.get(`${config.apiUrl}/data-queries/v1`, () =>
      HttpResponse.json({
        data_queries: [
          {
            id: 'q1',
            name: 'getCustomerById',
            kind: 'postgresql',
            options: { parameters: [{ name: 'customerId', defaultValue: '1' }] },
          },
          { id: 'q2', name: 'shapeCustomer', kind: 'runjs', options: { parameters: [] } },
          { id: 'q3', name: 'pyThing', kind: 'runpy', options: {} },
        ],
      })
    )
  );
});

it('lists usable library queries and writes the full pointer when one is picked', async () => {
  const optionsChanged = jest.fn();
  const { rerender } = render(<Library options={{}} optionsChanged={optionsChanged} darkMode={false} />);

  await userEvent.click(await screen.findByText('Select a library'));
  await userEvent.click(await screen.findByText('Customer queries'));
  expect(optionsChanged).toHaveBeenLastCalledWith(expect.objectContaining({ libraryAppId: 'lib1' }));

  // optionsChanged is controlled by the parent: feed the library choice back in.
  rerender(<Library options={{ libraryAppId: 'lib1' }} optionsChanged={optionsChanged} darkMode={false} />);

  await userEvent.click(await screen.findByText('Select a query'));
  expect(screen.queryByText('pyThing')).not.toBeInTheDocument(); // runpy is excluded
  await userEvent.click(await screen.findByText('getCustomerById'));

  await waitFor(() =>
    expect(optionsChanged).toHaveBeenLastCalledWith({
      libraryAppId: 'lib1',
      libraryQueryId: 'q1',
      libraryKind: 'postgresql',
      libraryVersion: 'latest',
      inputs: { customerId: '' },
    })
  );
});

it('shows one input per library parameter with the default as placeholder', async () => {
  // The parameter inputs are CodeHinters, which read the router location.
  render(
    <MemoryRouter>
      <Library
        options={{
          libraryAppId: 'lib1',
          libraryQueryId: 'q1',
          libraryKind: 'postgresql',
          libraryVersion: 'latest',
          inputs: {},
        }}
        optionsChanged={jest.fn()}
        darkMode={false}
      />
    </MemoryRouter>
  );
  expect(await screen.findByText('customerId')).toBeInTheDocument();
  expect(screen.getByText('Latest')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /open in library/i })).toHaveAttribute(
    'href',
    expect.stringContaining('lib1')
  );
});

it('finds a stored library that is only on the second page of the listing', async () => {
  const pages = [];
  server.use(
    http.get(`${config.apiUrl}/apps`, ({ request }) => {
      const page = Number(new URL(request.url).searchParams.get('page'));
      pages.push(page);
      return HttpResponse.json(
        page === 2
          ? { meta: { total_pages: 2 }, apps: [{ id: 'lib1', name: 'Customer queries', app_versions: [{ id: 'v1' }] }] }
          : { meta: { total_pages: 2 }, apps: [{ id: 'other', name: 'Other', app_versions: [{ id: 'v9' }] }] }
      );
    })
  );
  render(
    <MemoryRouter>
      <Library
        options={{
          libraryAppId: 'lib1',
          libraryQueryId: 'q1',
          libraryKind: 'postgresql',
          libraryVersion: 'latest',
          inputs: {},
        }}
        optionsChanged={jest.fn()}
        darkMode={false}
      />
    </MemoryRouter>
  );
  expect(await screen.findByText('customerId')).toBeInTheDocument();
  expect(screen.getByText('Customer queries')).toBeInTheDocument();
  expect(pages).toEqual([1, 2]);
});
