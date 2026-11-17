import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { useTjdbActions } from '../_stores/tjdbStore';
import type { TjdbTable } from '../TooljetDatabaseContext';
import type { TableColumn } from './editTableFormData';

interface SchemaData {
  columns: TableColumn[];
  foreignKeys: unknown[];
  configurations: Record<string, unknown>;
  /** At most one row: enough to tell whether the table has any. */
  rows: unknown[];
}

type SchemaState = SchemaData & { status: 'loading' | 'ready' | 'error' };

const LOADING: SchemaState = { status: 'loading', columns: [], foreignKeys: [], configurations: {}, rows: [] };

export interface TableSchema extends SchemaState {
  setColumns: Dispatch<SetStateAction<TableColumn[]>>;
  setForeignKeys: Dispatch<SetStateAction<unknown[]>>;
  setConfigurations: Dispatch<SetStateAction<Record<string, unknown>>>;
}

// Loads one table's schema (columns, foreign keys, configurations) and whether it has rows, independent of which table
// the grid has open. A failed load is toasted and ends as status 'error'. The setters edit the loaded copy only.
export function useTableSchema(table: TjdbTable, organizationId: string | null): TableSchema {
  const { fetchTableMetadata } = useTjdbActions();
  const [schema, setSchema] = useState<SchemaState>(LOADING);

  useEffect(() => {
    let cancelled = false;
    setSchema(LOADING);

    Promise.all([
      fetchTableMetadata(organizationId, table.table_name),
      tooljetDatabaseService.findOne(table.id, 'limit=1'),
    ])
      .then(([metadata, rowsResult]) => {
        if (cancelled) return;
        if (!metadata) {
          setSchema({ ...LOADING, status: 'error' });
          return;
        }
        if (rowsResult?.error) {
          toast.error(rowsResult.error?.message ?? 'Something went wrong');
          setSchema({ ...LOADING, status: 'error' });
          return;
        }
        setSchema({
          status: 'ready',
          columns: metadata.columns,
          foreignKeys: metadata.foreignKeys,
          configurations: metadata.configurations,
          rows: Array.isArray(rowsResult?.data) ? rowsResult.data : [],
        });
      })
      .catch((error: Error) => {
        if (cancelled) return;
        toast.error(error?.message ?? 'Something went wrong');
        setSchema({ ...LOADING, status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId, table.id, table.table_name, fetchTableMetadata]);

  // Accepts a value or an updater, like React's own setters.
  const setField = useCallback(
    <K extends keyof SchemaData>(key: K): Dispatch<SetStateAction<SchemaData[K]>> =>
      (next) =>
        setSchema((previous) => ({
          ...previous,
          [key]: typeof next === 'function' ? (next as (value: SchemaData[K]) => SchemaData[K])(previous[key]) : next,
        })),
    []
  );

  return {
    ...schema,
    setColumns: setField('columns'),
    setForeignKeys: setField('foreignKeys'),
    setConfigurations: setField('configurations'),
  };
}
