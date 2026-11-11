import React, { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { Table as AntTable } from 'antd';
import type { TableColumnsType } from 'antd';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { AntProvider, useTokenStyles } from '../lib/AntProvider';
import { PackTag } from '../lib/PackTag';
import { occurrenceKeys, readField, rowIdOf, rowIdText, rowKeyOf, str, toArray, toRows, type Row } from '../lib/data';
import { formatCell, isIdField, parseFormat, tagColor, toNumber } from '../lib/format';
import { LOCALE_HINT } from '../lib/locale';
import { chipLabel, chipTone } from '../lib/ui2/display/lists/model';

type Column = {
  /** A date column's pattern (dayjs tokens: DD/MM, MMM D, YYYY), UI 2.0's dateFormat. */
  dateFormat?: string;
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
const TONE_TAG: Record<string, string | undefined> = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'processing',
  neutral: undefined,
};

// An html cell (columnType 'html', as UI 2.0's Table): sanitised as the Table does (DOMPurify's defaults drop
// <script>, event-handler attributes and javascript: URLs). Its text sorts.
const sanitize = (v: unknown) =>
  typeof window === 'undefined' ? '' : DOMPurify.sanitize((v === undefined || v === null ? '' : String(v)).trim());
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

const isFalse = (v: unknown) => v === false || v === 'false' || v === '{{false}}';
const isHidden = (r: Row) =>
  r.hidden === true || r.hidden === 'true' || isFalse(r.visible) || isFalse(r.columnVisibility);

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
      // A listed column can still be hidden (hidden, or visible: false; UI 2.0's Table: columnVisibility: false).
      if (isHidden(r)) return { hidden: true } as unknown as Column;
      // A tag column's colours: { value: colour } (colors, tagColors, badgeColors) or options [{ value, color }].
      const map: Record<string, string> = {};
      for (const m of [r.colors, r.tagColors, r.badgeColors])
        if (m && typeof m === 'object' && !Array.isArray(m)) Object.assign(map, m as Record<string, string>);
      for (const o of toArray(r.options))
        if (o && typeof o === 'object') {
          const v = str((o as Row).value ?? (o as Row).label);
          if (v && (o as Row).color) map[v] = str((o as Row).color);
        }
      return {
        title: str(
          r.title ??
            r.label ??
            (r.dataIndex !== undefined || r.key !== undefined || r.field !== undefined ? r.name : undefined) ??
            humanize(dataIndex)
        ),
        dataIndex,
        align: (r.align as Column['align']) || undefined,
        width: toNumber(r.width ?? r.columnSize) ?? undefined,
        ellipsis: r.ellipsis === undefined ? undefined : Boolean(r.ellipsis),
        sorter: r.sorter === undefined ? undefined : Boolean(r.sorter),
        ...(() => {
          // UI 2.0's Table names an html column with columnType (or type) 'html'.
          const kind = str(r.columnType ?? r.type ?? r.format)
            .trim()
            .toLowerCase();
          if (kind === 'html' || str(r.format).trim().toLowerCase() === 'html') return { format: 'html' };
          const f = parseFormat(r.format ?? r.columnType ?? r.type);
          return {
            format: f.format,
            currency: str(r.currency) || f.currency,
            dateFormat: str(r.dateFormat) || undefined,
          };
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
// tag, boolean, html: sanitised markup, also columnType 'html'), align, width, sorter
// and, for tags, colors { value: color }. Numbers are grouped and right-aligned. Events: onRowClick (Ant's
// onRow onClick), onChange (page or sort), onSelectionChange (rowSelection onChange).
// Ant draws a row's `children` as nested rows (tree data) and threw on any that is not a list
// ((data || []).forEach is not a function): a query row with a children field of text crashed the widget (QA item 40).
// Tree data is kept when every children field is a list of records, at every level; otherwise the rows are drawn flat,
// as given, with children an ordinary field. Cut off at a depth no real tree reaches (a self-referencing object).
const NO_TREE = { childrenColumnName: '__tjNoChildRows' };
const isTree = (list: unknown[], depth = 0): boolean =>
  depth < 32 &&
  list.every((row) => {
    const children = (row as Row | null)?.children;
    if (children === undefined || children === null) return true;
    return (
      Array.isArray(children) &&
      children.every((c) => !!c && typeof c === 'object' && !Array.isArray(c)) &&
      isTree(children, depth + 1)
    );
  });

export const Table = () => {
  const [rawData] = ToolJet.useStateArray({
    name: 'dataSource',
    label: 'Data source',
    initialValue: [
      { id: 1, name: 'Maya Chen', status: 'Paid', amount: 1250, date: '2026-09-14' },
      { id: 2, name: 'Owen Hart', status: 'Pending', amount: 980.5, date: '2026-09-21' },
      { id: 3, name: 'Priya Nair', status: 'Overdue', amount: 3120, date: '2026-08-30' },
      { id: 4, name: 'Leo Martins', status: 'Paid', amount: 640, date: '2026-09-28' },
    ],
  });
  const [rawColumns] = ToolJet.useStateArray({
    name: 'columns',
    label: 'Columns',
    description: '[{ title, dataIndex, format?, align?, sorter? }]; empty shows every field.',
    initialValue: [
      { title: 'Name', dataIndex: 'name' },
      { title: 'Status', dataIndex: 'status', format: 'tag' },
      { title: 'Date', dataIndex: 'date', format: 'date' },
      { title: 'Amount', dataIndex: 'amount', format: 'currency', align: 'right' },
    ],
  });
  const [title] = ToolJet.useStateString({
    name: 'title',
    label: 'Title',
    description: 'A header above the rows; {count} is the number of rows.',
    initialValue: '',
  });
  const [rowKey] = ToolJet.useStateString({ name: 'rowKey', label: 'Row key', initialValue: 'id' });
  const [pagination] = ToolJet.useStateBoolean({ name: 'pagination', label: 'Pagination', initialValue: true });
  const [pageSize] = ToolJet.useStateNumber({
    name: 'pageSize',
    label: 'Page size',
    initialValue: 10,
    min: 1,
    max: 500,
    visibleWhen: { key: 'pagination', value: true },
  });
  const [bordered] = ToolJet.useStateBoolean({ name: 'bordered', label: 'Bordered', initialValue: false });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['large', 'middle', 'small'],
    initialValue: 'middle',
  });
  const [showHeader] = ToolJet.useStateBoolean({ name: 'showHeader', label: 'Show header', initialValue: true });
  const [selectionType] = ToolJet.useStateEnumeration({
    name: 'rowSelection',
    label: 'Row selection',
    enumDefinition: ['none', 'checkbox', 'radio'],
    initialValue: 'none',
  });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty text', initialValue: 'No data' });
  const [currency] = ToolJet.useStateString({
    name: 'currency',
    label: 'Currency',
    description: 'For currency columns that name none.',
    initialValue: 'USD',
  });
  const [locale] = ToolJet.useStateString({
    name: 'locale',
    label: 'Locale',
    description: LOCALE_HINT,
    initialValue: '',
  });
  const [tagColors] = ToolJet.useStateObject({
    name: 'tagColors',
    label: 'Tag colors',
    description: "{ 'Paid': 'green' }; else a status word's colour.",
    initialValue: {},
  });
  const [selectedRow, setSelectedRow] = ToolJet.useStateObject({
    name: 'selectedRow',
    initialValue: {},
    inspector: 'hidden',
  });
  const [selectedRowKeys, setSelectedRowKeys] = ToolJet.useStateArray({
    name: 'selectedRowKeys',
    initialValue: [],
    inspector: 'hidden',
  });
  const [selectedRows, setSelectedRows] = ToolJet.useStateArray({
    name: 'selectedRows',
    initialValue: [],
    inspector: 'hidden',
  });
  const [current, setCurrent] = ToolJet.useStateNumber({ name: 'current', initialValue: 1, inspector: 'hidden' });
  const onRowClick = ToolJet.useEventCallback({ name: 'onRowClick' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onSelectionChange = ToolJet.useEventCallback({ name: 'onSelectionChange' });
  const { loading } = ToolJet.useControlState();
  const tokens = useTokenStyles();
  ToolJet.useComponentSettings({
    role: 'table',
    fit: true,
    loading: 'own',
    usage:
      "Ant's Table: dataSource, columns (Ant's [{title, dataIndex, format?, align?, width?, sorter?}] or UI 2.0's [{name, key, type}]; format/type number, currency or currency:EUR, percent, date, datetime, tag/badge/status, boolean, html (sanitised markup; columnType 'html' too); empty shows every field), rowKey, pagination with pageSize, rowSelection (none, checkbox, radio), size, bordered, currency, locale, tagColors. selectedRow (clicked), selectedRowKeys and selectedRows are exposed; onRowClick.",
    roleProps: {
      data: 'dataSource',
      rowsPerPage: 'pageSize',
      enablePagination: 'pagination',
      idField: 'rowKey',
      badgeColors: 'tagColors',
    },
    defaultWidth: 28,
    defaultHeight: 40,
  });

  const rows = useMemo(() => toRows(rawData), [rawData]);
  const tree = useMemo(() => isTree(rows), [rows]);
  const columns = useMemo(() => toColumns(rawColumns, rows), [rawColumns, rows]);
  const field = str(rowKey) || 'id';
  // Each row's own key (lib/data occurrenceKeys: a repeated id gets 1, then 1~1); text is its id as text (its place for
  // a row without one) and id the id as the data has it, for exposing. Two rows that shared an id had one key, so both
  // were ticked and highlighted together and selectedRows held both (QA AD-30).
  const keyed = useMemo(() => {
    const own = occurrenceKeys(rows, field);
    return rows.map((r, i) => ({ row: r, key: own[i], text: rowKeyOf(r, field, i), id: rowIdOf(r, field, i) }));
  }, [rows, field]);
  const keyOf = new Map(keyed.map((k) => [k.row, k.key]));
  const holdersOf = useMemo(() => {
    const byText = new Map<string, typeof keyed>();
    for (const k of keyed) {
      const list = byText.get(k.text);
      if (list) list.push(k);
      else byText.set(k.text, [k]);
    }
    return byText;
  }, [keyed]);
  // The row a selected record is now, by its id as text: the one row holding it, so an edited record is followed as it
  // is now; when more rows hold it, the one that is the record, else the one with its content (two records that share
  // an id are told apart). A record no row's id names (a row without an id) is found by its content. Rows in `taken`
  // are already claimed.
  const locate = (record: unknown, id: string, taken: ReadonlySet<string> = new Set()) => {
    const holders = holdersOf.get(id) ?? [];
    if (holders.length === 1) return taken.has(holders[0].key) ? undefined : holders[0];
    // A record with an id no row holds has no row with its content either.
    if (!holders.length && record && typeof record === 'object' && rowIdText(record as Row, field) !== '')
      return undefined;
    const pool = (holders.length ? holders : keyed).filter((k) => !taken.has(k.key));
    const same = JSON.stringify(record);
    return pool.find((k) => k.row === record) ?? pool.find((k) => JSON.stringify(k.row) === same);
  };
  // The highlighted row is found by its id first: on a data update the rows are new objects (an edited one also new
  // content) until the effect below re-exposes selectedRow, and the content match alone left that render with no row
  // highlighted (a flicker under 200 ms updates).
  const hasSelectedRow = !!selectedRow && typeof selectedRow === 'object' && Object.keys(selectedRow).length > 0;
  const selectedKey = hasSelectedRow ? locate(selectedRow, rowKeyOf(selectedRow as Row, field, -1))?.key : undefined;
  // The rows the selection holds, by their own keys: each exposed id with its record (selectedRowKeys and selectedRows
  // are set together), in turn.
  const chosenKeys = (() => {
    const records = toArray(selectedRows);
    const taken = new Set<string>();
    toArray(selectedRowKeys).forEach((id, n) => {
      const hit = locate(records[n], str(id), taken);
      if (hit) taken.add(hit.key);
    });
    return [...taken];
  })();
  const [, force] = useState(0);

  const antColumns: TableColumnsType<Row> = columns.map((c) => {
    // An id column keeps its numbers as typed (1001, not 1,001) and to the left.
    const format = c.format ?? (isIdField(c.dataIndex) ? 'text' : undefined);
    const values = rows.map((r) => readField(r, c.dataIndex));
    const numeric =
      format !== 'text' &&
      (['number', 'currency', 'percent', 'compact'].includes(format ?? '') ||
        (!format &&
          values.some((v) => typeof v === 'number') &&
          values.every((v) => v === null || v === undefined || v === '' || typeof v === 'number')));
    return {
      key: c.dataIndex,
      title: c.title,
      dataIndex: c.dataIndex.split('.'),
      align: c.align ?? (numeric ? 'right' : undefined),
      width: c.width,
      ellipsis: c.ellipsis,
      sorter: c.sorter
        ? format === 'html'
          ? (a: Row, b: Row) => compare(textOf(readField(a, c.dataIndex)), textOf(readField(b, c.dataIndex)))
          : (a: Row, b: Row) => compare(readField(a, c.dataIndex), readField(b, c.dataIndex))
        : undefined,
      render: (v: unknown) => {
        if (format === 'html')
          return <div className="tj-ant-html-cell" dangerouslySetInnerHTML={{ __html: sanitize(v) }} />;
        if (c.format === 'tag') {
          if (v === undefined || v === null || v === '') return null;
          const colors = {
            ...(tagColors && typeof tagColors === 'object' ? (tagColors as Record<string, string>) : {}),
            ...(c.colors ?? {}),
          };
          const lower = Object.fromEntries(Object.entries(colors).map(([k, x]) => [k.toLowerCase(), x]));
          // One Tag per value: a list (tags) or a comma-free single value.
          const values = (Array.isArray(v) ? v : [v]).map(str).filter(Boolean);
          return (
            <span className="tj-ant-cell-tags">
              {values.map((t, i) => {
                const named = colors[t] ?? lower[t.toLowerCase()];
                // Keyed by place, not by text: a status that changes (Open to Paid) updates its Tag in place instead of
                // remounting it on every data update.
                return (
                  <PackTag key={i} color={named !== undefined ? tagColor(named) : TONE_TAG[chipTone(t)]}>
                    {chipLabel(t)}
                  </PackTag>
                );
              })}
            </span>
          );
        }
        return formatCell(
          v,
          format,
          c.currency || str(currency) || 'USD',
          locale,
          (c as { dateFormat?: string }).dateFormat
        );
      },
    };
  });

  // selectedRowKeys keep the ids' own type (1, not '1'), as the data has them.
  const select = (keys: React.Key[]) => {
    const set = new Set(keys.map(String));
    const hits = keyed.filter((k) => set.has(k.key));
    setSelectedRowKeys(hits.map((k) => k.id));
    setSelectedRows(hits.map((k) => k.row));
    onSelectionChange();
  };
  // The selection follows its records across a refresh or a reorder (an edited row is exposed as it is now, see
  // locate), and drops the ones that are gone: the old rows stayed exposed while nothing was drawn selected (SP-31).
  const rowsKey = JSON.stringify(rows);
  useEffect(() => {
    if (hasSelectedRow) {
      const hit = locate(selectedRow, rowKeyOf(selectedRow as Row, field, -1));
      if (!hit) setSelectedRow({});
      else if (JSON.stringify(hit.row) !== JSON.stringify(selectedRow)) setSelectedRow(hit.row);
    }
    const was = toArray(selectedRowKeys).length;
    if (was) {
      const chosen = new Set(chosenKeys);
      const hits = keyed.filter((k) => chosen.has(k.key));
      setSelectedRowKeys(hits.map((k) => k.id));
      setSelectedRows(hits.map((k) => k.row));
      // Rows that left the data leave the selection, and that is a selection change (it fired nothing).
      if (hits.length < was) onSelectionChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsKey, field]);
  ToolJet.useAction(
    { name: 'selectRow', displayName: 'Select row', params: [{ handle: 'key', displayName: 'Row key' }] },
    (key) => {
      // The first row holding the id.
      const hit = keyed.find((k) => k.text === str(key));
      setSelectedRow(hit?.row ?? {});
      if (selectionType === 'none') return;
      // Checkbox selection adds the row to those selected (it replaced the whole selection); radio picks only it.
      const kept = selectionType === 'checkbox' ? chosenKeys : [];
      select(hit ? [...kept.filter((k) => k !== hit.key), hit.key] : kept);
    }
  );
  ToolJet.useAction({ name: 'clearSelection', displayName: 'Clear selection' }, () => {
    setSelectedRow({});
    if (selectionType !== 'none') select([]);
  });
  ToolJet.useAction(
    { name: 'setCurrent', displayName: 'Go to page', params: [{ handle: 'page', displayName: 'Page (from 1)' }] },
    (p) => {
      setCurrent(Math.max(1, Number(p) || 1));
      force((n) => n + 1);
    }
  );

  const size_ = Math.max(1, Math.min(500, Number(pageSize) || 10));
  // Fewer rows than the page needs: Ant draws the last page, and current says so too, down to one page (a table whose
  // data shrank to one page kept current at 3 and went back to page 3 when the data grew again).
  const pages = Math.max(1, Math.ceil(rows.length / size_));
  useEffect(() => {
    if (pagination && Number(current) > pages) setCurrent(pages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, current, pagination]);
  return (
    <AntProvider tokens={tokens} fill className="tj-ant-table tj-ant-scroll">
      <AntTable<Row>
        dataSource={rows}
        expandable={tree ? undefined : NO_TREE}
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
            ? {
                pageSize: size_,
                current: Math.max(1, Number(current) || 1),
                showSizeChanger: false,
                size: size === 'large' ? 'default' : 'small',
              }
            : false
        }
        rowSelection={
          selectionType === 'none'
            ? undefined
            : {
                type: selectionType as 'checkbox',
                selectedRowKeys: chosenKeys,
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
