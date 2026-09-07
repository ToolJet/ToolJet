/** @group gitsync */
import { BranchingBusinessUtil } from '@ee/app-git/shared/branching-business.util';
import { AppVersion, AppVersionType } from '@entities/app_version.entity';

// The three helpers under test are pure (no `this` deps), so construct the class
// with no injected services.
const util = new (BranchingBusinessUtil as any)() as BranchingBusinessUtil;

const version = (v: Partial<AppVersion>): AppVersion => v as AppVersion;

describe('BranchingBusinessUtil (pure helpers)', () => {
  describe('normalizeGitTag', () => {
    it('trims, lowercases, and collapses non-alphanumeric runs to single hyphens', () => {
      expect(util.normalizeGitTag('  My Feature__Branch!!  ')).toBe('my-feature-branch-');
      expect(util.normalizeGitTag('v1.2.3')).toBe('v1-2-3');
      expect(util.normalizeGitTag('already-safe')).toBe('already-safe');
    });
  });

  describe('buildTagName', () => {
    it('joins co_relation_id and version name with a slash', () => {
      expect(util.buildTagName('11111111-2222-3333-4444-555555555555', 'v2')).toBe(
        '11111111-2222-3333-4444-555555555555/v2'
      );
    });
  });

  describe('computeTargetBranch', () => {
    const push = (gitVersionName?: string): any => ({ gitVersionName });

    it('prefers pushBody.gitVersionName', () => {
      expect(util.computeTargetBranch(false, version({ name: 'x' }), false, 'main', push('feat-a'))).toBe('feat-a');
    });
    it('falls back to version.name when gitVersionName is absent', () => {
      expect(util.computeTargetBranch(false, version({ name: 'feat-b' }), false, 'main', push(undefined))).toBe(
        'feat-b'
      );
    });
    it('falls back to the default branch when neither is present', () => {
      expect(util.computeTargetBranch(false, version({}), false, 'main', push(undefined))).toBe('main');
    });
    it('forces the default branch for a VERSION-type row when branching + allowMasterPush', () => {
      expect(
        util.computeTargetBranch(true, version({ versionType: AppVersionType.VERSION }), true, 'main', push('feat-c'))
      ).toBe('main');
    });
    it('does NOT force the default branch when allowMasterPush is false', () => {
      expect(
        util.computeTargetBranch(true, version({ versionType: AppVersionType.VERSION }), false, 'main', push('feat-c'))
      ).toBe('feat-c');
    });
    it('does NOT force the default branch when branching is disabled', () => {
      expect(
        util.computeTargetBranch(false, version({ versionType: AppVersionType.VERSION }), true, 'main', push('feat-c'))
      ).toBe('feat-c');
    });
    it('forces the default branch when the version already sits on the default branch (name === default)', () => {
      expect(util.computeTargetBranch(true, version({ name: 'main' }), true, 'main', push('feat-d'))).toBe('main');
    });
  });
});
