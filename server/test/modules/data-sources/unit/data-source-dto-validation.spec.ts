/// <reference types="jest" />
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDataSourceDto, UpdateDataSourceDto } from '@modules/data-sources/dto';

// '/' and '\' are filesystem path separators once the datasource is serialized to git
// (server/ee/git-sync/data-source-fs.util.ts): a name containing either splits into nested
// git folders and silently vanishes on the next pull.
/** @group platform */
describe('Datasource name path-separator restriction (DTO)', () => {
  const nameError = async (dto: object) => {
    const errors = await validate(dto);
    return errors.find((error) => error.property === 'name');
  };

  describe('CreateDataSourceDto', () => {
    it('should reject a name containing "/"', async () => {
      const dto = plainToInstance(CreateDataSourceDto, {
        name: 'local/snowflake',
        kind: 'snowflake',
        options: {},
      });
      expect((await nameError(dto))?.constraints).toHaveProperty('matches');
    });

    it('should reject a name containing "\\"', async () => {
      const dto = plainToInstance(CreateDataSourceDto, {
        name: 'local\\snowflake',
        kind: 'snowflake',
        options: {},
      });
      expect((await nameError(dto))?.constraints).toHaveProperty('matches');
    });

    it('should accept a separator-free name', async () => {
      const dto = plainToInstance(CreateDataSourceDto, {
        name: 'local-snowflake',
        kind: 'snowflake',
        options: {},
      });
      expect(await nameError(dto)).toBeUndefined();
    });
  });

  describe('UpdateDataSourceDto (rename)', () => {
    it('should reject a rename containing "/"', async () => {
      const dto = plainToInstance(UpdateDataSourceDto, { name: 'local/snowflake' });
      expect((await nameError(dto))?.constraints).toHaveProperty('matches');
    });

    it('should reject a rename containing "\\"', async () => {
      const dto = plainToInstance(UpdateDataSourceDto, { name: 'local\\snowflake' });
      expect((await nameError(dto))?.constraints).toHaveProperty('matches');
    });

    it('should accept a separator-free rename', async () => {
      const dto = plainToInstance(UpdateDataSourceDto, { name: 'local-snowflake' });
      expect(await nameError(dto)).toBeUndefined();
    });
  });
});
