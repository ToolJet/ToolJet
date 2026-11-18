// The tab strip above the grid: the open tables as tabs, the open-or-create picker and the open-tabs menu.
import '@/test/setupMsw';
import React, { useState } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { useLocation } from 'react-router-dom';
import { act, render, screen, waitFor, within, userEvent } from '@/test/test-utils';
import {
  TooljetDatabaseProvider,
  type TjdbTable,
  type TooljetDatabaseContextValue,
} from '@/TooljetDatabase/TooljetDatabaseContext';
import { SCHEMA_ENV_TOOLTIP } from '@/TooljetDatabase/constants';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { UnsavedChangesGuard } from '@/TooljetDatabase/_components/UnsavedChangesGuard';
import { setUnsaved, useUnsavedChanges } from '@/TooljetDatabase/_stores/unsavedChanges';
import { TableTabStrip } from '../TableTabStrip';
import { useOpenTabs } from '../useOpenTabs';
import { useTablesLimit } from '../useTablesLimit';

jest.mock(
  'focus-trap-react',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
);

const ORDERS: TjdbTable = { id: 'orders-id', table_name: 'orders' };
const USERS: TjdbTable = { id: 'users-id', table_name: 'users' };
const INVOICES: TjdbTable = { id: 'invoices-id', table_name: 'Invoices' };
const ALL = [ORDERS, USERS, INVOICES];

type HarnessProps = {
  open?: TjdbTable[];
  active?: TjdbTable;
  canEditSchema?: boolean;
  onExpand?: () => void;
  collapsed?: boolean;
};

function Harness({
  open = [ORDERS, USERS],
  active = ORDERS,
  canEditSchema = true,
  onExpand = () => {},
  collapsed = false,
}: HarnessProps) {
  const [tables, setTables] = useState<TjdbTable[]>(ALL);
  const [selectedTable, setSelectedTable] = useState<Partial<TjdbTable>>(active);
  const tabs = useOpenTabs({ organizationId: 'org-1', tables, selectedTable, setSelectedTable });
  const { reached: tablesLimitReached } = useTablesLimit(tables.length);
  // The first list load is what restores the saved tabs.
  const [loaded, setLoaded] = useState(false);
  if (!loaded) {
    setLoaded(true);
    window.localStorage.setItem(
      'tjdb-open-tabs:org-1',
      JSON.stringify({ ids: open.map((table) => table.id), activeId: active.id })
    );
  }
  React.useEffect(() => tabs.applyTables(ALL), []); // eslint-disable-line react-hooks/exhaustive-deps
  const value = {
    organizationId: 'org-1',
    canEditTjdb: true,
    canEditSchema,
    tables,
    setTables,
    selectedTable,
    setSelectedTable,
    ...tabs,
    tablesLimitReached,
  };
  return (
    <TooljetDatabaseProvider value={value as unknown as TooljetDatabaseContextValue}>
      <TableTabStrip panelCollapsed={collapsed} onExpandPanel={onExpand} />
      <UnsavedChangesGuard />
      <LocationProbe />
      <output data-testid="open-table">{selectedTable.table_name ?? ''}</output>
    </TooljetDatabaseProvider>
  );
}

const useUnsavedChangesSources = () => Object.keys(useUnsavedChanges.getState().sources);
const activeTable = () => screen.getByTestId('open-table');
const savedTabs = () => JSON.parse(window.localStorage.getItem('tjdb-open-tabs:org-1') ?? 'null');

function LocationProbe() {
  return <output data-testid="search">{useLocation().search}</output>;
}

beforeEach(() => {
  window.localStorage.clear();
  server.use(
    http.get('*/tooljet-db/tables/limits/:organizationId', () =>
      HttpResponse.json({ tablesCount: { current: 1, total: 10 } })
    )
  );
});

