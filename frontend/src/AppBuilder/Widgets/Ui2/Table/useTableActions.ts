import { useEffect } from 'react';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { asActions, useLatest } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { readCell, toCsv } from './tableModel';
import type { Entry, FireOption, LiveRef, Sort, WithEdits } from './types';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/values';

export type DownloadType = 'csv' | 'json';

interface UseTableActionsArgs {
  live: LiveRef;
  componentName?: string;
  withEdits: WithEdits;
  setExposedVariables: WidgetProps['setExposedVariables'];
  goTo: (target: unknown, options?: FireOption) => void;
  select: (keys: Set<string>, focus: string | null) => void;
  applyFilterList: (list: unknown, options?: FireOption) => void;
  applySort: (next: Sort | null, options?: FireOption) => void;
  searchNow: (text: string) => void;
  discard: (options?: FireOption) => void;
}

const download = (name: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** The Table's download, and its component actions (selectRow, setFilters, downloadTableData, ...) published once on mount. */
export const useTableActions = ({
  live,
  componentName,
  withEdits,
  setExposedVariables,
  goTo,
  select,
  applyFilterList,
  applySort,
  searchNow,
  discard,
}: UseTableActionsArgs) => {
  const exportRows = () => live.current.processed.map(withEdits);
  const runDownload = (type: DownloadType) => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const base = `${componentName || 'table'}_${stamp}`;
    if (type === 'json') download(`${base}.json`, stringify(exportRows(), 2), 'application/json');
    else download(`${base}.csv`, toCsv(exportRows(), live.current.columns), 'text/csv;charset=utf-8');
  };

  // The actions are published once and call the latest handlers, so they never act on an earlier render's columns.
  const handlers = useLatest({ goTo, select, applyFilterList, applySort, searchNow, discard, runDownload });
  const publish = useLatest(setExposedVariables);
  useEffect(() => {
    const act = () => handlers.current;
    // A column key is text or a number; anything else (an action called with a list as the key) matches nothing.
    const isKey = (key: unknown): key is string | number =>
      (typeof key === 'string' && key !== '') || typeof key === 'number';
    const byKeyValue = (key: unknown, value: unknown): Entry[] =>
      isKey(key) ? live.current.entries.filter((entry) => readCell(entry.row, key) == value) : []; // eslint-disable-line eqeqeq
    // The rows whose cell equals any of `values`, in one pass over the rows: matching each value against every row took
    // minutes for 10k values on 10k rows. Cells and values compare as text, as == does for text and numbers.
    const byKeyValues = (key: unknown, values: unknown): Entry[] => {
      if (!isKey(key)) return [];
      const wanted = new Set(
        (Array.isArray(values) ? values : [values])
          .filter((v) => v !== null && v !== undefined && typeof v !== 'object')
          .map(String)
      );
      return live.current.entries.filter((entry) => {
        const cell = readCell(entry.row, key);
        return cell !== null && cell !== undefined && typeof cell !== 'object' && wanted.has(String(cell));
      });
    };
    publish.current(
      asActions({
        pageIndex: 1,
        searchText: '',
        sortApplied: [],
        filters: [],
        changeSet: {},
        dataUpdates: [],
        lastActionClicked: {},
        // As on the native Table, setPage does not fire onPageChanged.
        setPage: async (target: unknown) => act().goTo(target, { fire: false }),
        selectRow: async (key: unknown, value: unknown) => {
          const [match] = byKeyValue(key, value);
          if (match) act().select(new Set([match.key]), match.key);
        },
        deselectRow: async () => act().select(new Set(), null),
        selectRows: async (key: unknown, values: unknown) => {
          const keys = new Set(live.current.selected);
          byKeyValues(key, values).forEach((entry) => keys.add(entry.key));
          act().select(keys, live.current.focusKey);
        },
        deselectRows: async (key: unknown, values: unknown) => {
          const keys = new Set(live.current.selected);
          byKeyValues(key, values).forEach((entry) => keys.delete(entry.key));
          act().select(keys, live.current.focusKey);
        },
        selectAllRows: async () =>
          act().select(new Set(live.current.processed.map((entry) => entry.key)), live.current.focusKey),
        deselectAllRows: async () => act().select(new Set(), null),
        setFilters: async (list: unknown) => act().applyFilterList(list),
        clearFilters: async () => act().applyFilterList([]),
        setSort: async (columnKey: unknown, direction: unknown) =>
          act().applySort(
            isSet(columnKey) && (direction === 'asc' || direction === 'desc')
              ? { key: String(columnKey), direction }
              : null
          ),
        setSearchText: async (text: unknown) => act().searchNow(String(text ?? '')),
        discardChanges: async () => act().discard({ fire: false }),
        downloadTableData: async (type: unknown) =>
          act().runDownload(
            String(type ?? 'csv')
              .toLowerCase()
              .includes('json')
              ? 'json'
              : 'csv'
          ),
      })
    );
  }, [live, handlers, publish]);

  return runDownload;
};
