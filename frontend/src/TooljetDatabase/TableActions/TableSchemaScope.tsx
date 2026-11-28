import React, { useEffect, useMemo, useRef, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  TooljetDatabaseProvider,
  useTooljetDatabaseContext,
  type TjdbTable,
  type TooljetDatabaseContextValue,
} from '../TooljetDatabaseContext';
import { useTableSchema } from './useTableSchema';

const noop = () => {};

export interface TableSchemaScopeProps {
  table: TjdbTable;
  /** Shown while the schema loads. */
  fallback?: ReactNode;
  /** Called once when the schema could not be loaded (the failure is already toasted). */
  onError?: () => void;
  children: ReactNode;
}

// The Edit table and Add column forms read the table's schema from the page context, which describes the open table.
// A panel row can be any table, so this scope hands the forms a context for `table` instead. Writes stay in the scope;
// only when `table` is the open table do they also reach the page, so the grid stays in step.
export function TableSchemaScope({ table, fallback = null, onError, children }: TableSchemaScopeProps) {
  const page = useTooljetDatabaseContext();
  const schema = useTableSchema(table, page.organizationId);
  const isOpenTable = page.selectedTable?.id === table.id;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  useEffect(() => {
    if (schema.status === 'error') onErrorRef.current?.();
  }, [schema.status]);

  const { status, columns, foreignKeys, configurations, rows, setColumns, setForeignKeys, setConfigurations } = schema;

  const value = useMemo(() => {
    const write =
      <T,>(local: Dispatch<SetStateAction<T>>, toPage: Dispatch<SetStateAction<T>>): Dispatch<SetStateAction<T>> =>
      (next) => {
        local(next);
        if (isOpenTable) toPage(next);
      };

    // The page types its schema fields loosely, so the narrower scope setters are asserted into its shape once here.
    return {
      ...page,
      selectedTable: { id: table.id, table_name: table.table_name },
      columns,
      foreignKeys,
      configurations,
      selectedTableData: rows,
      setColumns: write(setColumns, page.setColumns as unknown as Dispatch<SetStateAction<typeof columns>>),
      setForeignKeys: write(setForeignKeys, page.setForeignKeys),
      setConfigurations: write(setConfigurations, page.setConfigurations),
      handleRefetchQuery: isOpenTable ? page.handleRefetchQuery : noop,
      getConfigurationProperty: (header: string, property: string, fallbackValue?: unknown) => {
        const configs = configurations as {
          columns?: {
            column_names?: Record<string, string>;
            configurations?: Record<string, Record<string, unknown>>;
          };
        };
        const columnUuid = configs?.columns?.column_names?.[header];
        const columnConfig = (columnUuid && configs?.columns?.configurations?.[columnUuid]) || {};
        return columnConfig[property] ? columnConfig[property] : fallbackValue;
      },
    } as TooljetDatabaseContextValue;
    // `page` is rebuilt whenever the page context changes; that is the intended trigger.
  }, [
    page,
    isOpenTable,
    table.id,
    table.table_name,
    columns,
    foreignKeys,
    configurations,
    rows,
    setColumns,
    setForeignKeys,
    setConfigurations,
  ]);

  if (status === 'loading') return <>{fallback}</>;
  if (status === 'error') return null;
  return <TooljetDatabaseProvider value={value}>{children}</TooljetDatabaseProvider>;
}
