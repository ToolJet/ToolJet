import React, { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { Chip } from '@mui/material';
import { DataGrid as MuiDataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel, GridRowSelectionModel, GridSortModel } from '@mui/x-data-grid';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useStateText } from '../lib/text';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import { rowKeyOf, str, toArray, toRows, type Row } from '../lib/data';
import { formatCell, isIdField, toNumber } from '../lib/format';
import { SAMPLE } from '../lib/samples';

const ID = '__tjRowId';
const ROW_HEIGHT = { compact: 36, standard: 52, comfortable: 67 };
// The free DataGrid pages at most 100 rows (more is a Pro feature).
const MAX_PAGE_SIZE = 100;
// An html cell (columnType 'html', as UI 2.0's Table): sanitised as the Table does (DOMPurify's defaults drop
// <script>, event-handler attributes and javascript: URLs); its text sorts, filters and exports.
const sanitize = (v: unknown) => DOMPurify.sanitize((v === undefined || v === null ? '' : String(v)).trim());
const textOf = (v: unknown) => {
  if (typeof document === 'undefined') return str(v);
  const el = document.createElement('div');
  el.innerHTML = sanitize(v);
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
};
const humanize = (k: string) => k.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

type Column = GridColDef & { format?: string; currency?: string; colors?: Record<string, string> };

// MUI's column shape ({ field, headerName, type, width, flex, align, sortable }); also { key, label }, { dataIndex,
// title } and plain field names. A column may add format (currency, percent, compact, chip, html) with currency and,
// for chips, colors { value: palette colour }; type or columnType 'html' (UI 2.0's Table) is the html format. None:
// every field of the first row.
const toColumns = (raw: unknown, rows: Row[]): Column[] => {
  const given = toArray(raw)
    .map((c): Column | null => {
      if (typeof c === 'string') return { field: c, headerName: humanize(c) };
      if (!c || typeof c !== 'object') return null;
      const r = c as Row;
      const field = str(r.field ?? r.key ?? r.dataIndex ?? r.name);
      if (!field) return null;
      const type = str(r.type ?? r.columnType);
      // UI 2.0's Table names a column { key, name }: name is then the header.
      const named = r.field !== undefined || r.key !== undefined || r.dataIndex !== undefined ? r.name : undefined;
      const col: Column = { field, headerName: str(r.headerName ?? r.label ?? r.title ?? named) || humanize(field) };
      if (['string', 'number', 'date', 'dateTime', 'boolean'].includes(type)) col.type = type as 'string';
      const width = toNumber(r.width);
      const flex = toNumber(r.flex);
      if (width) col.width = width;
      if (flex) col.flex = flex;
      if (!width && !flex) col.flex = 1;
      if (r.align) col.align = col.headerAlign = r.align as 'left';
      if (r.sortable !== undefined) col.sortable = Boolean(r.sortable);
      col.format = type === 'html' ? 'html' : str(r.format) || undefined;
      col.currency = str(r.currency) || undefined;
      if (r.colors && typeof r.colors === 'object') col.colors = r.colors as Record<string, string>;
      return col;
    })
    .filter((c): c is Column => !!c);
  if (given.length) return given;
  const first = rows[0];
  return first ? Object.keys(first).map((k) => ({ field: k, headerName: humanize(k), flex: 1 })) : [];
};

