/** @jest-environment node */
import { canSaveRelation, isCompatibleTarget, RELATION_ACTIONS, type RelationForm } from '../relationRules';

const form = (overrides: Partial<RelationForm> = {}): RelationForm => ({
  sourceColumn: 'owner',
  sourceType: 'integer',
  targetTable: { name: 'users', id: 'users-id' },
  targetColumn: 'id',
  onUpdate: 'RESTRICT',
  onDelete: 'RESTRICT',
  ...overrides,
});

describe('relationRules', () => {
  describe('isCompatibleTarget', () => {
    it('an integer column can reference integer or serial', () => {
      expect(isCompatibleTarget('integer', 'integer')).toBe(true);
      expect(isCompatibleTarget('integer', 'serial')).toBe(true);
      expect(isCompatibleTarget('integer', 'bigint')).toBe(false);
    });

    it('a bigint column can reference integer or bigint', () => {
      expect(isCompatibleTarget('bigint', 'integer')).toBe(true);
      expect(isCompatibleTarget('bigint', 'bigint')).toBe(true);
      expect(isCompatibleTarget('bigint', 'serial')).toBe(false);
    });

    it('every other type needs the same type', () => {
      expect(isCompatibleTarget('character varying', 'character varying')).toBe(true);
      expect(isCompatibleTarget('character varying', 'integer')).toBe(false);
      expect(isCompatibleTarget('double precision', 'double precision')).toBe(true);
    });
  });

  describe('canSaveRelation', () => {
    it('is true with source, target table, target column and both actions', () => {
      expect(canSaveRelation(form())).toBe(true);
    });

    it.each([
      ['source column', { sourceColumn: '' }],
      ['target table', { targetTable: null }],
      ['target column', { targetColumn: '' }],
      ['on update', { onUpdate: '' }],
      ['on delete', { onDelete: '' }],
    ])('is false without a %s', (_label, overrides) => {
      expect(canSaveRelation(form(overrides))).toBe(false);
    });
  });

  it('offers the four actions, RESTRICT first (the default)', () => {
    expect(RELATION_ACTIONS).toEqual(['RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']);
  });
});
