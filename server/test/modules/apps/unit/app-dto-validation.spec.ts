/// <reference types="jest" />
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppCreateDto, AppUpdateDto } from '@modules/apps/dto';

/** @group platform */
describe('App name length validation (DTO)', () => {
  const nameOfLength = (n: number): string => 'a'.repeat(n);

  // class-validator surfaces a `name` error only when the MaxLength(100) constraint fails.
  const nameError = async (dto: object) => {
    const errors = await validate(dto);
    return errors.find((error) => error.property === 'name');
  };

  describe('AppCreateDto', () => {
    it('should accept a name of 50 characters (regression for the previous limit)', async () => {
      const dto = plainToInstance(AppCreateDto, { name: nameOfLength(50), type: 'front-end' });
      expect(await nameError(dto)).toBeUndefined();
    });

    it('should accept a name of exactly 100 characters', async () => {
      const dto = plainToInstance(AppCreateDto, { name: nameOfLength(100), type: 'front-end' });
      expect(await nameError(dto)).toBeUndefined();
    });

    it('should reject a name of 101 characters', async () => {
      const dto = plainToInstance(AppCreateDto, { name: nameOfLength(101), type: 'front-end' });
      expect((await nameError(dto))?.constraints).toHaveProperty('maxLength');
    });
  });

  describe('AppUpdateDto', () => {
    it('should accept a name of exactly 100 characters', async () => {
      const dto = plainToInstance(AppUpdateDto, { name: nameOfLength(100) });
      expect(await nameError(dto)).toBeUndefined();
    });

    it('should reject a name of 101 characters', async () => {
      const dto = plainToInstance(AppUpdateDto, { name: nameOfLength(101) });
      expect((await nameError(dto))?.constraints).toHaveProperty('maxLength');
    });
  });
});

// '/' is a filesystem path separator once the app (or module — modules are Apps with
// type='module' and share this DTO) is serialized to git (server/ee/git-sync): a name
// containing it splits into nested git folders and silently vanishes on the next pull.
/** @group platform */
describe('App name "/" restriction (DTO)', () => {
  const nameError = async (dto: object) => {
    const errors = await validate(dto);
    return errors.find((error) => error.property === 'name');
  };

  describe('AppCreateDto', () => {
    it('should reject a name containing "/"', async () => {
      const dto = plainToInstance(AppCreateDto, { name: 'local/snowflake', type: 'front-end' });
      expect((await nameError(dto))?.constraints).toHaveProperty('matches');
    });

    it('should accept a slash-free name', async () => {
      const dto = plainToInstance(AppCreateDto, { name: 'local-snowflake', type: 'front-end' });
      expect(await nameError(dto)).toBeUndefined();
    });
  });

  describe('AppUpdateDto', () => {
    it('should reject a rename containing "/"', async () => {
      const dto = plainToInstance(AppUpdateDto, { name: 'abc/appname' });
      expect((await nameError(dto))?.constraints).toHaveProperty('matches');
    });

    it('should accept a slash-free rename', async () => {
      const dto = plainToInstance(AppUpdateDto, { name: 'abc-appname' });
      expect(await nameError(dto)).toBeUndefined();
    });
  });
});