describe('TableTabStrip | tabs', () => {
  it('shows the open tables as tabs, the active one selected', async () => {
    render(<Harness />);

    expect(await screen.findByRole('tab', { name: 'orders' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'users' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.queryByRole('tab', { name: 'Invoices' })).not.toBeInTheDocument();
  });

  it('switches the open table when another tab is clicked', async () => {
    render(<Harness />);

    await userEvent.click(await screen.findByRole('tab', { name: 'users' }));

    expect(activeTable()).toHaveTextContent('users');
  });

  it('closes a tab and moves to its neighbour', async () => {
    render(<Harness />);
    await screen.findByRole('tab', { name: 'orders' });

    await userEvent.click(screen.getByRole('button', { name: 'Close orders' }));

    expect(screen.queryByRole('tab', { name: 'orders' })).not.toBeInTheDocument();
    expect(activeTable()).toHaveTextContent('users');
  });

  it('drops the view of a closed tab and keeps the others', async () => {
    render(<Harness />);
    await screen.findByRole('tab', { name: 'orders' });
    act(() => {
      const { setScrollTop } = useTjdbStore.getState().actions;
      setScrollTop(ORDERS.id, 120);
      setScrollTop(USERS.id, 80);
    });

    await userEvent.click(screen.getByRole('button', { name: 'Close orders' }));

    expect(Object.keys(useTjdbStore.getState().views)).toEqual([USERS.id]);
    expect(useTjdbStore.getState().views[USERS.id].scrollTop).toBe(80);
  });

  it('shows the expand button only while the panel is collapsed', async () => {
    const onExpand = jest.fn();
    const { rerender } = render(<Harness onExpand={onExpand} />);
    await screen.findByRole('tab', { name: 'orders' });
    expect(screen.queryByRole('button', { name: 'Expand tables panel' })).not.toBeInTheDocument();

    rerender(<Harness collapsed onExpand={onExpand} />);
    await userEvent.click(screen.getByRole('button', { name: 'Expand tables panel' }));

    expect(onExpand).toHaveBeenCalled();
  });
});

describe('TableTabStrip | persistence', () => {
  it('saves the open tabs in this browser and points the link at the open table', async () => {
    render(<Harness />);

    await userEvent.click(await screen.findByRole('tab', { name: 'users' }));

    await waitFor(() => expect(savedTabs()).toEqual({ ids: [ORDERS.id, USERS.id], activeId: USERS.id }));
    expect(screen.getByTestId('search')).toHaveTextContent(`?table=${USERS.id}`);
  });

  it('forgets the tabs and clears the link when every tab is closed', async () => {
    render(<Harness />);
    await userEvent.click(await screen.findByRole('button', { name: 'Open tabs and tab actions' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Close all tabs' }));

    await waitFor(() => expect(savedTabs()).toEqual({ ids: [], activeId: null }));
    expect(screen.getByTestId('search')).toBeEmptyDOMElement();
  });
});

describe('TableTabStrip | open or create', () => {
  it('lists every table, searches by name, and opens the one picked in a tab', async () => {
    render(<Harness />);
    await userEvent.click(await screen.findByRole('button', { name: 'Open or create a table' }));
    const picker = await screen.findByRole('dialog');

    expect(within(picker).getAllByRole('button', { name: /orders|users|Invoices/ })).toHaveLength(3);
    await userEvent.type(within(picker).getByRole('textbox', { name: 'Search tables' }), 'INV');
    expect(within(picker).queryByRole('button', { name: 'orders' })).not.toBeInTheDocument();

    await userEvent.click(within(picker).getByRole('button', { name: 'Invoices' }));

    expect(screen.getByRole('tab', { name: 'Invoices' })).toHaveAttribute('aria-selected', 'true');
    expect(activeTable()).toHaveTextContent('Invoices');
  });

  it('says so when no table matches', async () => {
    render(<Harness />);
    await userEvent.click(await screen.findByRole('button', { name: 'Open or create a table' }));

    await userEvent.type(await screen.findByRole('textbox', { name: 'Search tables' }), 'zzz');

    expect(screen.getByText('No tables match "zzz"')).toBeInTheDocument();
  });

  it('disables creating a table when the user cannot edit the schema', async () => {
    render(<Harness canEditSchema={false} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Open or create a table' }));

    expect(await screen.findByRole('button', { name: 'Create new table' })).toBeDisabled();
    expect(SCHEMA_ENV_TOOLTIP).toBeTruthy();
  });
});

describe('TableTabStrip | open tabs menu', () => {
  it('is disabled with no tabs', async () => {
    render(<Harness open={[]} />);

    expect(await screen.findByRole('button', { name: 'Open tabs and tab actions' })).toBeDisabled();
  });

  it('lists the open tabs with their count and switches to the one picked', async () => {
    render(<Harness />);
    await userEvent.click(await screen.findByRole('button', { name: 'Open tabs and tab actions' }));
    const menu = await screen.findByRole('dialog');

    expect(within(menu).getByText('Open tabs')).toBeInTheDocument();
    expect(within(menu).getByText('2')).toBeInTheDocument();
    await userEvent.click(within(menu).getByRole('button', { name: 'users' }));

    expect(activeTable()).toHaveTextContent('users');
  });

  it('closes every tab but the active one', async () => {
    render(<Harness open={[ORDERS, USERS, INVOICES]} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Open tabs and tab actions' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Close other tabs' }));

    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(screen.getByRole('tab', { name: 'orders' })).toBeInTheDocument();
  });

  it('cannot close other tabs when only one is open', async () => {
    render(<Harness open={[ORDERS]} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Open tabs and tab actions' }));

    expect(await screen.findByRole('button', { name: 'Close other tabs' })).toBeDisabled();
  });

  it('closes all tabs and leaves no table open', async () => {
    render(<Harness />);
    await userEvent.click(await screen.findByRole('button', { name: 'Open tabs and tab actions' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Close all tabs' }));

    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(activeTable()).toHaveTextContent('');
  });
});

describe('TableTabStrip | unsaved changes', () => {
  const markDirty = () => act(() => setUnsaved('inlineAddRow', true));
  const dialog = () => screen.queryByText('Discard unsaved changes?');

  it('asks before switching tabs, and keeps the table and the draft on Keep editing', async () => {
    render(<Harness />);
    await screen.findByRole('tab', { name: 'orders' });
    markDirty();

    await userEvent.click(screen.getByRole('tab', { name: 'users' }));
    expect(dialog()).toBeInTheDocument();
    expect(screen.getByText('Unsaved input in the new row will be lost.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

    expect(activeTable()).toHaveTextContent('orders');
    expect(dialog()).not.toBeInTheDocument();
    expect(useUnsavedChangesSources()).toContain('inlineAddRow');
  });

  it('switches tabs after Discard', async () => {
    render(<Harness />);
    await screen.findByRole('tab', { name: 'orders' });
    markDirty();

    await userEvent.click(screen.getByRole('tab', { name: 'users' }));
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    await waitFor(() => expect(activeTable()).toHaveTextContent('users'));
  });

  it('switches without asking when nothing is unsaved', async () => {
    render(<Harness />);

    await userEvent.click(await screen.findByRole('tab', { name: 'users' }));

    expect(dialog()).not.toBeInTheDocument();
    expect(activeTable()).toHaveTextContent('users');
  });

  it('does not ask for the tab that is already open', async () => {
    render(<Harness />);
    await screen.findByRole('tab', { name: 'orders' });
    markDirty();

    await userEvent.click(screen.getByRole('tab', { name: 'orders' }));

    expect(dialog()).not.toBeInTheDocument();
  });

  it('asks before closing the open tab, and closes it after Discard', async () => {
    render(<Harness />);
    await screen.findByRole('tab', { name: 'orders' });
    markDirty();

    await userEvent.click(screen.getByRole('button', { name: 'Close orders' }));
    expect(dialog()).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByRole('tab', { name: 'orders' })).toBeInTheDocument();
    expect(activeTable()).toHaveTextContent('orders');

    await userEvent.click(screen.getByRole('button', { name: 'Close orders' }));
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    await waitFor(() => expect(screen.queryByRole('tab', { name: 'orders' })).not.toBeInTheDocument());
    expect(activeTable()).toHaveTextContent('users');
  });

  it('closes a tab that is not open without asking: the draft belongs to the open table', async () => {
    render(<Harness />);
    await screen.findByRole('tab', { name: 'orders' });
    markDirty();

    await userEvent.click(screen.getByRole('button', { name: 'Close users' }));

    expect(dialog()).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'users' })).not.toBeInTheDocument();
    expect(activeTable()).toHaveTextContent('orders');
  });

  it('asks before another table is picked from the picker', async () => {
    render(<Harness />);
    await screen.findByRole('tab', { name: 'orders' });
    markDirty();

    await userEvent.click(screen.getByRole('button', { name: 'Open or create a table' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Invoices' }));
    expect(dialog()).toBeInTheDocument();
    expect(activeTable()).toHaveTextContent('orders');
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    await waitFor(() => expect(activeTable()).toHaveTextContent('Invoices'));
  });

  it('asks before the open-tabs menu closes every tab, but not for "Close other tabs"', async () => {
    render(<Harness />);
    await screen.findByRole('tab', { name: 'orders' });
    markDirty();

    await userEvent.click(screen.getByRole('button', { name: 'Open tabs and tab actions' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Close other tabs' }));
    expect(dialog()).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open tabs and tab actions' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Close all tabs' }));
    expect(dialog()).toBeInTheDocument();
    expect(activeTable()).toHaveTextContent('orders');
  });
});
