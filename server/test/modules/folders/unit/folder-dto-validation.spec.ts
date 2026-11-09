/// <reference types="jest" />
/**
 * Folder name character validation (DTO). Folder names become git path segments
 * (apps/<folder>/<app>, data-sources/<folder>/<ds>), so slash '/' and backslash '\' — and other
 * special characters — must be rejected on BOTH create and rename. Regression guard for the gap
 * where UpdateFolderDto only ran sanitizeInput (HTML-escape) and let a '/' through on rename.
 *
 * @group platform
 */
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFolderDto, UpdateFolderDto } from '@modules/folders/dto';

describe('Folder name character validation (DTO)', () => {
  const nameError = async (dto: object) => {
    const errors = await validate(dto);
    return errors.find((error) => error.property === 'name');
  };

  describe.each([
    ['CreateFolderDto', (name: string) => plainToInstance(CreateFolderDto, { name, type: 'data_source' })],
    ['UpdateFolderDto', (name: string) => plainToInstance(UpdateFolderDto, { name })],
  ])('%s', (_label, make) => {
    it('accepts a plain alphanumeric name (with spaces and hyphens)', async () => {
      expect(await nameError(make('Payments 2 - prod'))).toBeUndefined();
    });

    it('rejects a name containing a forward slash (path-separator injection)', async () => {
      expect((await nameError(make('foo/bar')))?.constraints).toBeDefined();
    });

    it('rejects a name containing a backslash', async () => {
      expect((await nameError(make('foo\\bar')))?.constraints).toBeDefined();
    });

    it('rejects other special characters', async () => {
      expect((await nameError(make('foo@bar')))?.constraints).toBeDefined();
    });
  });
});
