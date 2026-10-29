import {
  scopeVersionsForQueryPicker,
  shouldOfferDefaultBranchDraft,
  DEFAULT_BRANCH_DRAFT_SENTINEL,
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
