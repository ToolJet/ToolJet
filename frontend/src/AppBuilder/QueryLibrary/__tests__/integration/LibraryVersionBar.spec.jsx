/**
 * Version bar of the library editor: version list, Release button, and when the button is allowed.
 * Real store (for dataQuery.isUpdatingQueryInProcess) + MSW at the HTTP boundary.
 */
import '@/test/setupMsw';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'react-hot-toast';
import config from 'config';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import LibraryVersionBar from '../../LibraryVersionBar';

jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const catalogUrl = `${config.apiUrl}/data-queries/ver1/library-catalog`;
const releaseUrl = `${config.apiUrl}/data-queries/q1/versions/ver1/library-release`;

const version = (n) => ({
  id: `lv${n}`,
  name: `v${n}`,
  kind: 'runjs',
  inputs: [],
  parameters: [],
  createdAt: '2026-03-0' + n,
});
const catalog = ({ matchesLatestVersion = false, versions = [version(2), version(1)], nextVersionNumber } = {}) =>
  HttpResponse.json({
    queries: [
      {
        id: 'other',
        name: 'other',
        folder: null,
        nextVersionNumber: 10,
        draft: { matchesLatestVersion: false },
        versions: [version(9)],
      },
      {
        id: 'q1',
        name: 'getCustomer',
        folder: null,
        nextVersionNumber: nextVersionNumber ?? versions.length + 1,
        draft: { kind: 'runjs', inputs: [], parameters: [], matchesLatestVersion },
        versions,
      },
    ],
  });

const setUpdating = (value) =>
  act(() => {
    useStore.setState((s) => ({ dataQuery: { ...s.dataQuery, isUpdatingQueryInProcess: value } }));
  });

const setPendingSave = (value) =>
  act(() => {
    useStore.setState((s) => ({ dataQuery: { ...s.dataQuery, queryUpdates: value ? { q1: Promise.resolve() } : {} } }));
  });

// Like the real throttled saveData: flushing a waiting trailing call starts the save and registers it.
const stubFlushStartsSave = (promise) =>
  useStore.setState((s) => ({
    dataQuery: {
      ...s.dataQuery,
      saveData: Object.assign(jest.fn(), {
        flush: () => useStore.setState((st) => ({ dataQuery: { ...st.dataQuery, queryUpdates: { q1: promise } } })),
      }),
    },
  }));

const deleteUrl = `${config.apiUrl}/data-queries/q1/versions/ver1/library-versions/lv2`;

const renderBar = () => render(<LibraryVersionBar queryId="q1" versionId="ver1" />);

