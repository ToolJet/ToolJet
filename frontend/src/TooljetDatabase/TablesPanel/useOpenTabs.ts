import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TjdbTable } from '../TooljetDatabaseContext';
import {
  closeAllTabs,
  closeOtherTabs,
  closeTab,
  openTab,
  parseStoredTabs,
  reconcileTabs,
  type TabsState,
} from './openTabs';

const TABLE_PARAM = 'table';
const storageKey = (organizationId: string) => `tjdb-open-tabs:${organizationId}`;

function readStored(organizationId: string | null): TabsState {
  try {
    return parseStoredTabs(organizationId ? localStorage.getItem(storageKey(organizationId)) : null);
  } catch {
    return parseStoredTabs(null);
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

  const openTable = useCallback(
    (table: TjdbTable) => {
      if (!tablesRef.current.some((candidate) => candidate.id === table.id)) {
        tablesRef.current = [...tablesRef.current, table];
      }
      setOpenTabIds(openTab(stateRef.current, table.id).ids);
      setSelectedTable({ id: table.id, table_name: table.table_name });
    },
    [setSelectedTable]
  );

  const closeOne = useCallback((id: string) => show(closeTab(stateRef.current, id)), [show]);
  const closeOthers = useCallback((id: string) => show(closeOtherTabs(stateRef.current, id)), [show]);
  const closeAll = useCallback(() => show(closeAllTabs()), [show]);

  const applyTables = useCallback(
    (tables: TjdbTable[], opened?: TjdbTable | null) => {
      tablesRef.current = tables;
      const existing = tables.map((table) => table.id);
      let next: TabsState;
      if (restoredRef.current) {
        next = reconcileTabs(stateRef.current, existing);
      } else {
        restoredRef.current = true;
        next = reconcileTabs(readStored(organizationId), existing);
        const linked = urlTableRef.current;
        if (linked && existing.includes(linked)) next = openTab(next, linked);
      }
      if (opened && existing.includes(opened.id)) next = openTab(next, opened.id);
      show(next);
    },
    [organizationId, show]
  );

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
