import { useEffect } from 'react';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { readCell, toCsv } from './tableModel';
import type { Entry, FireOption, LiveRef, Sort, WithEdits } from './types';

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
  setSearchInput: (text: string) => void;
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
  setSearchInput,
  discard,
}: UseTableActionsArgs) => {
  const exportRows = () => live.current.processed.map(withEdits);
  const runDownload = (type: DownloadType) => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const base = `${componentName || 'table'}_${stamp}`;
    if (type === 'json') download(`${base}.json`, stringify(exportRows(), 2), 'application/json');
    else download(`${base}.csv`, toCsv(exportRows(), live.current.columns), 'text/csv;charset=utf-8');
  };

  useEffect(() => {
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
    setExposedVariables({
      pageIndex: 1,
      searchText: '',
      sortApplied: [],
      filters: [],
      changeSet: {},
      dataUpdates: [],
      lastActionClicked: {},
      // As on the native Table, setPage does not fire onPageChanged.
      setPage: async (target: unknown) => goTo(target, { fire: false }),
      selectRow: async (key: unknown, value: unknown) => {
        const [match] = byKeyValue(key, value);
        if (match) select(new Set([match.key]), match.key);
      },
      deselectRow: async () => select(new Set(), null),
      selectRows: async (key: unknown, values: unknown) => {
        const keys = new Set(live.current.selected);
        byKeyValues(key, values).forEach((entry) => keys.add(entry.key));
        select(keys, live.current.focusKey);
      },
      deselectRows: async (key: unknown, values: unknown) => {
        const keys = new Set(live.current.selected);
        byKeyValues(key, values).forEach((entry) => keys.delete(entry.key));
        select(keys, live.current.focusKey);
      },
      selectAllRows: async () =>
        select(new Set(live.current.processed.map((entry) => entry.key)), live.current.focusKey),
      deselectAllRows: async () => select(new Set(), null),
      setFilters: async (list: unknown) => applyFilterList(list),
      clearFilters: async () => applyFilterList([]),
      setSort: async (columnKey: unknown, direction: unknown) =>
        applySort(
          isSet(columnKey) && (direction === 'asc' || direction === 'desc')
            ? { key: String(columnKey), direction }
            : null
        ),
      setSearchText: async (text: unknown) => setSearchInput(String(text ?? '')),
      discardChanges: async () => discard({ fire: false }),
      downloadTableData: async (type: unknown) =>
        runDownload(
          String(type ?? 'csv')
            .toLowerCase()
            .includes('json')
            ? 'json'
            : 'csv'
        ),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return runDownload;
};
