import React, { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Columns3,
  Download,
  Filter,
  Inbox,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
import { initials, useAutoHeight } from '../packHooks';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Checkbox,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Skeleton,
  cn,
} from './ui';
import { Shell } from './Shadcn';
import { Pager } from './Pager';
import { badgeLook, isSet } from './kanbanLook';
import { lookVars } from './shadcnLook';
import { pageOf } from './listModel';
import {
  FILTER_CONDITIONS,
  applyFilters,
  cellStyleFor,
  matchesCondition,
  formatCell,
  matchesSearch,
  normalizeColumns,
  readCell,
  rowKey,
  sortRows,
  toCsv,
} from './tableModel';
import { stringify } from '../packJson';

// shadcn/ui pack Table (experiment). Native Table conventions (property, event, exposed and action names; server-side
// pagination, search, sort and filters), the shadcn data-table look, and none of the native table's known failure
// modes: rows have a stable identity (idField), search text is never a regex, a cell that fails renders a dash instead
// of taking the app down, large data is virtualised, and each user action publishes its state once and then fires its
// event, so handlers read the new value.

const ROW_HEIGHT = { condensed: 36, regular: 44, spacious: 56 };
const VIRTUALIZE_ABOVE = 150;
const SEARCH_DEBOUNCE_MS = 300;

const BADGE_BY_STATUS = {
  active: 'success',
  approved: 'success',
  available: 'success',
  completed: 'success',
  confirmed: 'success',
  delivered: 'success',
  done: 'success',
  paid: 'success',
  success: 'success',
  pending: 'warning',
  processing: 'warning',
  review: 'warning',
  maintenance: 'warning',
  draft: 'secondary',
  open: 'secondary',
  new: 'secondary',
  inactive: 'secondary',
  cancelled: 'destructive',
  canceled: 'destructive',
  failed: 'destructive',
  overdue: 'destructive',
  rejected: 'destructive',
  blocked: 'destructive',
};

const ROW_BORDER = 'border-[color:var(--lk-border,var(--sc-border))]';
const MUTED = 'text-[color:var(--lk-muted,var(--sc-muted-foreground))]';

/** Keeps one broken cell (a bad value, a throwing binding) from taking the table or the app down. */
class CellBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(previous) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? <span className={MUTED}>—</span> : this.props.children;
  }
}

/** A column option that may be a per-row binding: "{{rowData.amount < 0 ? '#dc2626' : ''}}". */
const useCellResolver = () => {
  const getResolvedValue = useStore((state) => state.getResolvedValue);
  return (value, row, cellValue) => {
    if (typeof value !== 'string' || !value.includes('{{')) return value;
    try {
      return getResolvedValue(value, { rowData: row, cellValue });
    } catch {
      return undefined;
    }
  };
};

const BadgeCell = ({ value, column, badgeColors }) => {
  if (!isSet(value)) return null;
  const own = badgeLook(value, column.badgeColors) ?? badgeLook(value, badgeColors);
  const option = column.options?.find((o) => String(o?.value ?? o) === String(value));
  const label = String(option?.label ?? value);
  return own ? (
    <Badge
      variant="outline"
      style={own}
      className="border-transparent bg-[color:var(--kb-badge-bg)] text-[color:var(--kb-badge-fg)]"
    >
      {label}
    </Badge>
  ) : (
    <Badge variant={BADGE_BY_STATUS[String(value).toLowerCase()] || 'outline'}>{label}</Badge>
  );
};

