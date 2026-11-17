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
  selectedTableData: unknown[];
  setSelectedTableData: Dispatch<SetStateAction<unknown[]>>;
  tables: unknown[];
  setTables: Dispatch<SetStateAction<unknown[]>>;
  tablesLoaded: boolean;
  setTablesLoaded: Dispatch<SetStateAction<boolean>>;
  /** The workspace has used all the tables its plan allows. Read once per page, in `index.jsx`. */
  tablesLimitReached: boolean;
  columns: unknown[];
  setColumns: Dispatch<SetStateAction<unknown[]>>;
  totalRecords: number;
  setTotalRecords: Dispatch<SetStateAction<number>>;
  loadingState: boolean;
  setLoadingState: Dispatch<SetStateAction<boolean>>;
  handleBuildFilterQuery: (...args: unknown[]) => unknown;
  handleBuildSortQuery: (...args: unknown[]) => unknown;
  buildPaginationQuery: (...args: unknown[]) => unknown;
  resetSortQuery: (...args: unknown[]) => unknown;
  resetFilterQuery: (...args: unknown[]) => unknown;
  resetAll: (...args: unknown[]) => unknown;
  selectRows: unknown[];
  setSelectRows: Dispatch<SetStateAction<unknown[]>>;
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
