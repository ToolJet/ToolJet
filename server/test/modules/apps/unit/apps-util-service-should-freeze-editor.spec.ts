/**
 * Phase 5 Step 5.8a (workflow-git-sync): branching-based editor freeze now applies to workflows.
 *
 * The EE getVersion path used to compute `appParam.type !== 'workflow' && shouldFreezeEditor(...)`,
 * so a synced workflow on a locked default branch came back editable. That guard is gone.
 *
 * WHAT THIS COVERS — the decision function's contract, per version shape.
 * WHAT IT DOES NOT — the caller-side removal in `ee/versions/service.ts`. `shouldFreezeEditor` takes
 * no app type (deliberately: it is type-agnostic by construction), so no direct test of it can
 * exercise that change; and driving EE `getVersion` needs ~7 unrelated deps mocked (environments,
 * themes, metadata overlay) before the freeze block is reached. The behavioural proof for 5.8a is
 * GATE 5's manual pass. What is pinned here is the contract 5.8a relies on and 5.8c is built on.
 *
 * The BRANCH case is the load-bearing one: Step 5.8c's banner omits a `versionType === 'version'`
 * check on the grounds that no freeze cause can fire on a BRANCH row. If that ever becomes false,
 * a user on a feature branch is told "<default branch> is locked. Create a branch to make edits."
 * The DB constraint that used to enforce branched-implies-draft was dropped, so this test is the
 * remaining guard.
 *
 * @group platform
 */
import { AppsUtilService } from '@modules/apps/util.service';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';

type FreezeFn = (editingVersion: Partial<AppVersion>, orgGit: unknown) => boolean;

const shouldFreezeEditor = (
  AppsUtilService.prototype as unknown as { shouldFreezeEditor: FreezeFn }
).shouldFreezeEditor.bind(AppsUtilService.prototype);

const version = (over: Partial<AppVersion>): Partial<AppVersion> => ({
  versionType: AppVersionType.VERSION,
  status: AppVersionStatus.DRAFT,
  isSynced: true,
  ...over,
});

const BRANCHING_ON = { isBranchingEnabled: true };
const BRANCHING_OFF = { isBranchingEnabled: false };

describe('AppsUtilService | shouldFreezeEditor', () => {
  describe('default-branch VERSION rows — the case Step 5.8a turns on for workflows', () => {
    it('should freeze a synced draft when branching is enabled', () => {
      expect(shouldFreezeEditor(version({}), BRANCHING_ON)).toBe(true);
    });

    it('should leave a never-pushed draft editable, even with branching enabled', () => {
      // Deliberate carve-out: pre-git resources stay editable until their first push marks them
      // synced. Most likely behaviour to be lost in a later "simplification".
      expect(shouldFreezeEditor(version({ isSynced: false }), BRANCHING_ON)).toBe(false);
    });

    it('should leave a synced draft editable when branching is disabled (single-branch)', () => {
      expect(shouldFreezeEditor(version({}), BRANCHING_OFF)).toBe(false);
    });

    it('should freeze a published version regardless of git config', () => {
      expect(shouldFreezeEditor(version({ status: AppVersionStatus.PUBLISHED }), null)).toBe(true);
    });
  });

  describe('BRANCH rows — the invariant Step 5.8c depends on', () => {
    it('should NOT freeze a feature-branch draft when branching is enabled', () => {
      expect(shouldFreezeEditor(version({ versionType: AppVersionType.BRANCH }), BRANCHING_ON)).toBe(false);
    });

    it('should NOT freeze a feature-branch draft that is already synced', () => {
      expect(shouldFreezeEditor(version({ versionType: AppVersionType.BRANCH, isSynced: true }), BRANCHING_ON)).toBe(
        false
      );
    });
  });

  describe('no git config', () => {
    it('should not freeze when orgGit is absent', () => {
      expect(shouldFreezeEditor(version({}), null)).toBe(false);
      expect(shouldFreezeEditor(version({}), undefined)).toBe(false);
    });
  });
});
