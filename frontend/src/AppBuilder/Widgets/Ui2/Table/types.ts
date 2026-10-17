import type { MutableRefObject } from 'react';
import type { Resolved } from '@/AppBuilder/Widgets/Ui2/_shared/types';

/** A row of the table's data. */
export type Row = Record<string, unknown>;

export type ColumnType =
  | 'string'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'badge'
  | 'tags'
  | 'boolean'
  | 'link'
  | 'image'
  | 'avatar'
  | 'progress'
  | 'button'
  | 'json'
  | 'html';

export interface ColumnFormat {
  decimalPlaces?: number;
  currency?: string;
  locale?: string;
  dateFormat?: string;
  prefix?: string;
  suffix?: string;
}

/** A column as the table uses it, from whichever shape the author bound (normalizeColumns). Options, buttons and
 *  conditional styles stay as the author bound them. */
export interface TableColumn {
  id: string;
  key: string;
  name: string;
  type: ColumnType;
  align: string;
  width?: number;
  minWidth?: number;
  visible: boolean;
  sortable: boolean;
  searchable: boolean;
  editable: boolean;
  pin?: 'left' | 'right';
  wrap: boolean;
  format: ColumnFormat;
  options?: Resolved[];
  badgeColors?: Resolved;
  buttons?: Resolved[];
  textColor?: unknown;
  cellBackgroundColor?: unknown;
  fontWeight?: string | number;
  linkText?: unknown;
  openInNewTab: boolean;
  imageShape?: string;
  maxValue: number;
  transformation?: string;
  conditionalStyles: Resolved[];
}

/** What formatCell and passes need of a column. */
export type ColumnLike = { type?: ColumnType | string; format?: ColumnFormat };

/** A filter as the table holds it: a column key (or header name), a FILTER_CONDITIONS key, and the value. */
export interface TableFilter {
  column: string;
  condition: string;
  value?: unknown;
}

/** A data row with its position in the data and its stable key (rowKey). */
export interface Entry {
  row: Row;
  index: number;
  key: string;
}

/** Edited cells by row key: the changed fields of each row, laid over the data until it changes. */
export type Edits = Map<string, Row>;

export interface Sort {
  key: string;
  direction: 'asc' | 'desc';
}

/** The rows on the current page and the paging state (listModel's pageOf). */
export interface Paged {
  items: Entry[];
  pageCount: number | null;
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** The cell being edited: its row key and column id. */
export interface Editing {
  key: string;
  column: string;
}

/** Everything the actions and handlers read later, without going stale (filled on every render). */
export interface Live {
  entries: Entry[];
  processed: Entry[];
  paged: Paged;
  selected: Set<string>;
  edits: Edits;
  columns: TableColumn[];
  filters: TableFilter[];
  sort: Sort | null;
  searchText: string;
  data: Row[];
  focusKey: string | null;
}

export type LiveRef = MutableRefObject<Live>;

export type WithEdits = (entry: Entry) => Row;

/** A column option that may be a per-row binding, resolved for one row and cell. */
export type Resolve = (value: unknown, row: Row, cellValue: unknown) => unknown;

export type OnAction = (buttonId: string, column: TableColumn, row: Row, rowIndex: number) => void;

/** Whether a user action fires its event (component actions called from a query do not, as on the native Table). */
export interface FireOption {
  fire?: boolean;
}
