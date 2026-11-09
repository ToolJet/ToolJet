import '@/test/setupMsw';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import ManageOrgConstantsSettings from '../ManageOrgConstantsSettings';
import { useConstantsListStore } from '../store/constantsListStore';

const API = 'http://localhost:3000/api';
const ENVIRONMENTS = [{ id: 'env-prod', name: 'production', is_default: true, enabled: true, priority: 3 }];
const LIST_PARAMS = { environmentId: 'env-prod', type: 'Global', sort: 'name_asc', source: ['workspace', 'env'] };

const row = (id, name, extra = {}) => ({
  kind: 'constant',
  id,
  name,
  type: 'Global',
  source: 'workspace',
  value: 'v',
  last_modified_at: '2026-11-04T10:00:00.000Z',
  owner: { id: 'u1', name: 'Asha Rao' },
  modified_by: { id: 'u1', name: 'Asha Rao' },
  ...extra,
});
const ALL = [
  row('a', 'ALPHA'),
  row('b', 'BRAVO'),
  row('c', 'CHARLIE'),
  row('env:Global:ENVVAR', 'ENVVAR', { source: 'env' }),
];

// Serves the environments and whatever list `rows()` returns; `rows` is a function so a test can change it.
function mockApi(rows = () => ALL) {
  server.use(
    http.get(`${API}/app-environments`, () => HttpResponse.json({ environments: ENVIRONMENTS })),
    http.get(`${API}/v2/organization-constants`, ({ request }) => {
      const type = new URL(request.url).searchParams.get('type');
      const items = rows().filter((entry) => entry.type === type);
      return HttpResponse.json({
        items,
        page: 1,
        page_size: 50,
        total: items.length,
        counts: { secrets: 0, globals: items.length },
      });
    })
  );
}

const renderPage = (route = '/') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <ManageOrgConstantsSettings />
    </MemoryRouter>
  );

const store = () => useConstantsListStore.getState();
const order = () =>
  within(screen.getAllByRole('rowgroup')[1])
    .getAllByRole('row')
    .map((entry) => entry.getAttribute('data-row-id'));

beforeEach(() => localStorage.clear());

