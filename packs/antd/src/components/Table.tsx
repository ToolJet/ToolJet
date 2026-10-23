import React, { useMemo, useState } from 'react';
import { Table as AntTable, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { readField, rowKeyOf, str, toArray, toRows, type Row } from '../lib/data';
import { formatCell, isIdField, parseFormat, tagColor, toNumber } from '../lib/format';
import { chipLabel, chipTone } from '../lib/ui2/display/lists/model';

type Column = {
  title: string;
  dataIndex: string;
  align?: 'left' | 'right' | 'center';
  width?: number;
  ellipsis?: boolean;
  sorter?: boolean;
  format?: string;
  currency?: string;
  colors?: Record<string, string>;
};

// A status word's tone (Paid green, Overdue red) as Ant's Tag status colour, when the column names no colours.
const TONE_TAG: Record<string, string | undefined> = { success: 'success', warning: 'warning', danger: 'error', info: 'processing', neutral: undefined };

const humanize = (k: string) => k.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

// Ant's columns ({ title, dataIndex, format }); also UI 2.0's ({ name or label, key, type }, type 'currency:USD') and
// plain field names, column by column, so a bound columns value of either shape works. None: every field of the first
// row.
const toColumns = (raw: unknown, rows: Row[]): Column[] => {
  const given = toArray(raw)
    .map((c): Column | null => {
      if (typeof c === 'string') return { title: humanize(c), dataIndex: c };
      if (!c || typeof c !== 'object') return null;
      const r = c as Row;
      const dataIndex = str(r.dataIndex ?? r.key ?? r.field ?? r.name);
      if (!dataIndex) return null;
      // A listed column can still be hidden (UI 2.0: hidden, or visible: false).
      if (r.hidden === true || r.hidden === 'true' || r.visible === false || r.visible === 'false') return { hidden: true } as unknown as Column;
      // A tag column's colours: { value: colour } (colors, tagColors, badgeColors) or options [{ value, color }].
      const map: Record<string, string> = {};
      for (const m of [r.colors, r.tagColors, r.badgeColors]) if (m && typeof m === 'object' && !Array.isArray(m)) Object.assign(map, m as Record<string, string>);
      for (const o of toArray(r.options)) if (o && typeof o === 'object') {
        const v = str((o as Row).value ?? (o as Row).label);
        if (v && (o as Row).color) map[v] = str((o as Row).color);
      }
      return {
        title: str(r.title ?? r.label ?? (r.dataIndex !== undefined || r.key !== undefined || r.field !== undefined ? r.name : undefined) ?? humanize(dataIndex)),
        dataIndex,
        align: (r.align as Column['align']) || undefined,
        width: toNumber(r.width) ?? undefined,
        ellipsis: r.ellipsis === undefined ? undefined : Boolean(r.ellipsis),
        sorter: r.sorter === undefined ? undefined : Boolean(r.sorter),
        ...(() => {
          const f = parseFormat(r.format ?? r.type);
          return { format: f.format, currency: str(r.currency) || f.currency };
        })(),
        colors: Object.keys(map).length ? map : undefined,
      };
    })
    .filter((c): c is Column => !!c);
  // Columns given: exactly those (hidden ones dropped); none given: every field of the first row.
  if (given.length) return given.filter((c) => !(c as unknown as { hidden?: boolean }).hidden);
  const first = rows[0];
  return first ? Object.keys(first).map((k) => ({ title: humanize(k), dataIndex: k })) : [];
};

const compare = (a: unknown, b: unknown) => {
  const x = toNumber(a);
  const y = toNumber(b);
  if (x !== null && y !== null) return x - y;
  return str(a).localeCompare(str(b), undefined, { numeric: true });
};

// Ant's Table: dataSource, columns, title, rowKey, pagination with pageSize, bordered, size, showHeader, rowSelection type,
// emptyText (locale.emptyText); a column may set format (number, currency or currency:EUR, percent, date, datetime,
// tag, boolean), align, width, sorter
// and, for tags, colors { value: color }. Numbers are grouped and right-aligned. Events: onRowClick (Ant's
// onRow onClick), onChange (page or sort), onSelectionChange (rowSelection onChange).
export const Table = () => {
  const [rawData] = ToolJet.useStateArray({ name: 'dataSource', label: 'Data source', initialValue: [] });
  const [rawColumns] = ToolJet.useStateArray({
    name: 'columns',
    label: 'Columns',
    description: '[{ title, dataIndex, format?, align?, sorter? }]; empty shows every field.',
    initialValue: [],
  });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', description: 'A header above the rows; {count} is the number of rows.', initialValue: '' });
  const [rowKey] = ToolJet.useStateString({ name: 'rowKey', label: 'Row key', initialValue: 'id' });
  const [pagination] = ToolJet.useStateBoolean({ name: 'pagination', label: 'Pagination', initialValue: true });
  const [pageSize] = ToolJet.useStateNumber({ name: 'pageSize', label: 'Page size', initialValue: 10, min: 1, max: 500, visibleWhen: { key: 'pagination', value: true } });
  const [bordered] = ToolJet.useStateBoolean({ name: 'bordered', label: 'Bordered', initialValue: false });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['large', 'middle', 'small'], initialValue: 'middle' });
  const [showHeader] = ToolJet.useStateBoolean({ name: 'showHeader', label: 'Show header', initialValue: true });
  const [selectionType] = ToolJet.useStateEnumeration({
    name: 'rowSelection',
    label: 'Row selection',
    enumDefinition: ['none', 'checkbox', 'radio'],
    initialValue: 'none',
  });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty text', initialValue: 'No data' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency', description: 'For currency columns that name none.', initialValue: 'USD' });
  const [tagColors] = ToolJet.useStateObject({ name: 'tagColors', label: 'Tag colors', description: "{ 'Paid': 'green' }; else a status word's colour.", initialValue: {} });
  const [selectedRow, setSelectedRow] = ToolJet.useStateObject({ name: 'selectedRow', initialValue: {}, inspector: 'hidden' });
  const [selectedRowKeys, setSelectedRowKeys] = ToolJet.useStateArray({ name: 'selectedRowKeys', initialValue: [], inspector: 'hidden' });
  const [, setSelectedRows] = ToolJet.useStateArray({ name: 'selectedRows', initialValue: [], inspector: 'hidden' });
  const [current, setCurrent] = ToolJet.useStateNumber({ name: 'current', initialValue: 1, inspector: 'hidden' });
  const onRowClick = ToolJet.useEventCallback({ name: 'onRowClick' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onSelectionChange = ToolJet.useEventCallback({ name: 'onSelectionChange' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({ defaultWidth: 28, defaultHeight: 40 });

  const rows = useMemo(() => toRows(rawData), [rawData]);
  const columns = useMemo(() => toColumns(rawColumns, rows), [rawColumns, rows]);
  const field = str(rowKey) || 'id';
  const keyed = useMemo(() => rows.map((r, i) => ({ row: r, key: rowKeyOf(r, field, i) })), [rows, field]);
  const keyOf = new Map(keyed.map((k) => [k.row, k.key]));
  const selectedKey = selectedRow && typeof selectedRow === 'object' && Object.keys(selectedRow).length ? keyed.find((k) => k.row === selectedRow || JSON.stringify(k.row) === JSON.stringify(selectedRow))?.key : undefined;
  const [, force] = useState(0);

  const antColumns: TableColumnsType<Row> = columns.map((c) => {
    // An id column keeps its numbers as typed (1001, not 1,001) and to the left.
    const format = c.format ?? (isIdField(c.dataIndex) ? 'text' : undefined);
    const values = rows.map((r) => readField(r, c.dataIndex));
    const numeric =
      format !== 'text' &&
      (['number', 'currency', 'percent', 'compact'].includes(format ?? '') ||
        (!format && values.some((v) => typeof v === 'number') && values.every((v) => v === null || v === undefined || v === '' || typeof v === 'number')));
    return {
      key: c.dataIndex,
      title: c.title,
      dataIndex: c.dataIndex.split('.'),
      align: c.align ?? (numeric ? 'right' : undefined),
      width: c.width,
      ellipsis: c.ellipsis,
      sorter: c.sorter ? (a: Row, b: Row) => compare(readField(a, c.dataIndex), readField(b, c.dataIndex)) : undefined,
      render: (v: unknown) => {
        if (c.format === 'tag') {
          if (v === undefined || v === null || v === '') return null;
          const colors = { ...(tagColors && typeof tagColors === 'object' ? (tagColors as Record<string, string>) : {}), ...(c.colors ?? {}) };
          const lower = Object.fromEntries(Object.entries(colors).map(([k, x]) => [k.toLowerCase(), x]));
          // One Tag per value: a list (tags) or a comma-free single value.
          const values = (Array.isArray(v) ? v : [v]).map(str).filter(Boolean);
          return (
            <span className="tj-ant-cell-tags">
              {values.map((t) => {
                const named = colors[t] ?? lower[t.toLowerCase()];
                return (
                  <Tag key={t} color={named !== undefined ? tagColor(named) : TONE_TAG[chipTone(t)]}>
                    {chipLabel(t)}
                  </Tag>
                );
              })}
            </span>
          );
        }
        return formatCell(v, format, c.currency || str(currency) || 'USD');
      },
    };
  });

  const select = (keys: React.Key[]) => {
    const set = new Set(keys.map(String));
    setSelectedRowKeys(keys.map(String));
    setSelectedRows(keyed.filter((k) => set.has(k.key)).map((k) => k.row));
    onSelectionChange();
  };
  ToolJet.useAction({ name: 'selectRow', displayName: 'Select row', params: [{ handle: 'key', displayName: 'Row key' }] }, (key) => {
    const hit = keyed.find((k) => k.key === str(key));
    setSelectedRow(hit?.row ?? {});
    if (selectionType !== 'none') select(hit ? [hit.key] : []);
  });
  ToolJet.useAction({ name: 'clearSelection', displayName: 'Clear selection' }, () => {
    setSelectedRow({});
    if (selectionType !== 'none') select([]);
  });
  ToolJet.useAction({ name: 'setCurrent', displayName: 'Go to page', params: [{ handle: 'page', displayName: 'Page (from 1)' }] }, (p) => {
    setCurrent(Math.max(1, Number(p) || 1));
    force((n) => n + 1);
  });

  const size_ = Math.max(1, Math.min(500, Number(pageSize) || 10));
  return (
    <AntProvider tokens={tokens} className="tj-ant-table">
      <AntTable<Row>
        dataSource={rows}
        columns={antColumns}
        title={title ? () => str(title).replace('{count}', String(rows.length)) : undefined}
        rowKey={(r) => keyOf.get(r) ?? ''}
        bordered={bordered}
        size={size as 'middle'}
        showHeader={showHeader}
        loading={loading}
        locale={{ emptyText: emptyText || 'No data' }}
        pagination={
          pagination && rows.length > size_
            ? { pageSize: size_, current: Math.max(1, Number(current) || 1), showSizeChanger: false, size: size === 'large' ? 'default' : 'small' }
            : false
        }
        rowSelection={
          selectionType === 'none'
            ? undefined
            : {
                type: selectionType as 'checkbox',
                selectedRowKeys: toArray(selectedRowKeys).map(String),
                onChange: (keys) => select(keys),
              }
        }
        rowClassName={(r) => (keyOf.get(r) === selectedKey ? 'tj-ant-row-selected' : '')}
        onRow={(r) => ({
          onClick: () => {
            setSelectedRow(r);
            onRowClick();
          },
        })}
        onChange={(p) => {
          if (p.current) setCurrent(p.current);
          onChange();
        }}
      />
    </AntProvider>
  );
};
