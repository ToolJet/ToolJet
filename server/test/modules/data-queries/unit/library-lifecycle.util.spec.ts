/** @jest-environment node */
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import {
  assertCanCreateDraft,
  assertCanDiscardDraft,
  assertCanRelease,
  assertCanSaveDraft,
  assertDraftEditable,
  assertVersionDeletable,
  nextEnvironmentForPromote,
  toLibraryQueryVersionsView,
} from '../../../../src/modules/data-queries/library/library-lifecycle.util';

const state = (over: Record<string, unknown> = {}) =>
  ({
    dataQueryId: 'q1',
    hasDraft: true,
    draftCreatedFromVersionId: null,
    draftDescription: null,
    releasedVersionId: null,
    ...over,
  }) as any;

const snapshot = { kind: 'restapi', dataSourceId: 'ds1', options: { url: 'http://a' } };
const v1 = { id: 'ver1', versionNumber: 1, ...snapshot };

const development = { id: 'e1', name: 'development', priority: 1, isDefault: false };
const staging = { id: 'e2', name: 'staging', priority: 2, isDefault: false };
const production = { id: 'e3', name: 'production', priority: 3, isDefault: true };
const environments = [production, development, staging];

describe('library-lifecycle.util', () => {
  describe('assertCanSaveDraft', () => {
    it('should 409 when the query has no draft', () => {
      expect(() => assertCanSaveDraft(state({ hasDraft: false }), v1, snapshot)).toThrow(
        new ConflictException('This query has no draft to save')
      );
    });

    it('should 400 when the draft equals the latest version', () => {
      expect(() => assertCanSaveDraft(state(), v1, snapshot)).toThrow(
        new BadRequestException('Nothing changed since v1')
      );
    });

    it('should pass for a changed draft or a query with no versions', () => {
      expect(() => assertCanSaveDraft(state(), v1, { ...snapshot, options: { url: 'http://b' } })).not.toThrow();
      expect(() => assertCanSaveDraft(state(), null, snapshot)).not.toThrow();
    });
  });

  describe('assertCanCreateDraft', () => {
    it('should 409 while a draft is open', () => {
      expect(() => assertCanCreateDraft(state(), v1)).toThrow(
        new ConflictException('Save or delete the current draft first')
      );
    });

    it('should 404 a missing source version', () => {
      expect(() => assertCanCreateDraft(state({ hasDraft: false }), null)).toThrow(
        new NotFoundException('Library query version not found')
      );
    });

    it('should pass with no draft and a source version', () => {
      expect(() => assertCanCreateDraft(state({ hasDraft: false }), v1)).not.toThrow();
    });
  });

  describe('assertCanDiscardDraft', () => {
    it('should 409 when the query has no draft', () => {
      expect(() => assertCanDiscardDraft(state({ hasDraft: false }), 1)).toThrow(
        new ConflictException('This query has no draft')
      );
    });

    it('should 400 when no version was saved', () => {
      expect(() => assertCanDiscardDraft(state(), 0)).toThrow(
        new BadRequestException('Save a version before deleting the draft')
      );
    });

    it('should pass with a draft and a saved version', () => {
      expect(() => assertCanDiscardDraft(state(), 1)).not.toThrow();
    });
  });

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

  describe('assertDraftEditable', () => {
    it('should 400 when the query has no draft', () => {
      expect(() => assertDraftEditable(state({ hasDraft: false }))).toThrow(
        new BadRequestException('Create a draft version to edit this query')
      );
    });

    it('should pass with a draft', () => {
      expect(() => assertDraftEditable(state())).not.toThrow();
    });
  });

  describe('toLibraryQueryVersionsView', () => {
    const row = (n: number, over: Record<string, unknown> = {}) => ({
      id: `lv${n}`,
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
      const view = toLibraryQueryVersionsView(state(), [row(1), row(2), row(3, { deletedAt: new Date() })], []);
      expect(view.versions.map((v) => v.name)).toEqual(['v2', 'v1']);
      expect(view.nextVersionNumber).toBe(4);
    });

    it('should start at 1 with no versions', () => {
      expect(toLibraryQueryVersionsView(state(), [], []).nextVersionNumber).toBe(1);
    });

    it("should carry each version's data source", () => {
      const [version] = toLibraryQueryVersionsView(state(), [row(1)], []).versions;
      expect(version).toMatchObject({ kind: 'restapi', dataSourceId: 'ds1' });
    });
  });
});
