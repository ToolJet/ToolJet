import '@/test/setupMsw';
import React, { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import config from 'config';
import { Library } from '../Library';

// CodeHinter (the input fields) observes its own visibility; jsdom has no IntersectionObserver.
beforeAll(() => {
  // CodeMirror measures text ranges on a timer; jsdom has no layout, so give it empty rects.
  Range.prototype.getClientRects = () => [];
  Range.prototype.getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 });
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const version = (n, inputs, environment = null, isReleased = false) => ({
  id: `ver${n}`,
  name: `v${n}`,
  kind: 'postgresql',
  inputs: inputs.map((name) => ({ name, defaultValue: name === 'region' ? 'eu' : '' })),
  createdAt: `2026-03-0${n}`,
  environment,
  isReleased,
});
const production = { id: 'e2', name: 'production', priority: 3 };
const staging = { id: 'e1', name: 'staging', priority: 2 };

const catalog = {
  queries: [
    {
      id: 'q1',
      name: 'getInvoices',
      folder: 'billing',
      draft: { kind: 'postgresql', inputs: [{ name: 'region' }], matchesLatestVersion: false },
      releasedVersionId: 'ver2',
      versions: [version(2, ['region'], production, true), version(1, [], staging)],
    },
    {
      id: 'q2',
      name: 'getOrders',
      folder: null,
      draft: { kind: 'postgresql', inputs: [], matchesLatestVersion: false },
      releasedVersionId: null,
      versions: [version(2, ['region', 'other']), version(1, ['other'])],
    },
    {
      id: 'q3',
      name: 'getDraftOnly',
      folder: null,
      releasedVersionId: null,
      draft: { kind: 'postgresql', inputs: [], matchesLatestVersion: false },
      versions: [],
    },
  ],
};

function useCatalog(body = catalog) {
  server.use(
    http.get(`${config.apiUrl}/apps`, () => {
      throw new Error('Library must not load apps');
    }),
    http.get(`${config.apiUrl}/query-library/catalog`, () => HttpResponse.json(body))
  );
}

// optionsChanged is controlled by the parent: this keeps the options the editor wrote and feeds them back.
function renderLibrary(initial = {}) {
  const optionsChanged = jest.fn();
  const Harness = () => {
    const [options, setOptions] = useState(initial);
    return (
      <Library
        options={options}
        optionsChanged={(next) => {
          optionsChanged(next);
          setOptions(next);
        }}
        darkMode={false}
      />
    );
  };
  render(
    <MemoryRouter>
      <Harness />
    </MemoryRouter>
  );
  return optionsChanged;
}

const pick = async (openText, optionText) => {
  await userEvent.click(await screen.findByText(openText));
  await userEvent.click(await screen.findByRole('option', { name: optionText }));
};

beforeEach(() => useCatalog());

it('groups queries by folder with no library picker', async () => {
  renderLibrary();
  await userEvent.click(await screen.findByText('Select a query'));

  const billing = screen.getByText('billing');
  expect(within(billing.parentElement).getByText('getInvoices')).toBeInTheDocument();
  const noFolder = screen.getByText('No folder');
  expect(within(noFolder.parentElement).getByText('getOrders')).toBeInTheDocument();
  expect(screen.queryByText('Library')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /open in library/i })).toHaveAttribute(
    'href',
    expect.stringContaining('/query-library')
  );
});

it('prefixes "Open in library" with the deployment sub-path', async () => {
  window.public_config = { SUB_PATH: '/tooljet/' };
  window.history.pushState({}, '', '/tooljet/ws1/apps/home');
  try {
    renderLibrary();
    expect(await screen.findByRole('link', { name: /open in library/i })).toHaveAttribute(
      'href',
      '/tooljet/ws1/query-library'
    );
  } finally {
    delete window.public_config;
    window.history.pushState({}, '', '/');
  }
});

it('picking a query pins its Released version and copies kind and inputs', async () => {
  const optionsChanged = renderLibrary();
  await pick('Select a query', 'getInvoices');

  await waitFor(() =>
    expect(optionsChanged).toHaveBeenLastCalledWith({
      libraryQueryId: 'q1',
      libraryQueryVersionId: 'ver2',
      libraryKind: 'postgresql',
      inputs: { region: '' },
    })
  );
  expect(await screen.findByText('region')).toBeInTheDocument();
  expect(screen.getByText('v2 · Production · Released')).toBeInTheDocument();
});

