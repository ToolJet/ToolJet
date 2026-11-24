import {
  scopeVersionsForQueryPicker,
  shouldOfferDefaultBranchDraft,
  DEFAULT_BRANCH_DRAFT_SENTINEL,
  versionUrlName,
} from '../versionLabels';

describe('scopeVersionsForQueryPicker', () => {
  it('drops an unsynced default-branch draft under git sync, keeping saved versions', () => {
    const versions = [
      { name: 'v1', version_type: 'version', status: 'DRAFT', is_synced: false },
      { name: 'v0', version_type: 'version', status: 'PUBLISHED', is_synced: false },
    ];

    expect(
      scopeVersionsForQueryPicker(versions, { activeBranchId: 'main-id', isGitSyncEnabled: true }).map((v) => v.name)
    ).toEqual(['v0']);
  });
});

describe('shouldOfferDefaultBranchDraft', () => {
  const branchOnly = [{ name: 'b-uuid', version_type: 'branch', status: 'DRAFT', branchId: 'feature-id' }];

  it('hides the main draft on a feature branch when the workflow has none, unless the query already pins it', () => {
    expect(shouldOfferDefaultBranchDraft(branchOnly, { isOnFeatureBranch: true, pinnedValue: null })).toBe(false);
    expect(
      shouldOfferDefaultBranchDraft(branchOnly, { isOnFeatureBranch: true, pinnedValue: DEFAULT_BRANCH_DRAFT_SENTINEL })
    ).toBe(true);
    expect(shouldOfferDefaultBranchDraft(branchOnly, { isOnFeatureBranch: false, pinnedValue: null })).toBe(true);
    expect(
      shouldOfferDefaultBranchDraft([...branchOnly, { name: 'd', version_type: 'version', status: 'DRAFT' }], {
        isOnFeatureBranch: true,
        pinnedValue: null,
      })
    ).toBe(true);
  });
});

describe('versionUrlName', () => {
  const generated = '16f005c9-3bd9-4b01-80e1-c0d9d0137542';

  it('uses the draft sentinel for a default-branch draft with a generated name', () => {
    expect(versionUrlName({ name: generated, status: 'DRAFT', versionType: 'version' })).toBe(
      DEFAULT_BRANCH_DRAFT_SENTINEL
    );
  });

  it('keeps the real name of a saved version', () => {
    expect(versionUrlName({ name: 'v2', status: 'PUBLISHED', versionType: 'version' })).toBe('v2');
  });

  it('keeps a draft name the user chose', () => {
    expect(versionUrlName({ name: 'my-draft', status: 'DRAFT', versionType: 'version' })).toBe('my-draft');
  });

  it('gives no version for a feature-branch draft (the branch is in ?branch=)', () => {
    expect(versionUrlName({ name: generated, status: 'DRAFT', versionType: 'branch' })).toBeNull();
  });

  it('reads the snake_case API casing too', () => {
    expect(versionUrlName({ name: generated, status: 'DRAFT', version_type: 'version' })).toBe(
      DEFAULT_BRANCH_DRAFT_SENTINEL
    );
  });

  it('returns null without a version', () => {
    expect(versionUrlName(undefined)).toBeNull();
  });
});
