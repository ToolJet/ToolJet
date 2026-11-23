import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTjdbActions } from '../_stores/tjdbStore';
import { runUnlessDirty } from '../_stores/unsavedChanges';
import type { TjdbTable } from '../TooljetDatabaseContext';
import {
  closeAllTabs,
  closeOtherTabs,
  closeTab,
  openTab,
  parseStoredTabs,
  settleTabs,
  type TabsState,
} from './openTabs';

const TABLE_PARAM = 'table';
const storageKey = (organizationId: string) => `tjdb-open-tabs:${organizationId}`;

function readStored(organizationId: string | null): TabsState | null {
  try {
    return parseStoredTabs(organizationId ? localStorage.getItem(storageKey(organizationId)) : null);
  } catch {
    return null;
  }
}

function writeStored(organizationId: string, state: TabsState) {
  try {
    localStorage.setItem(storageKey(organizationId), JSON.stringify(state));
  } catch {
    // Private mode or a full quota: tabs just stop surviving a reload.
  }
}

export interface UseOpenTabsArgs {
  organizationId: string | null;
  /** The loaded table list, for names (a rename must reach the tab that is shown next). */
  tables: TjdbTable[];
  selectedTable: Partial<TjdbTable>;
  setSelectedTable: Dispatch<SetStateAction<Partial<TjdbTable>>>;
}

export interface OpenTabs {
  openTabIds: string[];
  /** Opens `table` in a tab (or switches to it) and makes it the open table. */
  openTable: (table: TjdbTable) => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  /**
   * Called with every loaded table list. The first one restores the tabs (the `?table=` link, then the tabs saved in
   * this browser); later ones drop tabs whose table no longer exists. `opened` is a table to open on top.
   */
  applyTables: (tables: TjdbTable[], opened?: TjdbTable | null) => void;
}

// Owns which tables are open in tabs. The active tab is `selectedTable`; there is no second copy of it.
export function useOpenTabs({ organizationId, tables, selectedTable, setSelectedTable }: UseOpenTabsArgs): OpenTabs {
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { pruneViews } = useTjdbActions();

  // The callbacks below are handed to hooks that capture them once, so they read the latest state through refs.
  const stateRef = useRef<TabsState>({ ids: openTabIds, activeId: selectedTable.id ?? null });
  stateRef.current = { ids: openTabIds, activeId: selectedTable.id ?? null };
  const tablesRef = useRef<TjdbTable[]>(tables);
  tablesRef.current = tables;
  const restoredRef = useRef(false);
  const urlTableRef = useRef(searchParams.get(TABLE_PARAM));

  const show = useCallback(
    (next: TabsState) => {
      setOpenTabIds(next.ids);
      if (next.activeId === stateRef.current.activeId) return;
      const table = tablesRef.current.find((candidate) => candidate.id === next.activeId);
      setSelectedTable(table ? { id: table.id, table_name: table.table_name } : {});
    },
    [setSelectedTable]
  );

  // Switching the open table drops whatever unsaved input the old one holds (the grid's add row, an open editor), so
  // it asks first. Closing a tab that is not open, or opening the open one, changes nothing and never asks.
  const openTable = useCallback(
    (table: TjdbTable) => {
      const open = () => {
        if (!tablesRef.current.some((candidate) => candidate.id === table.id)) {
          tablesRef.current = [...tablesRef.current, table];
        }
        setOpenTabIds(openTab(stateRef.current, table.id).ids);
        setSelectedTable({ id: table.id, table_name: table.table_name });
      };
      if (table.id === stateRef.current.activeId) open();
      else runUnlessDirty(open);
    },
    [setSelectedTable]
  );

  const showAfter = useCallback(
    (next: () => TabsState) => {
      const apply = () => show(next());
      if (next().activeId === stateRef.current.activeId) apply();
      else runUnlessDirty(apply);
    },
    [show]
  );

  const closeOne = useCallback((id: string) => showAfter(() => closeTab(stateRef.current, id)), [showAfter]);
  const closeOthers = useCallback((id: string) => showAfter(() => closeOtherTabs(stateRef.current, id)), [showAfter]);
  const closeAll = useCallback(() => showAfter(closeAllTabs), [showAfter]);

  const applyTables = useCallback(
    (tables: TjdbTable[], opened?: TjdbTable | null) => {
      tablesRef.current = tables;
      const existing = tables.map((table) => table.id);
      let next: TabsState;
      if (restoredRef.current) {
        next = settleTabs(stateRef.current, existing);
      } else {
        restoredRef.current = true;
        next = settleTabs(readStored(organizationId), existing);
        const linked = urlTableRef.current;
        if (linked && existing.includes(linked)) next = openTab(next, linked);
      }
      if (opened && existing.includes(opened.id)) next = openTab(next, opened.id);
      show(next);
    },
    [organizationId, show]
  );

  // A table's view (filters, sort, page, scroll) lasts as long as its tab.
  useEffect(() => {
    pruneViews(openTabIds);
  }, [openTabIds, pruneViews]);

  // Persist, and keep the address bar pointing at the open table. Nothing is written until the first restore, or the
  // empty initial state would overwrite what was saved.
  useEffect(() => {
    if (!restoredRef.current) return;
    if (organizationId) writeStored(organizationId, { ids: openTabIds, activeId: selectedTable.id ?? null });
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        if (selectedTable.id) params.set(TABLE_PARAM, selectedTable.id);
        else params.delete(TABLE_PARAM);
        return params;
      },
      { replace: true }
    );
  }, [openTabIds, selectedTable.id, organizationId, setSearchParams]);

  return {
    openTabIds,
    openTable,
    closeTab: closeOne,
    closeOtherTabs: closeOthers,
    closeAllTabs: closeAll,
    applyTables,
  };
}
