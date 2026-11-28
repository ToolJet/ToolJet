export const TABLE_NAME_MAX_LENGTH = 32;

export const TABLE_NAME_HINT =
  'Table name can contain letters, numbers and underscores and must be within 32 characters.';

export const NAME_TAKEN_ERROR = 'A table with this name already exists';
export const NAME_EMPTY_ERROR = 'Table name cannot be empty';

const VALID_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * What is wrong with the name, or null when it is empty (the field decides whether that is worth an error yet) or fine.
 * `existingNames` are the tables already in the workspace; the match is exact.
 */
export const getTableNameError = (name: string, existingNames: string[] = []): string | null => {
  if (!name) return null;
  if (name.length > TABLE_NAME_MAX_LENGTH) return `Table name must be maximum ${TABLE_NAME_MAX_LENGTH} characters`;
  if (/^[0-9]/.test(name)) return 'Table name cannot start with a number';
  if (!VALID_NAME.test(name)) return 'Table name can only contain letters, numbers and underscores';
  if (existingNames.includes(name)) return NAME_TAKEN_ERROR;
  return null;
};

export const isTableNameValid = (name: string, existingNames: string[] = []): boolean =>
  name.length > 0 && getTableNameError(name, existingNames) === null;
