import { isReservedColumnName } from './reservedColumnNames';

// The server rejects a column name longer than 31 characters (a table name may have 32).
export const COLUMN_NAME_MAX_LENGTH = 31;

export const COLUMN_NAME_TAKEN_ERROR = 'A column with this name already exists';
export const COLUMN_NAME_EMPTY_ERROR = 'Column name cannot be empty';
export const COLUMN_NAME_RESERVED_ERROR = 'Column name cannot be a reserved keyword';

const VALID_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * What is wrong with the name, or null when it is empty (the field decides whether that is worth an error yet) or fine.
 * `existingNames` are the table's other columns; the match is exact, as stored column names are case sensitive.
 */
export const getColumnNameError = (name: string, existingNames: string[] = []): string | null => {
  if (!name) return null;
  if (name.length > COLUMN_NAME_MAX_LENGTH) return `Column name must be maximum ${COLUMN_NAME_MAX_LENGTH} characters`;
  if (/^[0-9]/.test(name)) return 'Column name cannot start with a number';
  if (!VALID_NAME.test(name)) return 'Column name can only contain letters, numbers and underscores';
  if (isReservedColumnName(name)) return COLUMN_NAME_RESERVED_ERROR;
  if (existingNames.includes(name)) return COLUMN_NAME_TAKEN_ERROR;

  return null;
};

export const isColumnNameValid = (name: string, existingNames: string[] = []): boolean =>
  name.length > 0 && getColumnNameError(name, existingNames) === null;
