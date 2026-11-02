import React, { createContext, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

export type TooljetDatabaseContextValue = {
  canEditTjdb: boolean;
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
  queryFilters: Record<string, unknown>;
  setQueryFilters: Dispatch<SetStateAction<Record<string, unknown>>>;
  sortFilters: Record<string, unknown>;
  setSortFilters: Dispatch<SetStateAction<Record<string, unknown>>>;
  selectRows: unknown[];
  setSelectRows: Dispatch<SetStateAction<unknown[]>>;
  pageCount: number;
  setPageCount: Dispatch<SetStateAction<number>>;
  pageSize: number;
  setPageSize: Dispatch<SetStateAction<number>>;
  handleRefetchQuery: (...args: unknown[]) => unknown;
  foreignKeys: unknown[];
  configurations: Record<string, unknown>;
  setForeignKeys: Dispatch<SetStateAction<unknown[]>>;
  setConfigurations: Dispatch<SetStateAction<Record<string, unknown>>>;
};

type TooljetDatabaseProviderProps = {
  value: TooljetDatabaseContextValue;
  children: ReactNode;
};

const TooljetDatabaseContext = createContext<TooljetDatabaseContextValue>({
  canEditTjdb: false,
  organizationId: null,
  setOrganizationId: () => {},
  selectedTable: '',
  setSelectedTable: () => {},
  searchParam: '',
  setSearchParam: () => {},
  selectedTableData: [],
  setSelectedTableData: () => {},
  tables: [],
  setTables: () => {},
  columns: [],
  setColumns: () => {},
  totalRecords: 0,
  setTotalRecords: () => {},
  loadingState: false,
  setLoadingState: () => {},
  handleBuildFilterQuery: () => {},
  handleBuildSortQuery: () => {},
  buildPaginationQuery: () => {},
  resetSortQuery: () => {},
  resetFilterQuery: () => {},
  queryFilters: {},
  setQueryFilters: () => {},
  sortFilters: {},
  setSortFilters: () => {},
  selectRows: [],
  setSelectRows: () => {},
  pageCount: 1,
  setPageCount: () => {},
  pageSize: 50,
  setPageSize: () => {},
  handleRefetchQuery: () => {},
  foreignKeys: [],
  configurations: {},
  setForeignKeys: () => [],
  setConfigurations: () => {},
});

export const TooljetDatabaseProvider = ({ value, children }: TooljetDatabaseProviderProps) => (
  <TooljetDatabaseContext.Provider value={value}>{children}</TooljetDatabaseContext.Provider>
);

export const useTooljetDatabaseContext = (): TooljetDatabaseContextValue => useContext(TooljetDatabaseContext);