describe('LibraryVersionBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists this query's versions newest first with a Release button for the next number", async () => {
    server.use(http.get(catalogUrl, () => catalog()));
    renderBar();

    expect(await screen.findByRole('button', { name: 'Release v3' })).toBeEnabled();
    const names = screen.getAllByTestId('library-version-name').map((el) => el.textContent);
    expect(names).toEqual(['v2', 'v1']);
  });

  it('releases, toasts the new version and refetches the catalog', async () => {
    let released = false;
    let catalogCalls = 0;
    server.use(
      http.get(catalogUrl, () => {
        catalogCalls += 1;
        return released
          ? catalog({ versions: [version(3), version(2), version(1)], matchesLatestVersion: true })
          : catalog();
      }),
      http.post(releaseUrl, () => {
        released = true;
        return HttpResponse.json({ id: 'lv3', name: 'v3', versionNumber: 3, createdAt: '2026-03-03' });
      })
    );
    renderBar();

    await userEvent.click(await screen.findByRole('button', { name: 'Release v3' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Released v3'));
    expect(await screen.findByRole('button', { name: 'Release v4' })).toBeDisabled();
    expect(catalogCalls).toBe(2);
  });

  it('shows the server message when the release is refused', async () => {
    server.use(
      http.get(catalogUrl, () => catalog()),
      http.post(releaseUrl, () => HttpResponse.json({ message: 'Nothing changed since v2' }, { status: 400 }))
    );
    renderBar();

    await userEvent.click(await screen.findByRole('button', { name: 'Release v3' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Nothing changed since v2'));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('disables Release while a query save is in flight', async () => {
    server.use(http.get(catalogUrl, () => catalog()));
    renderBar();
    const button = await screen.findByRole('button', { name: 'Release v3' });

    await setUpdating(true);
    expect(button).toBeDisabled();

    await setUpdating(false);
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('refetches the catalog once a save finishes so matchesLatestVersion stays current', async () => {
    let matches = true;
    server.use(http.get(catalogUrl, () => catalog({ matchesLatestVersion: matches })));
    renderBar();
    expect(await screen.findByRole('button', { name: 'Release v3' })).toBeDisabled();

    await setUpdating(true);
    matches = false;
    await setUpdating(false);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Release v3' })).toBeEnabled());
  });

  it('disables Release with the nothing-changed tooltip when the draft matches the latest version', async () => {
    server.use(http.get(catalogUrl, () => catalog({ matchesLatestVersion: true })));
    renderBar();
    const button = await screen.findByRole('button', { name: 'Release v3' });

    expect(button).toBeDisabled();
    await userEvent.hover(button.parentElement);
    expect(await screen.findByText('Nothing changed since v2')).toBeInTheDocument();
  });

  it('uses the server nextVersionNumber, so a deleted newest version does not free its number', async () => {
    // v3 was released and deleted: only v2 and v1 are listed, but the next release is v4.
    server.use(http.get(catalogUrl, () => catalog({ nextVersionNumber: 4 })));
    renderBar();

    expect(await screen.findByRole('button', { name: 'Release v4' })).toBeEnabled();
  });

  it('falls back to the latest listed version plus one when nextVersionNumber is missing', async () => {
    server.use(
      http.get(catalogUrl, () =>
        HttpResponse.json({
          queries: [
            {
              id: 'q1',
              name: 'getCustomer',
              folder: null,
              draft: { matchesLatestVersion: false },
              versions: [version(2), version(1)],
            },
          ],
        })
      )
    );
    renderBar();

    expect(await screen.findByRole('button', { name: 'Release v3' })).toBeEnabled();
  });

  it("shows Couldn't load versions when the catalog request fails", async () => {
    server.use(http.get(catalogUrl, () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
    renderBar();

    expect(await screen.findByText("Couldn't load versions")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Release/ })).not.toBeInTheDocument();
  });

  it('disables Release while a query update is pending in the store', async () => {
    server.use(http.get(catalogUrl, () => catalog()));
    renderBar();
    const button = await screen.findByRole('button', { name: 'Release v3' });

    await setPendingSave(true);
    expect(button).toBeDisabled();

    await setPendingSave(false);
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('sends a throttled save that is still waiting before it releases', async () => {
    const calls = [];
    const flush = jest.fn(() => calls.push('flush'));
    useStore.setState((s) => ({ dataQuery: { ...s.dataQuery, saveData: Object.assign(jest.fn(), { flush }) } }));
    server.use(
      http.get(catalogUrl, () => catalog()),
      http.post(releaseUrl, () => {
        calls.push('release');
        return HttpResponse.json({ id: 'lv3', name: 'v3', versionNumber: 3, createdAt: '2026-03-03' });
      })
    );
    renderBar();

    await userEvent.click(await screen.findByRole('button', { name: 'Release v3' }));

    await waitFor(() => expect(calls).toEqual(['flush', 'release']));
  });

  it('releases only after a pending save resolves', async () => {
    const calls = [];
    let finishSave;
    const pending = new Promise((resolve) => {
      finishSave = () => {
        calls.push('saved');
        resolve();
      };
    });
    server.use(
      http.get(catalogUrl, () => catalog()),
      http.post(releaseUrl, () => {
        calls.push('release');
        return HttpResponse.json({ id: 'lv3', name: 'v3', versionNumber: 3, createdAt: '2026-03-03' });
      })
    );
    renderBar();
    stubFlushStartsSave(pending);
    const button = await screen.findByRole('button', { name: 'Release v3' });

    await userEvent.click(button);
    expect(calls).toEqual([]);
    await act(async () => finishSave());

    await waitFor(() => expect(calls).toEqual(['saved', 'release']));
  });

  it('does not release when the pending save fails', async () => {
    let releaseCalls = 0;
    const failing = Promise.reject(new Error('save failed'));
    failing.catch(() => {});
    server.use(
      http.get(catalogUrl, () => catalog()),
      http.post(releaseUrl, () => {
        releaseCalls += 1;
        return HttpResponse.json({ id: 'lv3', name: 'v3', versionNumber: 3, createdAt: '2026-03-03' });
      })
    );
    renderBar();
    stubFlushStartsSave(failing);
    const button = await screen.findByRole('button', { name: 'Release v3' });

    await userEvent.click(button);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Save the query before releasing'));
    expect(releaseCalls).toBe(0);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('deletes a version after confirming, then refetches the catalog', async () => {
    let deleted = false;
    server.use(
      http.get(catalogUrl, () => (deleted ? catalog({ versions: [version(1)], nextVersionNumber: 3 }) : catalog())),
      http.delete(deleteUrl, () => {
        deleted = true;
        return new HttpResponse(null, { status: 200 });
      })
    );
    renderBar();

    await userEvent.click(await screen.findByRole('button', { name: 'Delete v2' }));
    expect(screen.getByText("Delete v2? Apps can't pin it after this.")).toBeInTheDocument();
    expect(deleted).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(screen.getAllByTestId('library-version-name').map((el) => el.textContent)).toEqual(['v1'])
    );
    expect(screen.getByRole('button', { name: 'Release v3' })).toBeInTheDocument();
  });

  it('does not delete when the confirm is cancelled', async () => {
    let deleteCalls = 0;
    server.use(
      http.get(catalogUrl, () => catalog()),
      http.delete(deleteUrl, () => {
        deleteCalls += 1;
        return new HttpResponse(null, { status: 200 });
      })
    );
    renderBar();

    await userEvent.click(await screen.findByRole('button', { name: 'Delete v2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText(/Apps can't pin it/)).not.toBeInTheDocument());
    expect(deleteCalls).toBe(0);
  });

  it('shows the server message in a toast when the delete is refused', async () => {
    const message = 'Used by 1 app(s): Sales CRM · v1. Remove it from those first.';
    server.use(
      http.get(catalogUrl, () => catalog()),
      http.delete(deleteUrl, () => HttpResponse.json({ message }, { status: 409 }))
    );
    renderBar();

    await userEvent.click(await screen.findByRole('button', { name: 'Delete v2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
    expect(screen.getAllByTestId('library-version-name')).toHaveLength(2);
  });

  it('offers Release v1 when the query has no versions yet', async () => {
    server.use(http.get(catalogUrl, () => catalog({ versions: [] })));
    renderBar();

    expect(await screen.findByRole('button', { name: 'Release v1' })).toBeEnabled();
  });
});
