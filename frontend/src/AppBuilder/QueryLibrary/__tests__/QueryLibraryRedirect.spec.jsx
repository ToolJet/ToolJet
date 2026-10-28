import '@/test/setupMsw';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { toast } from 'react-hot-toast';
import { server } from '@/test/msw/server';
import config from 'config';
import QueryLibraryRedirect from '../QueryLibraryRedirect';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => mockNavigate }));
jest.mock('react-hot-toast', () => ({ toast: { error: jest.fn() } }));

const library = { id: 'lib1', slug: 'query-library', app_versions: [{ id: 'libv' }] };

beforeEach(() => {
  window.history.pushState({}, '', '/ws1/query-library');
  mockNavigate.mockClear();
  toast.error.mockClear();
});

describe('QueryLibraryRedirect', () => {
  it('opens the existing library without creating one', async () => {
    const create = jest.fn();
    server.use(
      http.get(`${config.apiUrl}/apps`, () => HttpResponse.json({ apps: [library] })),
      http.post(`${config.apiUrl}/apps`, () => {
        create();
        return HttpResponse.json({ id: 'lib1' });
      })
    );
    render(<QueryLibraryRedirect />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/ws1/apps/query-library', { replace: true }));
    expect(create).not.toHaveBeenCalled();
  });

  it('creates the library once when there is none, then opens it', async () => {
    let created = 0;
    server.use(
      http.get(`${config.apiUrl}/apps`, () => HttpResponse.json({ apps: created ? [library] : [] })),
      http.post(`${config.apiUrl}/apps`, () => {
        created++;
        return HttpResponse.json({ id: 'lib1' });
      })
    );
    render(<QueryLibraryRedirect />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/ws1/apps/query-library', { replace: true }));
    expect(created).toBe(1);
  });

  it("opens the other creator's library when it loses the creation race", async () => {
    let lists = 0;
    server.use(
      http.get(`${config.apiUrl}/apps`, () => HttpResponse.json({ apps: ++lists > 1 ? [library] : [] })),
      http.post(`${config.apiUrl}/apps`, () =>
        HttpResponse.json({ statusCode: 400, message: 'This workspace already has a query library' }, { status: 400 })
      )
    );
    render(<QueryLibraryRedirect />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/ws1/apps/query-library', { replace: true }));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows the server message and goes back to the dashboard on failure', async () => {
    server.use(
      http.get(`${config.apiUrl}/apps`, () => HttpResponse.json({ apps: [] })),
      http.post(`${config.apiUrl}/apps`, () => HttpResponse.json({ message: 'boom' }, { status: 500 }))
    );
    render(<QueryLibraryRedirect />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/ws1', { replace: true }));
    expect(toast.error).toHaveBeenCalledWith('boom');
  });

  it('does not navigate or toast when the user leaves before the response lands', async () => {
    let release;
    const gate = new Promise((r) => (release = r));
    server.use(
      http.get(`${config.apiUrl}/apps`, async () => {
        await gate;
        return HttpResponse.json({ apps: [library] });
      })
    );
    const { unmount } = render(<QueryLibraryRedirect />);
    unmount();
    release();
    await new Promise((r) => setTimeout(r, 50));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('does not toast a late failure after unmount', async () => {
    let release;
    const gate = new Promise((r) => (release = r));
    server.use(
      http.get(`${config.apiUrl}/apps`, async () => {
        await gate;
        return HttpResponse.json({ message: 'boom' }, { status: 500 });
      })
    );
    const { unmount } = render(<QueryLibraryRedirect />);
    unmount();
    release();
    await new Promise((r) => setTimeout(r, 50));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
