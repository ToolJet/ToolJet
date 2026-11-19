/** @jest-environment node */
import {
  COLUMN_NAME_MAX_LENGTH,
  COLUMN_NAME_TAKEN_ERROR,
  getColumnNameError,
  isColumnNameValid,
} from '../columnNameRules';

describe('columnNameRules', () => {
  it('has no error and is not valid while empty (the field decides when that is worth an error)', () => {
    expect(getColumnNameError('')).toBeNull();
    expect(isColumnNameValid('')).toBe(false);
  });

  it.each(['title', '_title', 'Title_2', 'a'])('accepts %s', (name) => {
    expect(getColumnNameError(name)).toBeNull();
    expect(isColumnNameValid(name)).toBe(true);
  });

  it('accepts 31 characters and rejects 32, the limit the server enforces on column names', () => {
    expect(COLUMN_NAME_MAX_LENGTH).toBe(31);
    expect(isColumnNameValid('a'.repeat(31))).toBe(true);
    expect(getColumnNameError('a'.repeat(32))).toBe('Column name must be maximum 31 characters');
    expect(isColumnNameValid('a'.repeat(32))).toBe(false);
  });

  it('rejects a leading digit with its own message', () => {
    expect(getColumnNameError('1title')).toBe('Column name cannot start with a number');
  });

  it.each(['my column', 'my-column', 'cölumn', 'title!'])('rejects the character in %s', (name) => {
    expect(getColumnNameError(name)).toBe('Column name can only contain letters, numbers and underscores');
    expect(isColumnNameValid(name)).toBe(false);
  });

  describe('a name another column already has', () => {
    const existing = ['id', 'Title'];

    it('is an error, and not valid', () => {
      expect(getColumnNameError('id', existing)).toBe(COLUMN_NAME_TAKEN_ERROR);
      expect(isColumnNameValid('id', existing)).toBe(false);
    });

    it('matches the exact name only, as stored identifiers are case sensitive', () => {
      expect(getColumnNameError('title', existing)).toBeNull();
      expect(getColumnNameError('Title', existing)).toBe(COLUMN_NAME_TAKEN_ERROR);
    });

    it('reports a malformed name before a taken one', () => {
      expect(getColumnNameError('id!', ['id!'])).toBe('Column name can only contain letters, numbers and underscores');
    });
  });
});
