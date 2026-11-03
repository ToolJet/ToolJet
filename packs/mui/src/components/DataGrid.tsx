import React, { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { Chip } from '@mui/material';
import { DataGrid as MuiDataGrid } from '@mui/x-data-grid';
import type {
  GridColDef,
  GridLocaleText,
  GridPaginationModel,
  GridRowSelectionModel,
  GridSortModel,
} from '@mui/x-data-grid';
import { deDE, esES, frFR, itIT, nlNL, ptBR, ptPT } from '@mui/x-data-grid/locales';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useStateText } from '../lib/text';
import { MuiProvider, useIsThemed, useThemeStyles } from '../lib/MuiProvider';
import { chipFamily } from '../lib/theme';
import type { Theme } from '@mui/material/styles';
import { rowIdOf, rowKeyOf, sameRecord, str, toArray, toRows, type Row } from '../lib/data';
import { formatCell, isIdField, toNumber } from '../lib/format';
import { LOCALE_HINT } from '../lib/locale';
import { SAMPLE } from '../lib/samples';
import { themeInk } from '../lib/ink';
import { chipTone } from '../lib/statusTone';
import dayjs from 'dayjs';
import { localeFor } from '../lib/locale';

const ID = '__tjRowId';
const ROW_HEIGHT = { compact: 36, standard: 52, comfortable: 67 };
// The free DataGrid pages at most 100 rows (more is a Pro feature).
const MAX_PAGE_SIZE = 100;
// A binding to a list of records by mistake (a query's rows as columns) made one column per record: 1500 columns took
// the grid over a minute to draw (pack fuzz, 2026-10-24). No real grid has more columns than this.
const MAX_COLUMNS = 100;
// A header's least width: its padding (10px a side), the sort and column menu buttons (28px each, shown on hover) and
// room for the title. MUI's own least is 50px: 30 flex columns shrank to 51px, where the hover icons took the whole
// header, the title went to 0px and a click on it landed on the column menu button, so it did not sort (B-03).
const headerFloor = (sortable: boolean, menu: boolean) => 20 + (sortable ? 28 : 0) + (menu ? 28 : 0) + 32;
// Where the columns' widths and floors overflow the grid, each column shares the width by its own (an unsized one by
// FLUID_SHARE) down to SQUEEZED_FLOOR: padding, one hover button and a short title. A grid that cannot fit even that
// scrolls sideways.
const SQUEEZED_FLOOR = 72;
const FLUID_SHARE = 180;
const CHECKBOX_WIDTH = 50;
// An html cell (columnType 'html', as UI 2.0's Table): sanitised as the Table does (DOMPurify's defaults drop
// <script>, event-handler attributes and javascript: URLs); its text sorts, filters and exports.
const sanitize = (v: unknown) => DOMPurify.sanitize((v === undefined || v === null ? '' : String(v)).trim());
const textOf = (v: unknown) => {
  if (typeof document === 'undefined') return str(v);
  const el = document.createElement('div');
  el.innerHTML = sanitize(v);
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
};
const humanize = (k: string) =>
  k
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());

type Column = GridColDef & { format?: string; currency?: string; colors?: Record<string, string>; dateFormat?: string };

// MUI's column shape ({ field, headerName, type, width, flex, align, sortable }); also { key, label }, { dataIndex,
// title } and plain field names. A column may add format (currency, percent, compact, chip, html) with currency and,
// for chips, colors { value: palette colour }; type or columnType 'html' (UI 2.0's Table) is the html format. None:
// every field of the first row.
const isFalse = (v: unknown) => v === false || v === 'false' || v === '{{false}}';
const isHidden = (r: Row) =>
  r.hidden === true || r.hidden === 'true' || isFalse(r.visible) || isFalse(r.columnVisibility);
const CHIP_COLORS = new Set(['default', 'primary', 'secondary', 'error', 'info', 'success', 'warning']);
const UI2_FORMATS: Record<string, string> = {
  currency: 'currency',
  percent: 'percent',
  badge: 'chip',
  status: 'chip',
  tag: 'chip',
  tags: 'chip',
};

