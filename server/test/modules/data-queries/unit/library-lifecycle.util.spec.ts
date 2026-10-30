/** @jest-environment node */
import { toLibraryVersionsResponse } from '@modules/query-library/dto/lifecycle';
import { BadRequestException } from '@nestjs/common';
import {
  assertCanRelease,
  assertVersionDeletable,
  nextEnvironmentForPromote,
  toLibraryQueryVersionsView,
} from '../../../../src/modules/data-queries/library/library-lifecycle.util';

const state = (over: Record<string, unknown> = {}) => ({
  releasedVersionId: null,
  ...over,
});

const snapshot = { kind: 'restapi', dataSourceId: 'ds1', options: { url: 'http://a' } };
const v1 = { id: 'ver1', versionNumber: 1, ...snapshot };

const development = { id: 'e1', name: 'development', priority: 1, isDefault: false };
const staging = { id: 'e2', name: 'staging', priority: 2, isDefault: false };
const production = { id: 'e3', name: 'production', priority: 3, isDefault: true };
const environments = [production, development, staging];

describe('library-lifecycle.util', () => {
  describe('nextEnvironmentForPromote', () => {
    it('should move development to staging', () => {
      expect(nextEnvironmentForPromote(development, environments)).toBe(staging);
    });

    it('should move staging to production', () => {
      expect(nextEnvironmentForPromote(staging, environments)).toBe(production);
    });

    it('should 400 a version already in production', () => {
      expect(() => nextEnvironmentForPromote(production, environments)).toThrow(
        new BadRequestException('This version is already in production')
      );
    });
  });

  describe('assertCanRelease', () => {
    it('should 400 a version outside production with the multi-environment licence', () => {
      expect(() => assertCanRelease(development, true)).toThrow(
        new BadRequestException('You can only release a version that is in production')
      );
    });

    it('should pass in production with the licence, or anywhere without it', () => {
      expect(() => assertCanRelease(production, true)).not.toThrow();
      expect(() => assertCanRelease(development, false)).not.toThrow();
    });
  });

  describe('assertVersionDeletable', () => {
    it('should 400 the released version', () => {
      expect(() => assertVersionDeletable(v1, state({ releasedVersionId: 'ver1' }))).toThrow(
        new BadRequestException("The released version can't be deleted")
      );
    });

    it('should pass any other version', () => {
      expect(() => assertVersionDeletable(v1, state({ releasedVersionId: 'ver2' }))).not.toThrow();
    });
  });

  describe('toLibraryQueryVersionsView', () => {
    const row = (n: number, over: Record<string, unknown> = {}) => ({
      id: `lv${n}`,
      name: `release-${n}`,
      versionNumber: n,
      description: null,
      createdFromVersionId: null,
      currentEnvironmentId: null,
      createdAt: new Date('2026-10-01'),
      kind: 'restapi',
      dataSourceId: `ds${n}`,
      options: {},
      deletedAt: null,
      ...over,
    });

    it('should count a deleted newest version in nextVersionNumber and leave it out of the list', () => {
      const view = toLibraryQueryVersionsView(state(), [row(1), row(2), row(3, { deletedAt: new Date() })], [], []);
      expect(view.versions.map((v) => v.name)).toEqual(['release-2', 'release-1']);
      expect(view.nextVersionNumber).toBe(4);
    });

    it('preserves nullable saved parent IDs through the strict response mapper', () => {
      const view = toLibraryQueryVersionsView(state(), [row(1), row(2, { createdFromVersionId: 'lv1' })], [], []);
      const response = toLibraryVersionsResponse(view);
      expect(response.versions).toMatchObject([
        { id: 'lv2', createdFromVersionId: 'lv1', createdFrom: 'release-1' },
        { id: 'lv1', createdFromVersionId: null, createdFrom: null },
      ]);
    });

    it('should start at 1 with no versions', () => {
      expect(toLibraryQueryVersionsView(state(), [], [], []).nextVersionNumber).toBe(1);
    });

    it("should carry each version's data source", () => {
      const [version] = toLibraryQueryVersionsView(state(), [row(1)], [], []).versions;
      expect(version).toMatchObject({ kind: 'restapi', dataSourceId: 'ds1' });
    });
  });
});
