/// <reference types="jest" />
import { BadRequestException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import {
  isDuplicateConstantError,
  resolveCreateWrites,
  resolveUpdateWrites,
} from '@modules/organization-constants/helpers/constant-values';

const ENVS = ['env-dev', 'env-stg', 'env-prod'];

const uniqueViolation = (constraint: string) => {
  const driverError = Object.assign(new Error('duplicate key value'), { code: '23505', constraint });
  return new QueryFailedError('INSERT ...', [], driverError);
};

/** @group platform */
describe('constant-values helpers', () => {
  describe('resolveCreateWrites', () => {
    it('should write the single value to every environment when multi-environment is off', () => {
      const writes = resolveCreateWrites([{ environment_id: 'env-stg', value: 'v' }], ENVS, false);

      expect(writes).toEqual(ENVS.map((environmentId) => ({ environmentId, value: 'v' })));
    });

    it('should reject more than one entry when multi-environment is off', () => {
      expect(() =>
        resolveCreateWrites(
          [
            { environment_id: 'env-dev', value: 'a' },
            { environment_id: 'env-stg', value: 'b' },
          ],
          ENVS,
          false
        )
      ).toThrow(BadRequestException);
    });

    it('should write only the listed environments when multi-environment is on', () => {
      const writes = resolveCreateWrites(
        [
          { environment_id: 'env-prod', value: 'p' },
          { environment_id: 'env-dev', value: 'd' },
        ],
        ENVS,
        true
      );

      expect(writes).toEqual([
        { environmentId: 'env-prod', value: 'p' },
        { environmentId: 'env-dev', value: 'd' },
      ]);
    });

    it('should reject an environment outside the workspace in both modes', () => {
      const entries = [{ environment_id: 'env-foreign', value: 'v' }];

      expect(() => resolveCreateWrites(entries, ENVS, false)).toThrow(BadRequestException);
      expect(() => resolveCreateWrites(entries, ENVS, true)).toThrow(BadRequestException);
    });

    it('should reject duplicate environment ids', () => {
      const entries = [
        { environment_id: 'env-dev', value: 'a' },
        { environment_id: 'env-dev', value: 'b' },
      ];

      expect(() => resolveCreateWrites(entries, ENVS, true)).toThrow(BadRequestException);
    });

    it('should reject an empty entry list', () => {
      expect(() => resolveCreateWrites([], ENVS, true)).toThrow(BadRequestException);
    });
  });

  describe('resolveUpdateWrites', () => {
    it('should write the single value to every environment when multi-environment is off', () => {
      const writes = resolveUpdateWrites([{ environment_id: 'env-dev', value: 'v' }], ENVS, ['env-dev'], false);

      expect(writes).toEqual(ENVS.map((environmentId) => ({ environmentId, value: 'v' })));
    });

    it('should reject a null value when multi-environment is off', () => {
      expect(() => resolveUpdateWrites([{ environment_id: 'env-dev', value: null }], ENVS, ENVS, false)).toThrow(
        BadRequestException
      );
    });

    it('should reject more than one entry when multi-environment is off', () => {
      const entries = [
        { environment_id: 'env-dev', value: 'a' },
        { environment_id: 'env-stg', value: 'b' },
      ];

      expect(() => resolveUpdateWrites(entries, ENVS, ENVS, false)).toThrow(BadRequestException);
    });

    it('should set strings and store an empty string for null when multi-environment is on', () => {
      const writes = resolveUpdateWrites(
        [
          { environment_id: 'env-dev', value: 'new' },
          { environment_id: 'env-stg', value: null },
        ],
        ENVS,
        ['env-dev', 'env-stg'],
        true
      );

      expect(writes).toEqual([
        { environmentId: 'env-dev', value: 'new' },
        { environmentId: 'env-stg', value: '' },
      ]);
    });

    it('should allow clearing one environment while another keeps a value', () => {
      expect(() =>
        resolveUpdateWrites([{ environment_id: 'env-dev', value: null }], ENVS, ['env-dev', 'env-stg'], true)
      ).not.toThrow();
    });

    it('should reject clearing the last environment that has a value', () => {
      expect(() => resolveUpdateWrites([{ environment_id: 'env-dev', value: null }], ENVS, ['env-dev'], true)).toThrow(
        BadRequestException
      );
    });

    it('should reject clearing every environment in one request', () => {
      const entries = [
        { environment_id: 'env-dev', value: null },
        { environment_id: 'env-stg', value: null },
      ];

      expect(() => resolveUpdateWrites(entries, ENVS, ['env-dev', 'env-stg'], true)).toThrow(BadRequestException);
    });

    it('should allow clearing the old value when the same request sets another environment', () => {
      const writes = resolveUpdateWrites(
        [
          { environment_id: 'env-dev', value: null },
          { environment_id: 'env-prod', value: 'p' },
        ],
        ENVS,
        ['env-dev'],
        true
      );

      expect(writes).toEqual([
        { environmentId: 'env-dev', value: '' },
        { environmentId: 'env-prod', value: 'p' },
      ]);
    });

    it('should reject a foreign environment id and duplicate ids', () => {
      expect(() => resolveUpdateWrites([{ environment_id: 'env-foreign', value: 'v' }], ENVS, ENVS, true)).toThrow(
        BadRequestException
      );
      expect(() =>
        resolveUpdateWrites(
          [
            { environment_id: 'env-dev', value: 'a' },
            { environment_id: 'env-dev', value: null },
          ],
          ENVS,
          ENVS,
          true
        )
      ).toThrow(BadRequestException);
    });
  });

  describe('isDuplicateConstantError', () => {
    it('should match the unique violation on name and type', () => {
      expect(isDuplicateConstantError(uniqueViolation('UQ_organization_constant_name_type'))).toBe(true);
    });

    it('should not match another constraint or another error', () => {
      expect(isDuplicateConstantError(uniqueViolation('UQ_something_else'))).toBe(false);
      expect(isDuplicateConstantError(new Error('boom'))).toBe(false);
      expect(isDuplicateConstantError(undefined)).toBe(false);
    });
  });
});