describe('pinned rows on the constants page', () => {
  it('pins a row from its menu and moves it to the top', async () => {
    mockApi();
    renderPage();
    await screen.findByText('CHARLIE');

    await userEvent.click(screen.getByRole('button', { name: 'More actions for CHARLIE' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));

    expect(order()).toEqual(['c', 'a', 'b', 'env:Global:ENVVAR']);
    expect(
      within(screen.getByRole('row', { name: /CHARLIE/ })).getByRole('img', { name: 'Pinned' })
    ).toBeInTheDocument();
  });

  it('shows the selection bar for the selected rows and pins them in sort order', async () => {
    mockApi();
    renderPage();
    await screen.findByText('CHARLIE');
    expect(screen.queryByRole('toolbar')).toBeNull();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select CHARLIE' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select BRAVO' }));
    expect(screen.getByRole('toolbar')).toHaveTextContent('2 globals selected');

    await userEvent.click(screen.getByRole('button', { name: 'Pin' }));

    expect(order()).toEqual(['b', 'c', 'a', 'env:Global:ENVVAR']);
    // The selection is spent once the rows are pinned.
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('offers Unpin when every selected row is pinned', async () => {
    mockApi();
    renderPage();
    await screen.findByText('CHARLIE');
    act(() => store().pinConstants('Global', ['a', 'b'], 'name_asc'));

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select ALPHA' }));
    await userEvent.click(screen.getByRole('button', { name: 'Unpin' }));

    expect(order()).toEqual(['b', 'a', 'c', 'env:Global:ENVVAR']);
    expect(store().pins.Global).toEqual(['b']);
  });

  it('lets an .env constant be selected, to pin it', async () => {
    mockApi();
    renderPage();
    await screen.findByText('ENVVAR');
    expect(screen.getByRole('checkbox', { name: 'Select ENVVAR' })).toBeEnabled();
  });

  it('bulk deletes the selected rows after confirmation and drops their pins', async () => {
    let rows = ALL;
    mockApi(() => rows);
    let deleted;
    server.use(
      http.post(`${API}/v2/organization-constants/bulk-delete`, async ({ request }) => {
        deleted = (await request.json()).ids;
        rows = ALL.filter((entry) => !deleted.includes(entry.id));
        return HttpResponse.json({ deleted_ids: deleted, skipped_ids: [] });
      })
    );
    renderPage();
    await screen.findByText('CHARLIE');
    act(() => store().pinConstants('Global', ['a', 'b'], 'name_asc'));

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select ALPHA' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select CHARLIE' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete constants' }));

    await waitFor(() => expect(deleted).toEqual(expect.arrayContaining(['a', 'c'])));
    await waitFor(() => expect(order()).toEqual(['b', 'env:Global:ENVVAR']));
    expect(store().pins.Global).toEqual(['b']);
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('clears the selection when the tab changes', async () => {
    mockApi();
    renderPage();
    await screen.findByText('CHARLIE');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select CHARLIE' }));
    expect(screen.getByRole('toolbar')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Secrets/ }));

    await waitFor(() => expect(screen.queryByRole('toolbar')).toBeNull());
    expect(store().rowSelection).toEqual({});
  });

  describe('drag handles', () => {
    it('are offered for two pinned rows', async () => {
      mockApi();
      renderPage();
      await screen.findByText('CHARLIE');
      act(() => store().pinConstants('Global', ['a', 'b'], 'name_asc'));
      expect(screen.getByRole('button', { name: 'Reorder ALPHA' })).toBeInTheDocument();
    });

    it('are not offered under a source filter', async () => {
      mockApi();
      renderPage('/?source=workspace');
      await screen.findByText('CHARLIE');
      act(() => store().pinConstants('Global', ['a', 'b'], 'name_asc'));
      expect(screen.getAllByRole('img', { name: 'Pinned' })).toHaveLength(2);
      expect(screen.queryByRole('button', { name: /^Reorder / })).toBeNull();
    });
  });

  describe('keyboard reorder', () => {
    // jsdom has no layout, so give each row a 40px slot in DOM order for dnd-kit to measure.
    let rectSpy;
    beforeEach(() => {
      const zero = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) };
      rectSpy = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
        if (!this.getAttribute?.('data-row-id')) return zero;
        const top = Array.from(this.parentElement.children).indexOf(this) * 40;
        return { ...zero, top, bottom: top + 40, right: 800, width: 800, height: 40, y: top, toJSON: () => ({}) };
      });
    });
    afterEach(() => rectSpy.mockRestore());

    const announcement = () => document.querySelector('[role=status]')?.textContent;

    it('moves a pinned row with Space, ArrowDown, Space and keeps the order across a refetch', async () => {
      mockApi();
      renderPage();
      await screen.findByText('CHARLIE');
      act(() => store().pinConstants('Global', ['a', 'b', 'c'], 'name_asc'));
      expect(order().slice(0, 3)).toEqual(['a', 'b', 'c']);

      screen.getByRole('button', { name: 'Reorder ALPHA' }).focus();
      await userEvent.keyboard(' ');
      await waitFor(() => expect(announcement()).toMatch(/^(Picked up|ALPHA is over)/));
      // dnd-kit measures the rows a moment after the pick-up, so the first arrow presses can find nothing to move to.
      await waitFor(async () => {
        await userEvent.keyboard('{ArrowDown}');
        expect(announcement()).toBe('ALPHA is over BRAVO.');
      });
      await userEvent.keyboard(' ');
      await waitFor(() => expect(announcement()).toBe('Moved ALPHA to position 2 of 3.'));

      expect(order().slice(0, 3)).toEqual(['b', 'a', 'c']);
      expect(store().pins.Global).toEqual(['b', 'a', 'c']);

      await act(() => store().fetchList(LIST_PARAMS));
      expect(order().slice(0, 3)).toEqual(['b', 'a', 'c']);
    });
  });
});
