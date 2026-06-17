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