const renderCell = ({ value, row, column, properties, resolve, onAction, rowIndex }) => {
  const format = {
    ...column.format,
    currency: column.format.currency ?? properties.currency,
    locale: column.format.locale ?? properties.locale,
    dateFormat: column.format.dateFormat ?? properties.dateFormat,
  };
  const shown = column.transformation ? resolve(column.transformation, row, value) : value;
  switch (column.type) {
    case 'badge':
      return <BadgeCell value={shown} column={column} badgeColors={properties.badgeColors} />;
    case 'tags': {
      const tags = (Array.isArray(shown) ? shown : isSet(shown) ? String(shown).split(',') : [])
        .map((t) => String(t?.label ?? t).trim())
        .filter(Boolean);
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[11px] font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      );
    }
    case 'boolean':
      return shown === true || shown === 'true' ? (
        <Check className="h-4 w-4 text-[color:var(--sc-primary)]" aria-label="Yes" />
      ) : (
        <span className={MUTED} aria-label="No">
          —
        </span>
      );
    case 'link': {
      if (!isSet(shown)) return null;
      const text = resolve(column.linkText, row, shown);
      return (
        <a
          href={String(shown)}
          target={column.openInNewTab ? '_blank' : '_self'}
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-[color:var(--sc-primary)] underline-offset-4 hover:underline"
        >
          {String(isSet(text) ? text : shown)}
        </a>
      );
    }
    case 'image':
      return isSet(shown) ? (
        <img
          src={String(shown)}
          alt=""
          loading="lazy"
          className={cn('h-8 w-8 object-cover', column.imageShape === 'square' ? 'rounded-md' : 'rounded-full')}
        />
      ) : null;
    case 'avatar':
      return isSet(shown) ? (
        <span className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            {typeof shown === 'object' && shown?.src ? <AvatarImage src={shown.src} alt="" /> : null}
            <AvatarFallback className="text-[11px]">
              {initials(typeof shown === 'object' ? shown?.name : shown)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{String(typeof shown === 'object' ? shown?.name ?? '' : shown)}</span>
        </span>
      ) : null;
    case 'progress': {
      const n = Number(shown);
      if (!Number.isFinite(n)) return null;
      const pct = Math.max(0, Math.min(100, (n / (column.maxValue || 100)) * 100));
      return (
        <span className="flex min-w-[96px] items-center gap-2">
          <Progress value={pct} className="h-1.5" />
          <span className={cn('w-9 text-right text-xs tabular-nums', MUTED)}>{Math.round(pct)}%</span>
        </span>
      );
    }
    case 'button':
      return (
        <span className="flex items-center justify-end gap-1.5">
          {(column.buttons ?? []).map((button, i) => {
            const id = String(button.id ?? button.buttonId ?? `button${i + 1}`);
            // Rules are data ({ key, condition, value }); a binding inside the columns binding would end it early.
            const when = (rule) =>
              rule && typeof rule === 'object' && matchesCondition(readCell(row, rule.key), rule.condition, rule.value);
            if (resolve(button.visible ?? button.buttonVisibility, row, value) === false || when(button.hiddenWhen)) {
              return null;
            }
            const disabled =
              resolve(button.disabled ?? button.disableButton, row, value) === true || when(button.disabledWhen);
            const label = resolve(button.label ?? button.buttonLabel ?? 'Action', row, value);
            const variant = button.variant ?? (button.buttonType === 'solid' ? 'default' : 'outline');
            return (
              <Button
                key={id}
                size="sm"
                variant={
                  ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'].includes(variant)
                    ? variant
                    : 'outline'
                }
                className="h-7 px-2.5 text-xs"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(id, column, row, rowIndex);
                }}
              >
                {String(label ?? '')}
              </Button>
            );
          })}
        </span>
      );
    case 'html':
      return isSet(shown) ? <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(shown)) }} /> : null;
    case 'json':
      return isSet(shown) ? (
        <code className="block max-w-[320px] truncate rounded bg-muted px-1.5 py-0.5 text-xs">
          {typeof shown === 'object' ? stringify(shown) : String(shown)}
        </code>
      ) : null;
    default:
      return formatCell(shown, { ...column, format });
  }
};

/** An editable cell's input: text, number, date, a checkbox, or a select of the column's options. */
const CellEditor = ({ column, value, onCommit, onCancel }) => {
  const [draft, setDraft] = useState(value ?? '');
  const commit = (next) =>
    onCommit(column.type === 'number' || column.type === 'currency' ? (next === '' ? null : Number(next)) : next);
  if (column.type === 'boolean') {
    return (
      <Checkbox
        autoFocus
        checked={draft === true || draft === 'true'}
        onCheckedChange={(checked) => onCommit(!!checked)}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  if (column.type === 'badge' && column.options?.length) {
    return (
      <select
        autoFocus
        value={String(draft)}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => onCancel()}
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
      >
        {column.options.map((o) => (
          <option key={String(o?.value ?? o)} value={String(o?.value ?? o)}>
            {String(o?.label ?? o?.value ?? o)}
          </option>
        ))}
      </select>
    );
  }
  return (
    <Input
      autoFocus
      className="h-8 px-2"
      type={
        column.type === 'number' || column.type === 'currency' ? 'number' : column.type === 'date' ? 'date' : 'text'
      }
      value={draft === null ? '' : String(draft)}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => commit(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit(draft);
        if (e.key === 'Escape') onCancel();
      }}
    />
  );
};

