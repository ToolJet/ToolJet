/**
 * QM-62: with the query editor closed, a row's ⋮ menu only opens the menu. It acts on that row's
 * query without selecting it, so the editor stays closed and the selection stays put.
 */
import React from 'react';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useStore from '@/AppBuilder/_stores/store';
import { dataqueryService } from '@/_services';
import { QueryCard } from '@/AppBuilder/QueryPanel/QueryCard';
import QueryCardMenu from '@/AppBuilder/QueryPanel/QueryCardMenu';
import * as eeMenu from '@ee/modules/Appbuilder/components/QueryDataPane/QueryCardMenu';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { buildQuery, seedApp } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();

const first = buildQuery({ id: 'q1', name: 'firstQuery' });
const second = buildQuery({ id: 'q2', name: 'secondQuery' });
const state = () => useStore.getState();

// CE's menu, and the edition's menu (with query folders) when the ee submodule is present.
const EeQueryCardMenu = eeMenu.QueryCardMenu ?? eeMenu.default;
const MENUS = [['base', QueryCardMenu], ...(EeQueryCardMenu ? [['ee', EeQueryCardMenu]] : [])];

const setup = (Menu) => {
  controls.observers.install();
  seedApp({});
  act(() => {
    state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
    useStore.setState((s) => {
      s.dataQuery.queries.modules.canvas = [first, second];
    });
    state().queryPanel.setSelectedQuery('q1', 'canvas', { reveal: false });
    state().setRightSidebarOpen(false);
  });
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <div className="query-list">
        <QueryCard dataQuery={first} />
        <QueryCard dataQuery={second} />
      </div>
      <Menu darkMode={false} />
    </ModuleProvider>
  );
};

afterEach(() => controls.restore());

const openMenuOf = (name) =>
  fireEvent.click(document.querySelector(`[data-cy="query-handler-menu-${name.toLowerCase()}"]`));

// Break this catches: the ⋮ click selects the row's query, which slides the query editor open.
test.each(MENUS)(
  "%s menu: opening another row's menu leaves the closed editor closed and the selection alone",
  (_, Menu) => {
    setup(Menu);
    openMenuOf('secondQuery');

    expect(state().queryPanel.showQueryHandlerMenu).toBe(true);
    expect(state().isRightSidebarOpen).toBe(false);
    expect(state().queryPanel.selectedQuery?.id).toBe('q1');
  }
);

// Break this catches: the menu's actions still read the selected query, so Delete targets the wrong one.
test.each(MENUS)("%s menu: acts on its own row's query", (_, Menu) => {
  setup(Menu);
  openMenuOf('secondQuery');

  fireEvent.click(screen.getByText('Delete'));

  expect(state().queryPanel.deletingQueryId).toBe('q2');
  expect(state().isRightSidebarOpen).toBe(false);
});

// Break this catches: keyboard users can open the options but cannot focus and activate Rename.
test.each(MENUS)('%s menu: renames an unselected query using the keyboard', async (_, Menu) => {
  setup(Menu);
  act(() => state().setRightSidebarOpen(true));
  const row = screen.getByText('secondQuery').closest('.query-row');
  const options = within(row).getByRole('button', { name: 'Query options' });

  await userEvent.tab();
  await userEvent.tab();
  expect(options).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(screen.getByRole('button', { name: 'Rename' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');

  const input = within(row).getByRole('textbox');
  expect(input).toHaveValue('secondQuery');
  expect(input).toHaveFocus();
  await userEvent.click(input);
  expect(state().queryPanel.selectedQuery?.id).toBe('q1');
  expect(state().isRightSidebarOpen).toBe(true);
  await userEvent.keyboard('{Escape}');
  expect(within(row).queryByRole('textbox')).not.toBeInTheDocument();
});

// Break this catches (review B1): deleting a query that isn't selected re-selects the first query, and
// drops the surviving selected query's name mapping instead of the deleted one's.
test('deleting a query that is not selected keeps the selection and its mapping', async () => {
  const third = buildQuery({ id: 'q3', name: 'thirdQuery' });
  const del = jest.spyOn(dataqueryService, 'del').mockResolvedValue({});
  seedApp({});
  act(() => {
    useStore.setState((s) => {
      s.dataQuery.queries.modules.canvas = [first, second, third];
    });
    state().setQueryMapping('canvas');
    state().queryPanel.setSelectedQuery('q3', 'canvas', { reveal: false });
    state().setRightSidebarOpen(false);
  });

  await act(async () => {
    state().dataQuery.deleteDataQueries('q2');
    await del.mock.results[0].value;
  });

  expect(state().dataQuery.queries.modules.canvas.map((q) => q.id)).toEqual(['q1', 'q3']);
  expect(state().queryPanel.selectedQuery?.id).toBe('q3');
  expect(state().isRightSidebarOpen).toBe(false);
  expect(state().getQueryNameIdMapping('canvas')).toEqual({ firstQuery: 'q1', thirdQuery: 'q3' });
  del.mockRestore();
});