// What the grid gets for a column: numbers typed as numbers (right-aligned, numeric sort), dates read from ISO strings,
// and the formats MUI leaves to valueFormatter / renderCell.
const toGridColumn = (c: Column, rows: Row[]): GridColDef => {
  const { format, currency, colors, ...col } = c;
  const sample = rows.find((r) => r[c.field] !== undefined && r[c.field] !== null && r[c.field] !== '')?.[c.field];
  if (!col.type && !format && !isIdField(c.field) && typeof sample === 'number') col.type = 'number';
  if (['number', 'currency', 'percent', 'compact'].includes(format ?? '')) col.type = 'number';
  if (col.type === 'date' || col.type === 'dateTime') col.valueGetter = (v: unknown) => (v ? new Date(String(v)) : null);
  if (col.type === 'number') {
    col.valueGetter = (v: unknown) => toNumber(v);
    if (format) col.valueFormatter = (v: unknown) => (v === null || v === undefined ? '' : formatCell(v, format, currency));
  } else if (format === 'html') {
    col.renderCell = (p) => (
      <div className="tj-mui-html-cell">
        <div dangerouslySetInnerHTML={{ __html: sanitize(p.value) }} />
      </div>
    );
    col.valueFormatter = (v: unknown) => textOf(v);
    col.sortComparator = (a: unknown, b: unknown) => textOf(a).localeCompare(textOf(b));
  } else if (format === 'chip') {
    col.renderCell = (p) =>
      p.value === undefined || p.value === null || p.value === '' ? null : <Chip size="small" label={str(p.value)} color={(colors?.[str(p.value)] ?? 'default') as 'default'} />;
  } else if (!col.type) {
    col.valueFormatter = (v: unknown) => (isIdField(c.field) ? str(v) : formatCell(v, format));
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
  const [rawColumns] = ToolJet.useStateArray({ name: 'columns', label: 'Columns', description: '[{ field, headerName, type, width, flex }]; empty: every field.', initialValue: SAMPLE.columns });
  const [rowIdField] = useStateText({ name: 'rowIdField', label: 'Row id field', description: "The rows' id field (getRowId).", initialValue: 'id' });
  const [density] = ToolJet.useStateEnumeration({ name: 'density', label: 'Density', enumDefinition: ['compact', 'standard', 'comfortable'], initialValue: 'standard' });
  const [checkboxSelection] = ToolJet.useStateBoolean({ name: 'checkboxSelection', label: 'Checkbox selection', initialValue: false });
  const [autoPageSize] = ToolJet.useStateBoolean({ name: 'autoPageSize', label: 'Auto page size', description: 'As many rows per page as fit.', initialValue: false });
  const [pageSize] = ToolJet.useStateNumber({ name: 'pageSize', label: 'Page size', initialValue: 10, min: 1, max: MAX_PAGE_SIZE, visibleWhen: { key: 'autoPageSize', value: false } });
  const [showToolbar] = ToolJet.useStateBoolean({ name: 'showToolbar', label: 'Show toolbar', initialValue: false });
  const [disableColumnMenu] = ToolJet.useStateBoolean({ name: 'disableColumnMenu', label: 'Disable column menu', initialValue: false });
  const [hideFooter] = ToolJet.useStateBoolean({ name: 'hideFooter', label: 'Hide footer', initialValue: false });
  const [noRowsLabel] = useStateText({ name: 'noRowsLabel', label: 'No rows label', initialValue: 'No rows' });
  const [, setSelectedRow] = ToolJet.useStateObject({ name: 'selectedRow', initialValue: {}, inspector: 'hidden' });
  const [, setSelectedRowId] = useStateText({ name: 'selectedRowId', initialValue: '', inspector: 'hidden' });
  const [selectionIds, setSelectionIds] = ToolJet.useStateArray({ name: 'rowSelectionModel', initialValue: [], inspector: 'hidden' });
  const [, setSelectedRows] = ToolJet.useStateArray({ name: 'selectedRows', initialValue: [], inspector: 'hidden' });
  const [, setPaginationModel] = ToolJet.useStateObject({ name: 'paginationModel', initialValue: { page: 0, pageSize: 10 }, inspector: 'hidden' });
  const [sortModel, setSortModel] = ToolJet.useStateArray({ name: 'sortModel', initialValue: [], inspector: 'hidden' });
  const onRowClick = ToolJet.useEventCallback({ name: 'onRowClick' });
  const onRowSelectionModelChange = ToolJet.useEventCallback({ name: 'onRowSelectionModelChange' });
  const onPaginationModelChange = ToolJet.useEventCallback({ name: 'onPaginationModelChange' });
  const onSortModelChange = ToolJet.useEventCallback({ name: 'onSortModelChange' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 30, defaultHeight: 40 });
  const size = Math.max(1, Math.min(MAX_PAGE_SIZE, Number(pageSize) || 10));
  const [page, setPage] = useState({ page: 0, pageSize: size });
  useEffect(() => setPage((m) => (m.pageSize === size ? m : { page: 0, pageSize: size })), [size]);

  const field = str(rowIdField) || 'id';
  const source = useMemo(() => toRows(rawRows), [rawRows]);
  const { rows, byId } = useMemo(() => {
    const byId = new Map<string, Row>();
    const rows = source.map((r, i) => {
      const id = rowKeyOf(r, field, i);
      byId.set(id, r);
      return { ...r, [ID]: id };
    });
    return { rows, byId };
  }, [source, field]);
  const defs = useMemo(() => toColumns(rawColumns, source), [rawColumns, source]);
  const columns = useMemo(() => defs.map((c) => toGridColumn(c, source)), [defs, source]);
  // Html cells can hold several blocks (a name over a detail line): rows grow to fit them, as MUI's auto row height.
  const htmlCells = defs.some((c) => c.format === 'html');
  const selection: GridRowSelectionModel = useMemo(() => ({ type: 'include', ids: new Set(toArray(selectionIds).map(str)) }), [selectionIds]);

  const select = (ids: string[]) => {
    setSelectionIds(ids);
    setSelectedRows(ids.map((id) => byId.get(id)).filter(Boolean));
  };
  ToolJet.useAction({ name: 'selectRow', displayName: 'Select row', params: [{ handle: 'id', displayName: 'Row id' }] }, (id) => {
    const row = byId.get(str(id));
    setSelectedRow(row ?? {});
    setSelectedRowId(row ? str(id) : '');
    select(row ? [str(id)] : []);
  });
  ToolJet.useAction({ name: 'clearSelection', displayName: 'Clear selection' }, () => {
    setSelectedRow({});
    setSelectedRowId('');
    select([]);
  });
  ToolJet.useAction({ name: 'setPage', displayName: 'Set page', params: [{ handle: 'page', displayName: 'Page (from 0)' }] }, (p) =>
    setPage((m) => ({ ...m, page: Math.max(0, toNumber(p) ?? 0) }))
  );

  return (
    <MuiProvider overrides={overrides} fill>
      <MuiDataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => String(r[ID])}
        getRowHeight={htmlCells ? () => 'auto' : undefined}
        density={density as 'standard'}
        checkboxSelection={checkboxSelection}
        rowSelectionModel={selection}
        autoPageSize={autoPageSize}
        paginationModel={page}
        pageSizeOptions={autoPageSize ? undefined : Array.from(new Set([size, 10, 25, 50, 100])).sort((a, b) => a - b)}
        sortModel={toArray(sortModel) as GridSortModel}
        showToolbar={showToolbar}
        disableColumnMenu={disableColumnMenu}
        hideFooter={hideFooter}
        loading={loading}
        localeText={{ noRowsLabel: noRowsLabel || 'No rows' }}
        sx={{
          height: '100%',
          border: 1,
          borderColor: 'divider',
          // With auto row heights a one-line row keeps the density's height (MUI's 36, 52, 67px).
          '& .tj-mui-html-cell': { minHeight: ROW_HEIGHT[density as keyof typeof ROW_HEIGHT] ?? 52 },
          // ... and every cell of a grown row centres its content, as in a fixed-height row.
          ...(htmlCells ? { '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' } } : {}),
        }}
        onRowClick={(params) => {
          const id = String(params.id);
          setSelectedRow(byId.get(id) ?? {});
          setSelectedRowId(id);
          onRowClick();
        }}
        onRowSelectionModelChange={(model) => {
          const ids = model.type === 'include' ? [...model.ids].map(String) : rows.map((r) => r[ID]).filter((id) => !model.ids.has(id));
          select(ids);
          onRowSelectionModelChange();
        }}
        onPaginationModelChange={(model: GridPaginationModel) => {
          setPage(model);
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
