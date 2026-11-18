import React, { useContext, ReactNode, Dispatch, SetStateAction } from 'react';
// Single context object, defined in context.js so components can read it without pulling in
// index.jsx's import chain. This file only adds the provider + hook sugar on top; both
// `useContext(TooljetDatabaseContext)` and `useTooljetDatabaseContext()` therefore resolve against
// the same provider.
import { TooljetDatabaseContext } from './context';
import type { OpenTabs } from './TablesPanel/useOpenTabs';

/** A table as the page holds it. The open table is `{}` while none is open. */
export type TjdbTable = { id: string; table_name: string };

export type TooljetDatabaseContextValue = {
  canEditTjdb: boolean;
  canEditSchema: boolean;
  organizationId: string | null;
  setOrganizationId: Dispatch<SetStateAction<string | null>>;
  selectedTable: Partial<TjdbTable>;
  setSelectedTable: Dispatch<SetStateAction<Partial<TjdbTable>>>;
  /** Tables open in tabs, in tab order. The active one is `selectedTable`. */
  openTabIds: string[];
  openTable: OpenTabs['openTable'];
  closeTab: OpenTabs['closeTab'];
  closeOtherTabs: OpenTabs['closeOtherTabs'];
  closeAllTabs: OpenTabs['closeAllTabs'];
  applyTables: OpenTabs['applyTables'];
  /** The open page of the open table's rows, from useTableRows. */
  selectedTableData: unknown[];
  tables: unknown[];
  setTables: Dispatch<SetStateAction<unknown[]>>;
  tablesLoaded: boolean;
  setTablesLoaded: Dispatch<SetStateAction<boolean>>;
  /** The workspace has used all the tables its plan allows. Read once per page, in `index.jsx`. */
  tablesLimitReached: boolean;
  columns: unknown[];
  setColumns: Dispatch<SetStateAction<unknown[]>>;
  totalRecords: number;
  /** No rows to show yet for the open view. A refetch behind rows already on screen does not count. */
  rowsLoading: boolean;
  /** A refetch behind rows already on screen: the opposite of rowsLoading, never both. */
  rowsRefetching: boolean;
  /** The tables list fetch, owned by the tables panel. */
  loadingState: boolean;
  setLoadingState: Dispatch<SetStateAction<boolean>>;
  selectRows: unknown[];
  setSelectRows: Dispatch<SetStateAction<unknown[]>>;
  /** Refetches the open view after a write. Arguments are ignored. */
  handleRefetchQuery: (...args: unknown[]) => unknown;
  foreignKeys: unknown[];
  configurations: Record<string, unknown>;
  setForeignKeys: Dispatch<SetStateAction<unknown[]>>;
  setConfigurations: Dispatch<SetStateAction<Record<string, unknown>>>;
  getConfigurationProperty: (header: string, property: string, fallback?: unknown) => unknown;
};

type TooljetDatabaseProviderProps = {
  value: TooljetDatabaseContextValue;
  children: ReactNode;
};

export const TooljetDatabaseProvider = ({ value, children }: TooljetDatabaseProviderProps) => (
  <TooljetDatabaseContext.Provider value={value}>{children}</TooljetDatabaseContext.Provider>
);

export const useTooljetDatabaseContext = (): TooljetDatabaseContextValue =>
  useContext(TooljetDatabaseContext) as TooljetDatabaseContextValue;

export { TooljetDatabaseContext };