const FilterPanel = ({ columns, filters, onApply }) => {
  const filterable = columns.filter((c) => c.visible && c.type !== 'button');
  const [rows, setRows] = useState(() =>
    filters.length ? filters : [{ column: filterable[0]?.key ?? '', condition: 'contains', value: '' }]
  );
  const update = (index, patch) => setRows((all) => all.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <div className="flex w-[420px] max-w-[90vw] flex-col gap-2">
      <p className="text-sm font-medium">Filters</p>
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <select
            aria-label="Column"
            value={row.column}
            onChange={(e) => update(index, { column: e.target.value })}
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
          >
            {filterable.map((c) => (
              <option key={c.id} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Condition"
            value={row.condition}
            onChange={(e) => update(index, { condition: e.target.value })}
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
          >
            {FILTER_CONDITIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {['isEmpty', 'isNotEmpty'].includes(row.condition) ? (
            <span className="flex-1" />
          ) : (
            <Input
              aria-label="Value"
              className="h-8 min-w-0 flex-1 px-2"
              value={row.value ?? ''}
              onChange={(e) => update(index, { value: e.target.value })}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 p-0"
            aria-label="Remove filter"
            onClick={() => setRows((all) => all.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setRows((all) => [...all, { column: filterable[0]?.key ?? '', condition: 'contains', value: '' }])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add filter
        </Button>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={() => onApply([])}>
            Clear
          </Button>
          <Button size="sm" onClick={() => onApply(rows)}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

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

const RIGHT_FADE = {
  maskImage: 'linear-gradient(to right, #000 calc(100% - 40px), transparent)',
  WebkitMaskImage: 'linear-gradient(to right, #000 calc(100% - 40px), transparent)',
};

export const ShadTable = (props) => {
  const { id, height, properties, styles, setExposedVariable, setExposedVariables, fireEvent, componentName, dataCy } =
    props;
  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState === true,
    properties.visibility !== false,
    properties.disabledState === true,
    setExposedVariables,
    setExposedVariable
  );
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useDisableInert(ref, isDisabled);
  const resolve = useCellResolver();

  // ---- data and columns ---------------------------------------------------------------------------------------------
  const data = useMemo(
    () => (Array.isArray(properties.data) ? properties.data.filter((row) => row && typeof row === 'object') : []),
    [properties.data]
  );
  const idField = isSet(properties.idField) ? String(properties.idField) : 'id';
  const autogen = !(Array.isArray(properties.columns) && properties.columns.length);
  const columns = useMemo(
    () => normalizeColumns(properties.columns, data),
    [properties.columns, autogen ? data : null] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const shownColumns = columns.filter((c) => c.visible && !hiddenIds.has(c.id));
  const entries = useMemo(
    () => data.map((row, index) => ({ row, index, key: rowKey(row, idField, index) })),
    [data, idField]
  );

  // ---- edits (overlay on the data until it changes) -------------------------------------------------------------------
  const [edits, setEdits] = useState(() => new Map());
  useEffect(() => setEdits(new Map()), [data]);
  const withEdits = (entry) => (edits.has(entry.key) ? { ...entry.row, ...edits.get(entry.key) } : entry.row);

  // ---- search, sort, filters, page ------------------------------------------------------------------------------------
  const serverPaging = properties.serverSidePagination === true;
  const [searchInput, setSearchInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState(null);
  const [filters, setFilters] = useState([]);
  const [page, setPage] = useState(1);

  const processed = useMemo(() => {
    let list = entries;
    if (searchText && properties.serverSideSearch !== true) {
      list = list.filter((entry) => matchesSearch(withEdits(entry), shownColumns, searchText));
    }
    if (filters.length && properties.serverSideFilter !== true) {
      const passing = new Set(applyFilters(list.map(withEdits), filters, columns));
      list = list.filter((entry) => passing.has(withEdits(entry)));
    }
    if (sort && properties.serverSideSort !== true) {
      const column = columns.find((c) => c.key === sort.key);
      if (column) {
        const order = new Map(sortRows(list.map(withEdits), column, sort.direction).map((row, i) => [row, i]));
        list = [...list].sort((a, b) => order.get(withEdits(a)) - order.get(withEdits(b)));
      }
    }
    return list;
  }, [
    entries,
    searchText,
    filters,
    sort,
    edits,
    columns,
    hiddenIds,
    properties.serverSideSearch,
    properties.serverSideFilter,
    properties.serverSideSort,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const paged = pageOf(processed, {
    enablePagination: properties.enablePagination !== false,
    serverSidePagination: serverPaging,
    rowsPerPage: properties.rowsPerPage ?? properties.pageSize,
    totalRecords: properties.totalRecords,
    page,
  });
  if (serverPaging && properties.enablePagination !== false) {
    paged.hasNext = paged.pageCount
      ? paged.hasNext && properties.enableNextButton !== false
      : properties.enableNextButton !== false;
    paged.hasPrevious = paged.hasPrevious && properties.enablePrevButton !== false;
  }
  useEffect(() => {
    if (!serverPaging && paged.page !== page) setPage(paged.page);
  }, [paged.page]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- selection ------------------------------------------------------------------------------------------------------
  const allowSelection = properties.allowSelection !== false;
  const bulk = allowSelection && properties.showBulkSelector === true;
  const [selected, setSelected] = useState(() => new Set());
  const [focusKey, setFocusKey] = useState(null);

  // Everything the actions and handlers read later, without going stale.
  const live = useRef({});
  live.current = { entries, processed, paged, selected, edits, columns, filters, sort, searchText, data, focusKey };

  const exposeSelection = (keys, focus) => {
    const { entries: all } = live.current;
    const picked = all.filter((entry) => keys.has(entry.key));
    const focusEntry = all.find((entry) => entry.key === focus);
    setExposedVariables({
      selectedRow: focusEntry ? withEdits(focusEntry) : {},
      selectedRowId: focusEntry ? focusEntry.index : null,
      selectedRows: picked.map(withEdits),
      selectedRowsId: picked.map((entry) => entry.index),
    });
  };
  const select = (keys, focus) => {
    setSelected(keys);
    setFocusKey(focus);
    exposeSelection(keys, focus);
  };

  // Default selected row, and keeping the selection on the same records across a reload.
  useEffect(() => {
    const keys = new Set(entries.map((entry) => entry.key));
    const kept = new Set([...live.current.selected].filter((key) => keys.has(key)));
    let focus = keys.has(live.current.focusKey) ? live.current.focusKey : null;
    const wanted = properties.defaultSelectedRow;
    if (!kept.size && wanted && typeof wanted === 'object' && Object.keys(wanted).length && allowSelection) {
      const [k, v] = Object.entries(wanted)[0];
      const match = entries.find((entry) => readCell(entry.row, k) == v); // eslint-disable-line eqeqeq
      if (match) {
        kept.add(match.key);
        focus = match.key;
      }
    }
    setSelected(kept);
    setFocusKey(focus);
    exposeSelection(kept, focus);
  }, [entries]); // eslint-disable-line react-hooks/exhaustive-deps

  const clickRow = (entry) => {
    if (isDisabled) return;
    if (allowSelection && !bulk) {
      const already = selected.has(entry.key);
      if (already && properties.disableRowDeselection === true) {
        fireEvent('onRowClicked');
        return;
      }
      const keys = already ? new Set() : new Set([entry.key]);
      select(keys, already ? null : entry.key);
      fireEvent('onRowClicked');
      fireEvent('onSelectionChanged');
      return;
    }
    // Bulk mode or no selection: the clicked row is still exposed for the handler.
    setFocusKey(entry.key);
    setExposedVariables({ selectedRow: withEdits(entry), selectedRowId: entry.index });
    fireEvent('onRowClicked');
  };
  const toggleBulk = (entry) => {
    const keys = new Set(selected);
    if (keys.has(entry.key)) keys.delete(entry.key);
    else keys.add(entry.key);
    select(keys, entry.key);
    fireEvent('onSelectionChanged');
  };
  const pageKeys = paged.items.map((entry) => entry.key);
  const allOnPage = pageKeys.length > 0 && pageKeys.every((key) => selected.has(key));
  const someOnPage = pageKeys.some((key) => selected.has(key));
  const togglePage = () => {
    const keys = new Set(selected);
    pageKeys.forEach((key) => (allOnPage ? keys.delete(key) : keys.add(key)));
    select(keys, focusKey);
    fireEvent('onSelectionChanged');
  };

  // ---- user actions that publish state, then fire their event ----------------------------------------------------------
  useEffect(() => {
    if (searchInput === searchText) return undefined;
    const timer = setTimeout(() => {
      setSearchText(searchInput);
      setPage(1);
      setExposedVariables({ searchText: searchInput, pageIndex: 1 });
      fireEvent('onSearch');
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const sortApplied = (next) => {
    if (!next) return [];
    const column = columns.find((c) => c.key === next.key);
    return [{ column: column?.name ?? next.key, columnKey: next.key, direction: next.direction }];
  };
  const applySort = (next, { fire = true } = {}) => {
    setSort(next);
    setExposedVariable('sortApplied', sortApplied(next));
    if (fire) fireEvent('onSort');
  };
  const clickHeader = (column) => {
    if (properties.enabledSort === false || !column.sortable || isDisabled) return;
    const current = sort?.key === column.key ? sort.direction : null;
    applySort(
      current === 'asc'
        ? { key: column.key, direction: 'desc' }
        : current === 'desc'
        ? null
        : { key: column.key, direction: 'asc' }
    );
  };
  const exposedFilters = (list) =>
    list.map((f) => ({
      column: columns.find((c) => c.key === f.column)?.name ?? f.column,
      condition: f.condition,
      value: f.value ?? '',
    }));
  const applyFilterList = (list, { fire = true } = {}) => {
    const clean = (Array.isArray(list) ? list : []).filter(
      (f) => f && typeof f === 'object' && isSet(f.column) && isSet(f.condition)
    );
    // Accept header names as well as keys, as the native setFilters does.
    const normalized = clean.map((f) => ({
      ...f,
      column: (columns.find((c) => c.key === f.column || c.name === f.column) ?? {}).key ?? f.column,
    }));
    setFilters(normalized);
    setPage(1);
    setExposedVariables({ filters: exposedFilters(normalized), pageIndex: 1 });
    if (fire) fireEvent('onFilterChanged');
  };
  const goTo = (target, { fire = true } = {}) => {
    const next = Math.max(1, Math.floor(Number(target)) || 1);
    setPage(next);
    setExposedVariable('pageIndex', next);
    if (fire) fireEvent('onPageChanged');
  };
  const onAction = (buttonId, column, row, rowIndex) => {
    setExposedVariables({
      selectedRow: row,
      selectedRowId: rowIndex,
      lastActionClicked: { buttonId, columnKey: column.key, columnName: column.name, row },
    });
    fireEvent('onActionButtonClicked');
  };

  // ---- editing --------------------------------------------------------------------------------------------------------
  const [editing, setEditing] = useState(null);
  const exposeEdits = (next) => {
    const { entries: all } = live.current;
    const changeSet = {};
    const dataUpdates = [];
    all.forEach((entry) => {
      if (!next.has(entry.key)) return;
      changeSet[entry.index] = next.get(entry.key);
      dataUpdates.push({ ...entry.row, ...next.get(entry.key) });
    });
    setExposedVariables({
      changeSet,
      dataUpdates,
      updatedData: all.map((entry) => (next.has(entry.key) ? { ...entry.row, ...next.get(entry.key) } : entry.row)),
    });
  };
  const commitEdit = (entry, column, value) => {
    setEditing(null);
    const before = readCell(withEdits(entry), column.key);
    if (before === value || (before == null && (value === '' || value == null))) return; // eslint-disable-line eqeqeq
    const next = new Map(edits);
    next.set(entry.key, { ...(next.get(entry.key) ?? {}), [column.key]: value });
    setEdits(next);
    exposeEdits(next);
    fireEvent('onCellValueChanged');
  };
  const discard = ({ fire = true } = {}) => {
    const next = new Map();
    setEdits(next);
    exposeEdits(next);
    if (fire) fireEvent('onCancelChanges');
  };

  // ---- exported data and actions --------------------------------------------------------------------------------------
  const exportRows = () => live.current.processed.map(withEdits);
  const runDownload = (type) => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const base = `${componentName || 'table'}_${stamp}`;
    if (type === 'json') download(`${base}.json`, stringify(exportRows(), 2), 'application/json');
    else download(`${base}.csv`, toCsv(exportRows(), live.current.columns), 'text/csv;charset=utf-8');
  };

  useEffect(() => {
    setExposedVariables({
      currentData: data,
      filteredData: processed.map(withEdits),
      currentPageData: paged.items.map(withEdits),
    });
  }, [data, processed, paged.page, paged.items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const byKeyValue = (key, value) => live.current.entries.filter((entry) => readCell(entry.row, key) == value); // eslint-disable-line eqeqeq
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
        const wanted = Array.isArray(values) ? values : [values];
        const keys = new Set(live.current.selected);
        wanted.forEach((v) => byKeyValue(key, v).forEach((entry) => keys.add(entry.key)));
        select(keys, live.current.focusKey);
      },
      deselectRows: async (key, values) => {
        const wanted = Array.isArray(values) ? values : [values];
        const keys = new Set(live.current.selected);
        wanted.forEach((v) => byKeyValue(key, v).forEach((entry) => keys.delete(entry.key)));
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

  // ---- layout ---------------------------------------------------------------------------------------------------------
  const rowHeight = ROW_HEIGHT[properties.cellSize] ?? ROW_HEIGHT.regular;
  const visibleRows = paged.items;
  const virtual = visibleRows.length > VIRTUALIZE_ABOVE;
  const fixedHeight = props.properties?.dynamicHeight === false || virtual;
  const scrollRef = useRef(null);
  // A fixed-height table that has more rows below its edge fades them out, so it reads as scrollable (macOS hides
  // scrollbars, and a row cut off at the edge looks broken).
  // Columns wider than the table do the same at its right edge (a narrow card cut its last column).
  const [moreBelow, setMoreBelow] = useState(false);
  const [moreRight, setMoreRight] = useState(false);
  const [boxWidth, setBoxWidth] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const check = () => {
      setMoreBelow(fixedHeight && el.scrollHeight - el.scrollTop - el.clientHeight > 4);
      setMoreRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
      setBoxWidth(el.clientWidth);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [fixedHeight]);
  const virtualizer = useVirtualizer({
    count: virtual ? visibleRows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });
  const virtualItems = virtual ? virtualizer.getVirtualItems() : [];
  const padTop = virtual && virtualItems.length ? virtualItems[0].start : 0;
  const padBottom =
    virtual && virtualItems.length ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end : 0;
  const rendered = virtual ? virtualItems.map((item) => visibleRows[item.index]).filter(Boolean) : visibleRows;

  const striped = properties.tableType === 'striped';
  const bordered = properties.tableType === 'bordered';
  // Column widths are preferences: when they add up to more than the table's width (a narrow card), they are dropped
  // and the table shares its width among the columns instead of cutting the last one off.
  const requestedWidth = shownColumns.reduce((sum, column) => sum + (Number(column.width) || 0), 0);
  const fitWidths = !boxWidth || requestedWidth <= boxWidth;
  const toolbar =
    properties.displaySearchBox !== false ||
    properties.showFilterButton !== false ||
    properties.hideColumnSelectorButton !== true ||
    properties.showDownloadButton === true ||
    properties.showRefreshButton === true;
  const colCount = shownColumns.length + (bulk ? 1 : 0) || 1;
  const fontSize = isSet(styles?.fontSize) ? `${Number(styles.fontSize) || 14}px` : undefined;
  const pendingEdits = edits.size;

  const cellStyle = (column, row, value) => {
    const color = column.textColor ? resolve(column.textColor, row, value) : undefined;
    const background = column.cellBackgroundColor ? resolve(column.cellBackgroundColor, row, value) : undefined;
    return {
      ...(isSet(color) ? { color } : {}),
      ...(isSet(background) ? { background } : {}),
      ...(column.fontWeight ? { fontWeight: column.fontWeight } : {}),
      ...cellStyleFor(column, row),
      ...(virtual ? { height: rowHeight } : {}),
    };
  };

  return (
    <Shell {...props} properties={{ ...properties, visibility: isVisible }} innerRef={ref}>
      <div className="flex flex-col gap-3" style={{ fontSize }}>
        {toolbar ? (
          <div className="flex flex-wrap items-center gap-2">
            {properties.displaySearchBox !== false ? (
              <div className="relative min-w-[180px] max-w-sm flex-1">
                <Search
                  className={cn('pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2', MUTED)}
                />
                <Input
                  aria-label="Search"
                  className="h-9 pl-8 pr-8"
                  placeholder={String(properties.searchPlaceholder ?? 'Search…')}
                  value={searchInput}
                  disabled={isDisabled}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className={cn('absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-muted', MUTED)}
                    onClick={() => setSearchInput('')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ) : (
              <span className="flex-1" />
            )}
            <div className="ml-auto flex items-center gap-2">
              {properties.showFilterButton !== false ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9" disabled={isDisabled}>
                      <Filter className="mr-1.5 h-3.5 w-3.5" />
                      Filter
                      {filters.length ? (
                        <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 tabular-nums">
                          {filters.length}
                        </Badge>
                      ) : null}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto" style={lookVars('ShadTable', styles)}>
                    <FilterPanel columns={columns} filters={filters} onApply={(list) => applyFilterList(list)} />
                  </PopoverContent>
                </Popover>
              ) : null}
              {properties.hideColumnSelectorButton !== true ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9" disabled={isDisabled}>
                      <Columns3 className="mr-1.5 h-3.5 w-3.5" />
                      Columns
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-52 p-2" style={lookVars('ShadTable', styles)}>
                    {columns
                      .filter((c) => c.visible)
                      .map((c) => (
                        <label
                          key={c.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                        >
                          <Checkbox
                            checked={!hiddenIds.has(c.id)}
                            onCheckedChange={(checked) =>
                              setHiddenIds((all) => {
                                const next = new Set(all);
                                if (checked) next.delete(c.id);
                                else next.add(c.id);
                                return next;
                              })
                            }
                          />
                          <span className="truncate">{c.name}</span>
                        </label>
                      ))}
                  </PopoverContent>
                </Popover>
              ) : null}
              {properties.showDownloadButton === true ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9" aria-label="Download" disabled={isDisabled}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-40 p-1" style={lookVars('ShadTable', styles)}>
                    {[
                      ['csv', 'Download CSV'],
                      ['json', 'Download JSON'],
                    ].map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                        onClick={() => runDownload(type)}
                      >
                        {label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              ) : null}
              {properties.showRefreshButton === true ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  aria-label="Refresh"
                  disabled={isDisabled}
                  onClick={() => fireEvent('onRefresh')}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div
          ref={scrollRef}
          className={cn(
            'relative w-full overflow-auto bg-[color:var(--lk-bg,transparent)]',
            styles?.showBorder !== false && 'rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))] border',
            ROW_BORDER
          )}
          style={{
            ...(fixedHeight ? { maxHeight: Math.max(160, (Number(height) || 440) - (toolbar ? 56 : 0) - 52) } : {}),
            ...(moreRight ? RIGHT_FADE : {}),
          }}
        >
          <table className="w-full caption-bottom border-collapse text-[length:inherit]">
            <thead
              className={cn(
                'bg-[color:var(--lk-head-bg,var(--sc-background))]',
                properties.stickyHeader !== false && fixedHeight && 'sticky top-0 z-10'
              )}
            >
              <tr className={cn('border-b', ROW_BORDER)}>
                {bulk ? (
                  <th className="w-10 px-3">
                    <Checkbox
                      aria-label="Select all on this page"
                      checked={allOnPage ? true : someOnPage ? 'indeterminate' : false}
                      disabled={isDisabled || !pageKeys.length}
                      onCheckedChange={togglePage}
                    />
                  </th>
                ) : null}
                {shownColumns.map((column) => {
                  const active = sort?.key === column.key ? sort.direction : null;
                  const sortable = properties.enabledSort !== false && column.sortable;
                  const SortIcon = active === 'asc' ? ArrowUp : active === 'desc' ? ArrowDown : ArrowUpDown;
                  return (
                    <th
                      key={column.id}
                      scope="col"
                      aria-sort={active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : undefined}
                      className={cn(
                        // Header labels wrap between words when the table is narrower than its headers (a narrow card
                        // otherwise cut its last column); with room to spare they stay on one line.
                        'h-10 px-3 py-2 text-left align-middle text-xs font-medium leading-tight text-[color:var(--lk-head-fg,var(--sc-muted-foreground))]',
                        styles?.headerCasing === 'uppercase' && 'uppercase tracking-wide',
                        column.align === 'right' && 'text-right',
                        column.align === 'center' && 'text-center',
                        bordered && cn('border-r last:border-r-0', ROW_BORDER)
                      )}
                      style={{ width: fitWidths ? column.width : undefined, minWidth: column.minWidth }}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => clickHeader(column)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded text-left hover:text-[color:var(--lk-fg,var(--sc-foreground))]',
                            column.align === 'right' && 'flex-row-reverse'
                          )}
                        >
                          <span>{column.name}</span>
                          <SortIcon className={cn('h-3 w-3 shrink-0', active ? 'opacity-90' : 'opacity-40')} />
                        </button>
                      ) : (
                        column.name
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="text-[color:var(--lk-fg,var(--sc-foreground))]">
              {isLoading ? (
                Array.from({ length: Math.min(5, Number(properties.rowsPerPage) || 5) }, (_, i) => (
                  <tr key={i} className={cn('border-b', ROW_BORDER)}>
                    {Array.from({ length: colCount }, (__, j) => (
                      <td key={j} className="px-3" style={{ height: rowHeight }}>
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rendered.length ? (
                <>
                  {padTop > 0 ? (
                    <tr aria-hidden="true">
                      <td colSpan={colCount} style={{ height: padTop, padding: 0, border: 0 }} />
                    </tr>
                  ) : null}
                  {rendered.map((entry, i) => {
                    const row = withEdits(entry);
                    const isSelected = selected.has(entry.key);
                    const showSelected = isSelected && (bulk || properties.highlightSelectedRow !== false);
                    const position = virtual ? virtualItems[i]?.index ?? i : i;
                    return (
                      <tr
                        key={entry.key}
                        data-state={showSelected ? 'selected' : undefined}
                        onClick={() => clickRow(entry)}
                        className={cn(
                          'border-b transition-colors last:border-b-0',
                          ROW_BORDER,
                          allowSelection && 'cursor-pointer',
                          'hover:bg-[color:var(--lk-hover,color-mix(in_srgb,var(--sc-muted)_50%,transparent))]',
                          striped &&
                            position % 2 === 1 &&
                            'bg-[color:var(--lk-striped,color-mix(in_srgb,var(--sc-muted)_35%,transparent))]',
                          'data-[state=selected]:bg-[color:var(--lk-selected,var(--sc-muted))]'
                        )}
                      >
                        {bulk ? (
                          <td className="w-10 px-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              aria-label="Select row"
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={() => toggleBulk(entry)}
                            />
                          </td>
                        ) : null}
                        {shownColumns.map((column) => {
                          const value = readCell(row, column.key);
                          const isEditing = editing?.key === entry.key && editing?.column === column.id;
                          const edited = edits.get(entry.key)?.[column.key] !== undefined;
                          return (
                            <td
                              key={column.id}
                              onClick={
                                column.editable && !isDisabled
                                  ? (e) => {
                                      e.stopPropagation();
                                      setEditing({ key: entry.key, column: column.id });
                                    }
                                  : undefined
                              }
                              className={cn(
                                'px-3 align-middle',
                                column.wrap ? 'whitespace-normal' : 'max-w-[360px] truncate whitespace-nowrap',
                                column.align === 'right' && 'text-right tabular-nums',
                                column.align === 'center' && 'text-center',
                                column.editable && 'cursor-text',
                                edited && 'bg-[color:color-mix(in_srgb,var(--sc-warning,#f59e0b)_10%,transparent)]',
                                bordered && cn('border-r last:border-r-0', ROW_BORDER)
                              )}
                              style={{ height: rowHeight, ...cellStyle(column, row, value) }}
                            >
                              {isEditing ? (
                                <CellEditor
                                  column={column}
                                  value={value}
                                  onCommit={(next) => commitEdit(entry, column, next)}
                                  onCancel={() => setEditing(null)}
                                />
                              ) : (
                                <CellBoundary resetKey={value}>
                                  {renderCell({
                                    value,
                                    row,
                                    column,
                                    properties,
                                    resolve,
                                    onAction,
                                    rowIndex: entry.index,
                                  })}
                                </CellBoundary>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {padBottom > 0 ? (
                    <tr aria-hidden="true">
                      <td colSpan={colCount} style={{ height: padBottom, padding: 0, border: 0 }} />
                    </tr>
                  ) : null}
                </>
              ) : (
                <tr>
                  <td colSpan={colCount} className="px-3 py-10 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <Inbox className={cn('h-6 w-6', MUTED)} />
                      <p className="text-sm font-medium">
                        {searchText || filters.length
                          ? 'No matching rows.'
                          : String(properties.emptyText || 'No results.')}
                      </p>
                      {properties.emptyDescription && !searchText && !filters.length ? (
                        <p className={cn('text-xs', MUTED)}>{String(properties.emptyDescription)}</p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {moreBelow ? (
            <div
              aria-hidden="true"
              className="pointer-events-none sticky bottom-0 -mt-8 h-8 w-full bg-gradient-to-t from-[color:var(--lk-bg,var(--sc-background))] to-transparent"
            />
          ) : null}
        </div>

        {pendingEdits > 0 && properties.showBulkUpdateActions !== false ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-dashed px-3 py-2">
            <span className={cn('text-sm', MUTED)}>
              {pendingEdits} {pendingEdits === 1 ? 'row' : 'rows'} changed
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => discard()} disabled={isDisabled}>
                Discard
              </Button>
              <Button size="sm" onClick={() => fireEvent('onBulkUpdate')} disabled={isDisabled}>
                Save changes
              </Button>
            </div>
          </div>
        ) : null}

        {(properties.showRowCount !== false || properties.enablePagination !== false) && !isLoading ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={cn('text-xs tabular-nums', MUTED)}>
              {properties.showRowCount === false
                ? ''
                : bulk && selected.size
                ? `${selected.size} of ${
                    serverPaging ? Number(properties.totalRecords) || processed.length : processed.length
                  } selected`
                : `${
                    serverPaging && Number(properties.totalRecords) ? Number(properties.totalRecords) : processed.length
                  } ${
                    (serverPaging && Number(properties.totalRecords)
                      ? Number(properties.totalRecords)
                      : processed.length) === 1
                      ? 'row'
                      : 'rows'
                  }`}
            </span>
            {properties.enablePagination !== false &&
            (paged.pageCount === null || paged.pageCount > 1 || paged.page > 1) ? (
              <Pager
                page={paged.page}
                pageCount={paged.pageCount}
                hasPrevious={paged.hasPrevious}
                hasNext={paged.hasNext}
                disabled={isDisabled}
                onPage={(p) => goTo(p)}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </Shell>
  );
};
