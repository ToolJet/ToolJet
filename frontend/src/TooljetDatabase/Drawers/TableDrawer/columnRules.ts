import type { ColumnPayload, DraftColumn } from './types';

let sequence = 0;
export const createId = (prefix: string): string => `${prefix}-${++sequence}`;

const NO_PRIMARY_KEY_TYPES = ['boolean', 'timestamp with time zone', 'jsonb'];
const NO_UNIQUE_TYPES = ['boolean', 'jsonb', 'timestamp with time zone'];
const NO_RELATION_TYPES = ['boolean', 'serial', 'jsonb', 'timestamp with time zone'];

export const canBePrimaryKey = (type: string | null): boolean => !NO_PRIMARY_KEY_TYPES.includes(type ?? '');
export const canBeUnique = (type: string | null): boolean => !NO_UNIQUE_TYPES.includes(type ?? '');
export const canHaveRelation = (type: string | null): boolean => !NO_RELATION_TYPES.includes(type ?? '');

export const createColumn = (overrides: Partial<DraftColumn> = {}): DraftColumn => ({
  id: createId('column'),
  column_name: '',
  data_type: null,
  column_default: null,
  constraints_type: { is_not_null: false, is_unique: false, is_primary_key: false },
  configurations: {},
  ...overrides,
});

/** A new table starts with an auto-incrementing `id` primary key. */
export const createDefaultColumns = (): DraftColumn[] => [
  createColumn({
    column_name: 'id',
    data_type: 'serial',
    // As the old form sent it: a primary key is unique without the extra constraint. The row still shows it ticked.
    constraints_type: { is_not_null: true, is_unique: false, is_primary_key: true },
  }),
];

/**
 * A new type resets what depended on the old one: the default (it may not parse as the new type), and not null and
 * unique. A primary key stays one when the new type allows it; serial is always not null.
 */
export const applyTypeChange = (column: DraftColumn, type: string): DraftColumn => {
  const keepsPrimaryKey = column.constraints_type.is_primary_key && canBePrimaryKey(type);
  // A timestamp column is shown in a time zone, the browser's until it is changed; other types have none.
  const { timezone, ...otherConfigurations } = column.configurations;
  return {
    ...column,
    data_type: type,
    column_default: null,
    configurations:
      type === 'timestamp with time zone'
        ? { ...otherConfigurations, timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone }
        : otherConfigurations,
    constraints_type: {
      is_primary_key: keepsPrimaryKey,
      is_not_null: keepsPrimaryKey || type === 'serial',
      is_unique: keepsPrimaryKey,
    },
  };
};

/** A primary key is always not null and unique. Clearing one leaves those as they were. */
export const applyPrimaryKey = (column: DraftColumn, checked: boolean): DraftColumn => ({
  ...column,
  constraints_type: checked
    ? { is_not_null: true, is_unique: true, is_primary_key: true }
    : { ...column.constraints_type, is_primary_key: false },
});

const primaryKeyCount = (columns: DraftColumn[]): number =>
  columns.filter((column) => column.constraints_type.is_primary_key).length;

/** The only primary key: it cannot be cleared, removed or moved, and stays first. */
export const isPinnedPrimaryKey = (column: DraftColumn, columns: DraftColumn[]): boolean =>
  column.constraints_type.is_primary_key && primaryKeyCount(columns) === 1;

/** Is the primary key checkbox fixed? True for the pinned key and for types that cannot be one. */
export const isPrimaryKeyLocked = (column: DraftColumn, columns: DraftColumn[]): boolean =>
  !canBePrimaryKey(column.data_type) || isPinnedPrimaryKey(column, columns);

// An empty default is left out rather than sent as null: the server sanitises a present null into '' and then rejects it
// as not matching the column type.
export const toColumnPayload = ({ id: _id, column_default: columnDefault, ...column }: DraftColumn): ColumnPayload =>
  columnDefault ? { ...column, column_default: columnDefault } : column;
