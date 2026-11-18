/** @jest-environment node */
import { getTableNameError, isTableNameValid, NAME_TAKEN_ERROR, TABLE_NAME_HINT } from '../tableNameRules';

describe('tableNameRules', () => {
  it('has no error and is not valid while empty (the hint shows instead)', () => {
    expect(getTableNameError('')).toBeNull();
    expect(isTableNameValid('')).toBe(false);
  });

  it.each(['users', '_users', 'User_2', 'a'])('accepts %s', (name) => {
    expect(getTableNameError(name)).toBeNull();
    expect(isTableNameValid(name)).toBe(true);
  });

  it('accepts 32 characters and rejects 33', () => {
    expect(isTableNameValid('a'.repeat(32))).toBe(true);
    expect(getTableNameError('a'.repeat(33))).toBe('Table name must be maximum 32 characters');
    expect(isTableNameValid('a'.repeat(33))).toBe(false);
  });

  it('rejects a leading digit with its own message', () => {
    expect(getTableNameError('1users')).toBe('Table name cannot start with a number');
    expect(isTableNameValid('1users')).toBe(false);
  });

  it.each(['my table', 'my-table', 'tâble', 'users!'])('rejects the character in %s', (name) => {
    expect(getTableNameError(name)).toBe('Table name can only contain letters, numbers and underscores');
    expect(isTableNameValid(name)).toBe(false);
  });

  describe('a name that is already taken', () => {
    const existing = ['users', 'Orders'];

    it('is an error, and not valid', () => {
      expect(getTableNameError('users', existing)).toBe(NAME_TAKEN_ERROR);
      expect(isTableNameValid('users', existing)).toBe(false);
    });

    it('matches the exact name only', () => {
      expect(getTableNameError('orders', existing)).toBeNull();
      expect(isTableNameValid('orders', existing)).toBe(true);
    });

    it('reports a format problem before a taken name', () => {
      expect(getTableNameError('1users', ['1users'])).toBe('Table name cannot start with a number');
    });
  });

  it('exposes the helper text shown under the field', () => {
    expect(TABLE_NAME_HINT).toBe(
      'Table name can contain letters, numbers and underscores and must be within 32 characters.'
    );
  });
});
