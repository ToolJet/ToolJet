import { useEffect } from 'react';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { readCell, toCsv } from './tableModel';

const download = (name, content, mime) => {
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
}) => {
  const exportRows = () => live.current.processed.map(withEdits);
  const runDownload = (type) => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const base = `${componentName || 'table'}_${stamp}`;
    if (type === 'json') download(`${base}.json`, stringify(exportRows(), 2), 'application/json');
    else download(`${base}.csv`, toCsv(exportRows(), live.current.columns), 'text/csv;charset=utf-8');
  };

  useEffect(() => {
    // A column key is text or a number; anything else (an action called with a list as the key) matches nothing.
    const isKey = (key) => (typeof key === 'string' && key !== '') || typeof key === 'number';
    const byKeyValue = (key, value) =>
      isKey(key) ? live.current.entries.filter((entry) => readCell(entry.row, key) == value) : []; // eslint-disable-line eqeqeq
    // The rows whose cell equals any of `values`, in one pass over the rows: matching each value against every row took
    // minutes for 10k values on 10k rows. Cells and values compare as text, as == does for text and numbers.
    const byKeyValues = (key, values) => {
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
      setPage: async (target) => goTo(target, { fire: false }),
      selectRow: async (key, value) => {
        const [match] = byKeyValue(key, value);
        if (match) select(new Set([match.key]), match.key);
      },
      deselectRow: async () => select(new Set(), null),
      selectRows: async (key, values) => {
        const keys = new Set(live.current.selected);
        byKeyValues(key, values).forEach((entry) => keys.add(entry.key));
        select(keys, live.current.focusKey);
      },
      deselectRows: async (key, values) => {
        const keys = new Set(live.current.selected);
        byKeyValues(key, values).forEach((entry) => keys.delete(entry.key));
        select(keys, live.current.focusKey);
      },
      selectAllRows: async () =>
        select(new Set(live.current.processed.map((entry) => entry.key)), live.current.focusKey),
      deselectAllRows: async () => select(new Set(), null),
      setFilters: async (list) => applyFilterList(list),
      clearFilters: async () => applyFilterList([]),
      setSort: async (columnKey, direction) =>
        applySort(
          isSet(columnKey) && ['asc', 'desc'].includes(direction) ? { key: String(columnKey), direction } : null
        ),
      setSearchText: async (text) => setSearchInput(String(text ?? '')),
      discardChanges: async () => discard({ fire: false }),
      downloadTableData: async (type) =>
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
