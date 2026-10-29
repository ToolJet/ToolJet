import React, { useContext, ReactNode, Dispatch, SetStateAction } from 'react';
// Single context object, defined in context.js so components outside the TooljetDatabase page
// (e.g. the shared page Header) can read it without pulling in index.jsx's import chain.
// This file only adds the provider + hook sugar on top; both `useContext(TooljetDatabaseContext)`
// and `useTooljetDatabaseContext()` therefore resolve against the same provider.
import { TooljetDatabaseContext } from './context';

export type TooljetDatabaseContextValue = {
  canEditTjdb: boolean;
  canEditSchema: boolean;
  organizationId: string | null;
  setOrganizationId: Dispatch<SetStateAction<string | null>>;
  selectedTable: string;
  setSelectedTable: Dispatch<SetStateAction<string>>;
  searchParam: string;
  setSearchParam: Dispatch<SetStateAction<string>>;
  selectedTableData: unknown[];
  setSelectedTableData: Dispatch<SetStateAction<unknown[]>>;
  tables: unknown[];
  setTables: Dispatch<SetStateAction<unknown[]>>;
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
