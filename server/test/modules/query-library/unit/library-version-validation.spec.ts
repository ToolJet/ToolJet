import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  CreateLibraryDraftDto,
  SaveLibraryDraftDto,
  UpdateLibraryDraftDto,
} from '@modules/query-library/dto/lifecycle';
import { RunLibraryDraftDto } from '@modules/query-library/dto/execution';

/** @group platform */
describe('Library version validation', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  const valid = <T extends object>(type: new () => T, value: object) =>
    validateSync(plainToInstance(type, value), { whitelist: true, forbidNonWhitelisted: true }).length === 0;
  it.each(['release-A.1', 'Release_a', 'a'.repeat(25), 'é/ß+!'])('accepts the existing form name %s', (name) => {
    expect(valid(CreateLibraryDraftDto, { name, fromVersionId: id })).toBe(true);
    expect(valid(SaveLibraryDraftDto, { name, description: 'd'.repeat(500) })).toBe(true);
  });
  it.each(['', ' ', 'a b', 'a\tb', 'a'.repeat(26), ...'~^:?*[]\\@{'.split('').map((char) => `a${char}b`)])(
    'rejects invalid name %s',
    (name) => {
      expect(valid(CreateLibraryDraftDto, { name, fromVersionId: id })).toBe(false);
      expect(valid(SaveLibraryDraftDto, { name })).toBe(false);
      expect(valid(UpdateLibraryDraftDto, { name })).toBe(false);
    }
  );
  it('rejects long descriptions and null or untyped patches', () => {
    expect(valid(SaveLibraryDraftDto, { name: 'ok', description: 'd'.repeat(501) })).toBe(false);
    expect(valid(UpdateLibraryDraftDto, { description: 'd'.repeat(501) })).toBe(false);
    expect(valid(UpdateLibraryDraftDto, { name: null })).toBe(false);
    expect(valid(UpdateLibraryDraftDto, { options: [] })).toBe(false);
    expect(valid(UpdateLibraryDraftDto, { dataSourceId: id })).toBe(false);
  });
  it('requires exactly one explicit run target', () => {
    for (const value of [
      {},
      { draftId: '' },
      { draftId: 'draft' },
      { draftId: id, libraryVersionId: id },
      { draftId: null },
    ]) {
      expect(valid(RunLibraryDraftDto, value)).toBe(false);
    }
    expect(valid(RunLibraryDraftDto, { draftId: id })).toBe(true);
    expect(valid(RunLibraryDraftDto, { libraryVersionId: id })).toBe(true);
  });
});