/**
 * A chip column's cell. A palette name goes to color; a CSS colour (UI 2.0's badgeColors) tints the chip instead, its
 * text the colour's readable ink on that tint (lib/ink.ts). Under an applied app theme a CSS colour or colour word is
 * drawn in the theme palette colour of its hue (lib/theme chipFamily), so an author's stock blue reads as the brand.
 */
const TONE_CHIP: Record<string, string> = { success: 'success', warning: 'warning', danger: 'error', info: 'info' };

export const StatusChip = ({ label, color }: { label: string; color: string }) => {
  const themed = useIsThemed();
  const family = themed && color && !CHIP_COLORS.has(color) ? chipFamily(color) : undefined;
  if (family === null) return <Chip size="small" label={label} />;
  if (CHIP_COLORS.has(color)) return <Chip size="small" label={label} color={color as 'default'} />;
  const css = /^(#|rgb|hsl)/i.test(color) ? color : '';
  if (!family && !css) return <Chip size="small" label={label} />;
  const tint = (t: Theme) => (family ? t.palette[family].main : css);
  return (
    <Chip
      size="small"
      label={label}
      sx={(t) => ({ color: themeInk(tint(t), t), bgcolor: `color-mix(in srgb, ${tint(t)} 14%, transparent)` })}
    />
  );
};

const toColumns = (raw: unknown, rows: Row[]): Column[] => {
  const given = toArray(raw)
    .slice(0, MAX_COLUMNS)
    .map((c): Column | null => {
      if (typeof c === 'string') return { field: c, headerName: humanize(c) };
      if (!c || typeof c !== 'object') return null;
      const r = c as Row;
      const field = str(r.field ?? r.key ?? r.dataIndex ?? r.name);
      if (!field) return null;
      // A listed column can still be hidden (hidden, or visible: false; UI 2.0's Table: columnVisibility: false).
      if (isHidden(r)) return { field: '', hidden: true } as unknown as Column;
      const type = str(r.type ?? r.columnType);
      // UI 2.0's Table names a column { key, name }: name is then the header.
      const named = r.field !== undefined || r.key !== undefined || r.dataIndex !== undefined ? r.name : undefined;
      const col: Column = { field, headerName: str(r.headerName ?? r.label ?? r.title ?? named) || humanize(field) };
      if (['string', 'number', 'date', 'dateTime', 'boolean'].includes(type)) col.type = type as 'string';
      const width = toNumber(r.width ?? r.columnSize);
      const flex = toNumber(r.flex);
      // A given width is kept for now; toColumns settles it below, once it knows whether other columns can take the
      // spare room.
      if (width && !flex) col.width = width;
      if (flex) col.flex = flex;
      if (!width && !flex) col.flex = 1;
      if (r.align) col.align = col.headerAlign = r.align as 'left';
      if (r.sortable !== undefined) col.sortable = Boolean(r.sortable);
      // UI 2.0's columnType names the format too: currency, percent, badge or status (a chip), html.
      const kind = type.toLowerCase();
      // A format may carry its currency (Ant's 'currency:USD'); a date pattern ('D MMM YYYY') is not a number format.
      const [head, code] = str(r.format).split(':');
      const fmt = ['number', 'currency', 'percent', 'compact', 'chip', 'html'].includes(head.trim().toLowerCase())
        ? head.trim().toLowerCase()
        : '';
      col.format = kind === 'html' ? 'html' : fmt || UI2_FORMATS[kind] || undefined;
      col.currency =
        str(r.currency) || (code && /^[a-z]{3}$/i.test(code.trim()) ? code.trim().toUpperCase() : '') || undefined;
      // A date column's pattern: UI 2.0's dateFormat, or a date pattern given as the format ('D MMM YYYY').
      const pattern = str(r.dateFormat).trim() || (!fmt && /[DMY]/.test(str(r.format)) ? str(r.format).trim() : '');
      if (pattern) col.dateFormat = pattern;
      const colors = [r.colors, r.badgeColors, r.tagColors].find(
        (m) => m && typeof m === 'object' && !Array.isArray(m)
      );
      if (colors) col.colors = colors as Record<string, string>;
      return col;
    })
    .filter((c): c is Column => !!c);
  // Columns given: exactly those (hidden ones dropped); none given: every field of the first row.
  if (given.length) {
    const shown = given.filter((c) => !(c as unknown as { hidden?: boolean }).hidden);
    // As UI 2.0's Table: a column with a width (columnSize) keeps it and the others share the rest (flex 1). Sized
    // columns grew in proportion to their width before, so an 80px id column took 210px and a text column with no
    // width was squeezed to an ellipsis. With every column sized, they still share the grid in proportion, so the
    // grid has no blank band at its right.
    const anyFluid = shown.some((c) => c.width === undefined);
    return shown.map((c) => {
      if (c.width === undefined || c.flex !== undefined) return c;
      return anyFluid ? c : { ...c, minWidth: c.width, flex: c.width, width: undefined };
    });
  }
  const first = rows[0];
  return first
    ? Object.keys(first)
        .slice(0, MAX_COLUMNS)
        .map((k) => ({ field: k, headerName: humanize(k), flex: 1 }))
    : [];
};

// What the grid gets for a column: numbers typed as numbers (right-aligned, numeric sort), dates read from ISO strings,
// and the formats MUI leaves to valueFormatter / renderCell.
// The grid's own words (pager, toolbar, column menu) in the author's locale; English otherwise. Only an explicit
// locale picks them: a currency alone does not (an English page priced in euros keeps an English pager).
type GridLocalization = { components: { MuiDataGrid: { defaultProps: { localeText: Partial<GridLocaleText> } } } };
const textOfLocalization = (l: GridLocalization) => l.components.MuiDataGrid.defaultProps.localeText;
const GRID_TEXT: Record<string, Partial<GridLocaleText>> = Object.fromEntries(
  Object.entries({ 'pt-BR': ptBR, 'pt-PT': ptPT, pt: ptBR, es: esES, fr: frFR, de: deDE, it: itIT, nl: nlNL }).map(
    ([k, v]) => [k, textOfLocalization(v as GridLocalization)]
  )
);
const gridTextFor = (locale: string): Partial<GridLocaleText> => {
  const tag = locale.trim();
  if (!tag) return {};
  return GRID_TEXT[tag] ?? GRID_TEXT[tag.split(/[-_]/)[0].toLowerCase()] ?? {};
};

const toGridColumn = (c: Column, rows: Row[], locale = ''): GridColDef => {
  const { format, currency, colors, ...col } = c;
  const sample = rows.find((r) => r[c.field] !== undefined && r[c.field] !== null && r[c.field] !== '')?.[c.field];
  if (!col.type && !format && !isIdField(c.field) && typeof sample === 'number') col.type = 'number';
  if (['number', 'currency', 'percent', 'compact'].includes(format ?? '')) col.type = 'number';
  // A typed column whose values do not read as that type (a query that formatted them already: '$1,234.56',
  // '24 Oct 2026') is drawn as the text it holds; typed, MUI drew those cells empty.
  const filled = rows.map((r) => r[c.field]).filter((v) => v !== undefined && v !== null && v !== '');
  if (col.type === 'number' && filled.some((v) => toNumber(v) === null)) {
    delete col.type;
    if (['number', 'currency', 'percent', 'compact'].includes(format ?? ''))
      return { ...col, valueFormatter: (v: unknown) => str(v) };
  }
  const isoOrTime = (v: unknown) => typeof v === 'number' || v instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(String(v));
  if (
    (col.type === 'date' || col.type === 'dateTime') &&
    filled.some((v) => !isoOrTime(v) || Number.isNaN(new Date(String(v)).getTime()))
  )
    delete col.type;
  if (col.type === 'date' || col.type === 'dateTime') {
    col.valueGetter = (v: unknown) => (v ? new Date(String(v)) : null);
    // The column's own pattern (UI 2.0's dateFormat, dayjs tokens), else the locale's date (MUI wrote the viewer's).
    const pattern = str((c as { dateFormat?: unknown }).dateFormat).trim();
    const where = localeFor(currency, locale);
    const withTime = col.type === 'dateTime';
    col.valueFormatter = (v: unknown) => {
      if (!(v instanceof Date) || Number.isNaN(v.getTime())) return '';
      if (pattern) return dayjs(v).format(pattern);
      return withTime
        ? v.toLocaleString(where, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : v.toLocaleDateString(where, { year: 'numeric', month: 'short', day: 'numeric' });
    };
  }
  if (col.type === 'number') {
    col.valueGetter = (v: unknown) => toNumber(v);
    if (format)
      col.valueFormatter = (v: unknown) =>
        v === null || v === undefined ? '' : formatCell(v, format, currency, locale);
    // A plain number column follows an author's locale too (MUI's own formatter writes the viewer's browser locale).
    else if (locale.trim())
      col.valueFormatter = (v: unknown) =>
        v === null || v === undefined ? '' : formatCell(v, 'number', currency, locale);
  } else if (format === 'html') {
    col.renderCell = (p) => (
      <div className="tj-mui-html-cell">
        <div dangerouslySetInnerHTML={{ __html: sanitize(p.value) }} />
      </div>
    );
    col.valueFormatter = (v: unknown) => textOf(v);
    col.sortComparator = (a: unknown, b: unknown) => textOf(a).localeCompare(textOf(b));
  } else if (format === 'chip') {
    col.renderCell = (p) => {
      if (p.value === undefined || p.value === null || p.value === '') return null;
      // No colour set for the value: its status word's tone ('Paid' success, 'Overdue' error), as the other packs do.
      const set = str(colors?.[str(p.value)]).trim();
      return <StatusChip label={str(p.value)} color={set || TONE_CHIP[chipTone(str(p.value))] || ''} />;
    };
  } else if (!col.type) {
    col.valueFormatter = (v: unknown) => (isIdField(c.field) ? str(v) : formatCell(v, format, currency, locale));
  }
  return col;
};

// MUI X's DataGrid (the free MIT grid): rows, columns, getRowId's field (rowIdField), density (compact, standard,
// comfortable), checkboxSelection, pageSize (up to 100) or autoPageSize, showToolbar (columns, filters, export,
// quick filter), disableColumnMenu, hideFooter, noRowsLabel. Exposes selectedRow, rowSelectionModel (the selected ids),
// selectedRows, paginationModel and sortModel. Events onRowClick, onRowSelectionModelChange, onPaginationModelChange,
// onSortModelChange.
export const DataGrid = () => {
  const [rawRows] = ToolJet.useStateArray({ name: 'rows', label: 'Rows', initialValue: SAMPLE.rows });
  const [rawColumns] = ToolJet.useStateArray({
    name: 'columns',
    label: 'Columns',
    description: '[{ field, headerName, type, width, flex }]; empty: every field.',
    initialValue: SAMPLE.columns,
  });
  const [locale] = useStateText({ name: 'locale', label: 'Locale', description: LOCALE_HINT, initialValue: '' });
  const [rowIdField] = useStateText({
    name: 'rowIdField',
    label: 'Row id field',
    description: "The rows' id field (getRowId).",
    initialValue: 'id',
  });
  const [rawDensity] = ToolJet.useStateEnumeration({
    name: 'density',
    label: 'Density',
    enumDefinition: ['compact', 'standard', 'comfortable'],
    initialValue: 'standard',
  });
  // MUI capitalizes the density as text; a binding that gives anything else (a number, null) is standard.
  const density = (['compact', 'standard', 'comfortable'].includes(rawDensity as string) ? rawDensity : 'standard') as
    'compact' | 'standard' | 'comfortable';
  const [checkboxSelection] = ToolJet.useStateBoolean({
    name: 'checkboxSelection',
    label: 'Checkbox selection',
    initialValue: false,
  });
  const [autoPageSize] = ToolJet.useStateBoolean({
    name: 'autoPageSize',
    label: 'Auto page size',
    description: 'As many rows per page as fit.',
    initialValue: false,
  });
  const [pageSize] = ToolJet.useStateNumber({
    name: 'pageSize',
    label: 'Page size',
    initialValue: 10,
    min: 1,
    max: MAX_PAGE_SIZE,
    visibleWhen: { key: 'autoPageSize', value: false },
  });
  const [showToolbar] = ToolJet.useStateBoolean({ name: 'showToolbar', label: 'Show toolbar', initialValue: false });
  const [disableColumnMenu] = ToolJet.useStateBoolean({
    name: 'disableColumnMenu',
    label: 'Disable column menu',
    initialValue: false,
  });
  const [hideFooter] = ToolJet.useStateBoolean({ name: 'hideFooter', label: 'Hide footer', initialValue: false });
  const [noRowsLabel] = useStateText({ name: 'noRowsLabel', label: 'No rows label', initialValue: 'No rows' });
  // An author's own empty label wins; the default 'No rows' gives way to the locale's.
  const gridText = useMemo(() => {
    const words = gridTextFor(str(locale));
    return {
      ...words,
      noRowsLabel:
        noRowsLabel && (noRowsLabel !== 'No rows' || !words.noRowsLabel)
          ? noRowsLabel
          : (words.noRowsLabel ?? 'No rows'),
    };
  }, [locale, noRowsLabel]);
  const [selectedRow, setSelectedRow] = ToolJet.useStateObject({
    name: 'selectedRow',
    initialValue: {},
    inspector: 'hidden',
  });
  const [selectedRowId, setSelectedRowId] = ToolJet.useStateString({
    name: 'selectedRowId',
    initialValue: '',
    inspector: 'hidden',
  });
  const [selectionIds, setSelectionIds] = ToolJet.useStateArray({
    name: 'rowSelectionModel',
    initialValue: [],
    inspector: 'hidden',
  });
  const [selectedRows, setSelectedRows] = ToolJet.useStateArray({
    name: 'selectedRows',
    initialValue: [],
    inspector: 'hidden',
  });
  const [, setPaginationModel] = ToolJet.useStateObject({
    name: 'paginationModel',
    initialValue: { page: 0, pageSize: 10 },
    inspector: 'hidden',
  });
  const [sortModel, setSortModel] = ToolJet.useStateArray({ name: 'sortModel', initialValue: [], inspector: 'hidden' });
  const onRowClick = ToolJet.useEventCallback({ name: 'onRowClick' });
  const onRowSelectionModelChange = ToolJet.useEventCallback({ name: 'onRowSelectionModelChange' });
  const onPaginationModelChange = ToolJet.useEventCallback({ name: 'onPaginationModelChange' });
  const onSortModelChange = ToolJet.useEventCallback({ name: 'onSortModelChange' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({
    role: 'table',
    fit: false,
    loading: 'own',
    usage:
      'MUI X DataGrid (free MIT grid): rows, columns [{field, headerName, type (number, date, boolean), width or flex, align, format (currency, percent, compact, chip), colors}], rowIdField, density (compact, standard, comfortable), checkboxSelection, pageSize (max 100) or autoPageSize, showToolbar (filter, export, quick search), noRowsLabel. Exposes selectedRow, rowSelectionModel (ids), selectedRows, paginationModel, sortModel. onRowClick, onRowSelectionModelChange, onPaginationModelChange, onSortModelChange.',
    roleProps: {
      data: 'rows',
      idField: 'rowIdField',
      rowsPerPage: 'pageSize',
      allowSelection: 'checkboxSelection',
      emptyText: 'noRowsLabel',
    },
    roleEvents: {
      onRowClicked: 'onRowClick',
      onSelectionChanged: 'onRowSelectionModelChange',
      onPageChanged: 'onPaginationModelChange',
      onSort: 'onSortModelChange',
    },
    defaultWidth: 30,
    defaultHeight: 40,
  });
  const size = Math.max(1, Math.min(MAX_PAGE_SIZE, Number(pageSize) || 10));
  const [page, setPage] = useState({ page: 0, pageSize: size });
  useEffect(() => setPage((m) => (m.pageSize === size ? m : { page: 0, pageSize: size })), [size]);
  // The exposed paginationModel follows the page drawn, from the first render (it said pageSize 10 while 25 were shown)
  // and after setPage, not only after a click in the footer.
  useEffect(() => {
    setPaginationModel({ ...page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.page, page.pageSize]);
  // Only { field, sort } entries: MUI reads .field off each one. Kept the same array while its content is (a binding
  // such as {{[]}} resolves to a new array on every render, and the grid treated each as a new sort).
  const sortKey = JSON.stringify(toArray(sortModel));
  const gridSortModel = useMemo(
    () =>
      toArray(sortModel).filter(
        (m) => !!m && typeof m === 'object' && typeof (m as { field?: unknown }).field === 'string'
      ) as GridSortModel,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortKey]
  );

  const field = str(rowIdField) || 'id';
  const source = useMemo(() => toRows(rawRows), [rawRows]);
  const { rows, byId, rawId } = useMemo(() => {
    const byId = new Map<string, Row>();
    // Each grid id's value as the rows give it: exposed ids keep their type (a number stays a number).
    const rawId = new Map<string, unknown>();
    const rows = source.map((r, i) => {
      const id = rowKeyOf(r, field, i);
      byId.set(id, r);
      rawId.set(id, rowIdOf(r, field, i));
      return { ...r, [ID]: id };
    });
    return { rows, byId, rawId };
  }, [source, field]);
  const idsOf = (keys: string[]) => keys.map((k) => rawId.get(k) ?? k);
  const defs = useMemo(() => toColumns(rawColumns, source), [rawColumns, source]);
  // The grid's own width, measured on its root (MuiProvider mounts it late, so a callback ref rather than an effect).
  const [gridEl, setGridEl] = useState<HTMLDivElement | null>(null);
  const [gridWidth, setGridWidth] = useState(0);
  useEffect(() => {
    if (!gridEl || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setGridWidth(gridEl.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(gridEl);
    return () => observer.disconnect();
  }, [gridEl]);
  const columns = useMemo(() => {
    const cols = defs.map((c) => {
      const col = toGridColumn(c, source, str(locale));
      // Too narrow a column scrolls the grid sideways rather than covering its title with the hover icons.
      const floor = headerFloor(col.sortable !== false, disableColumnMenu !== true && col.disableColumnMenu !== true);
      return { ...col, minWidth: Math.max(col.minWidth ?? 0, floor) };
    });
    const need = cols.reduce(
      (sum, c) => sum + Math.max(c.width ?? 0, c.minWidth ?? 0),
      checkboxSelection ? CHECKBOX_WIDTH : 0
    );
    // Seven sized columns in a two-thirds card cut off the last one and squeezed the unsized text column: share instead.
    if (!gridWidth || need <= gridWidth) return cols;
    return cols.map(({ width, flex, minWidth: _floor, ...col }) => ({
      ...col,
      // A sized column by its width; an all-sized grid already flexes by width; a fluid one (flex 1, 2) by FLUID_SHARE.
      flex: width ?? (flex !== undefined && flex > 10 ? flex : FLUID_SHARE * (flex ?? 1)),
      minWidth: SQUEEZED_FLOOR,
    }));
  }, [defs, source, disableColumnMenu, locale, gridWidth, checkboxSelection]);
  // Html cells can hold several blocks (a name over a detail line): rows grow to fit them, as MUI's auto row height.
  const htmlCells = defs.some((c) => c.format === 'html');
  // The free grid selects one row unless checkboxSelection is on, and throws on more: a bound list keeps its first id.
  const selection: GridRowSelectionModel = useMemo(() => {
    const ids = toArray(selectionIds).map(str).filter(Boolean);
    return { type: 'include', ids: new Set(checkboxSelection ? ids : ids.slice(0, 1)) };
  }, [selectionIds, checkboxSelection]);

  const select = (ids: string[]) => {
    setSelectionIds(idsOf(ids));
    setSelectedRows(ids.map((id) => byId.get(id)).filter(Boolean));
  };
  ToolJet.useAction(
    { name: 'selectRow', displayName: 'Select row', params: [{ handle: 'id', displayName: 'Row id' }] },
    (id) => {
      const row = byId.get(str(id));
      setSelectedRow(row ?? {});
      setSelectedRowId((row ? rawId.get(str(id)) : '') as string);
      select(row ? [str(id)] : []);
    }
  );

  // The selection follows its rows by id when the rows change: a refresh republishes the fresh records, a reorder keeps
  // them, and a row that is gone leaves the selection (selectedRow kept exposing a removed or stale record). No event:
  // the user selected nothing.
  const latest = useRef({ selectedRow, selectedRowId, selectionIds, selectedRows });
  latest.current = { selectedRow, selectedRowId, selectionIds, selectedRows };
  useEffect(() => {
    const { selectedRow: shown, selectedRowId: shownId, selectionIds: ids, selectedRows: shownRows } = latest.current;
    const key = str(shownId);
    if (key) {
      const fresh = byId.get(key);
      if (!fresh) {
        setSelectedRow({});
        setSelectedRowId('');
      } else if (!sameRecord(fresh, shown)) setSelectedRow(fresh);
    }
    const keys = toArray(ids).map(str).filter(Boolean);
    if (!keys.length) return;
    const kept = keys.filter((k) => byId.has(k));
    const nextIds = idsOf(kept);
    if (!sameRecord(nextIds, ids)) setSelectionIds(nextIds);
    const nextRows = kept.map((k) => byId.get(k));
    if (!sameRecord(nextRows, shownRows)) setSelectedRows(nextRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byId]);
  ToolJet.useAction({ name: 'clearSelection', displayName: 'Clear selection' }, () => {
    setSelectedRow({});
    setSelectedRowId('');
    select([]);
  });
  // setPage moves to a page that exists (the last one past the end), with no event, as the shadcn DataTable's: a page past
  // the end was set, then MUI moved back and fired onPaginationModelChange while paginationModel still said the old
  // page. Published at once, and from the last call's page, so calls in one event handler build on each other.
  const pageRef = useRef(page);
  pageRef.current = page;
  ToolJet.useAction(
    { name: 'setPage', displayName: 'Set page', params: [{ handle: 'page', displayName: 'Page (from 0)' }] },
    (p) => {
      const want = Math.max(0, Math.floor(toNumber(p) ?? 0));
      if (!Number.isFinite(want)) return;
      const cur = pageRef.current;
      const last = autoPageSize === true ? want : Math.max(0, Math.ceil(rows.length / cur.pageSize) - 1);
      const to = Math.min(want, last);
      if (to === cur.page) return;
      const next = { ...cur, page: to };
      pageRef.current = next;
      setPage(next);
      setPaginationModel({ ...next });
    }
  );

  return (
    <MuiProvider overrides={overrides} fill>
      <MuiDataGrid
        ref={setGridEl}
        rows={rows}
        columns={columns}
        getRowId={(r) => String(r[ID])}
        getRowHeight={htmlCells ? () => 'auto' : undefined}
        density={density}
        checkboxSelection={checkboxSelection}
        rowSelectionModel={selection}
        autoPageSize={autoPageSize}
        paginationModel={page}
        pageSizeOptions={autoPageSize ? undefined : Array.from(new Set([size, 10, 25, 50, 100])).sort((a, b) => a - b)}
        sortModel={gridSortModel}
        showToolbar={showToolbar}
        disableColumnMenu={disableColumnMenu}
        hideFooter={hideFooter}
        loading={loading}
        localeText={gridText}
        sx={{
          height: '100%',
          border: 1,
          borderColor: 'divider',
          // With auto row heights a one-line row keeps the density's height (MUI's 36, 52, 67px).
          '& .tj-mui-html-cell': { minHeight: ROW_HEIGHT[density] ?? 52 },
          // ... and every cell of a grown row centres its content, as in a fixed-height row.
          ...(htmlCells ? { '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' } } : {}),
        }}
        onRowClick={(params) => {
          const id = String(params.id);
          setSelectedRow(byId.get(id) ?? {});
          setSelectedRowId((rawId.get(id) ?? id) as string);
          onRowClick();
        }}
        onRowSelectionModelChange={(model) => {
          const ids =
            model.type === 'include'
              ? [...model.ids].map(String)
              : rows.map((r) => r[ID]).filter((id) => !model.ids.has(id));
          select(ids);
          onRowSelectionModelChange();
        }}
        onPaginationModelChange={(model: GridPaginationModel) => {
          pageRef.current = model;
          setPage(model);
          // Published now, so the event's handler reads the new page (the effect above repeats it harmlessly).
          setPaginationModel({ ...model });
          onPaginationModelChange();
        }}
        onSortModelChange={(model) => {
          setSortModel([...model]);
          onSortModelChange();
        }}
      />
    </MuiProvider>
  );
};