it('pins the newest saved version when none is Released, and the draft when none is saved', async () => {
  const optionsChanged = renderLibrary();
  await pick('Select a query', 'getOrders');
  await waitFor(() =>
    expect(optionsChanged).toHaveBeenLastCalledWith(expect.objectContaining({ libraryQueryVersionId: 'ver2' }))
  );
  await pick('getOrders', 'getDraftOnly');
  await waitFor(() =>
    expect(optionsChanged).toHaveBeenLastCalledWith(expect.objectContaining({ libraryQueryVersionId: 'draft' }))
  );
});

it('labels versions with environment and Released', async () => {
  renderLibrary({ libraryQueryId: 'q1', libraryQueryVersionId: 'ver2', libraryKind: 'postgresql', inputs: {} });
  await userEvent.click(await screen.findByText('v2 · Production · Released'));
  expect(await screen.findByRole('option', { name: 'v1 · Staging' })).toBeInTheDocument();
});

it('switching version drops inputs the version no longer has and keeps the rest', async () => {
  const optionsChanged = renderLibrary({
    libraryQueryId: 'q2',
    libraryQueryVersionId: 'ver2',
    libraryKind: 'postgresql',
    inputs: { region: '{{1}}', other: '{{2}}' },
  });
  await pick('v2', 'v1');

  await waitFor(() =>
    expect(optionsChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({ libraryQueryVersionId: 'ver1', inputs: { other: '{{2}}' } })
    )
  );
});

it('shows the draft notice when the draft is chosen', async () => {
  renderLibrary({
    libraryQueryId: 'q1',
    libraryQueryVersionId: 'ver2',
    libraryKind: 'postgresql',
    inputs: {},
  });
  expect(screen.queryByText(/can't be released/)).not.toBeInTheDocument();
  await pick('v2 · Production · Released', 'Draft (testing only)');

  expect(await screen.findByText("This app can't be released while this query uses the draft.")).toBeInTheDocument();
});

it('treats a pin with no version id as the draft', async () => {
  renderLibrary({ libraryQueryId: 'q1', libraryKind: 'postgresql', inputs: {} });
  expect(await screen.findByText("This app can't be released while this query uses the draft.")).toBeInTheDocument();
});

it('offers the Released version when the pin is not it, and selects it on click', async () => {
  const optionsChanged = renderLibrary({
    libraryQueryId: 'q1',
    libraryQueryVersionId: 'ver1',
    libraryKind: 'postgresql',
    inputs: {},
  });
  await userEvent.click(await screen.findByRole('button', { name: 'v2 released' }));

  await waitFor(() =>
    expect(optionsChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({
        libraryQueryVersionId: 'ver2',
        inputs: { region: '' },
      })
    )
  );
  expect(screen.queryByRole('button', { name: 'v2 released' })).not.toBeInTheDocument();
});

it('shows no badge on the Released version', async () => {
  renderLibrary({
    libraryQueryId: 'q1',
    libraryQueryVersionId: 'ver2',
    libraryKind: 'postgresql',
    inputs: {},
  });
  await screen.findByText('Version');
  expect(screen.queryByText(/ released$/)).not.toBeInTheDocument();
});

it('shows the input fields with the default as placeholder', async () => {
  renderLibrary({
    libraryQueryId: 'q1',
    libraryQueryVersionId: 'ver2',
    libraryKind: 'postgresql',
    inputs: {},
  });
  expect(await screen.findByText('region')).toBeInTheDocument();
  await waitFor(() => expect(document.querySelector('.cm-placeholder')).toHaveTextContent('Default: eu'));
});

it('says so when the library has no queries', async () => {
  useCatalog({ queries: [] });
  renderLibrary();
  expect(await screen.findByText('No queries in the query library yet')).toBeInTheDocument();
});

it('says the library could not be loaded, not that it is empty, when the fetch fails', async () => {
  server.use(
    http.get(`${config.apiUrl}/query-library/catalog`, () => HttpResponse.json({ message: 'down' }, { status: 500 }))
  );
  renderLibrary();
  expect(await screen.findByText("Couldn't load the query library")).toBeInTheDocument();
  expect(screen.queryByText('No queries in the query library yet')).not.toBeInTheDocument();
});
