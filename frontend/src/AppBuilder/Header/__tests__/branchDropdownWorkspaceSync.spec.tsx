import React from 'react';
import { render, act } from '@testing-library/react';
import { BranchDropdown } from '../BranchDropdown';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

const mockAppState: Record<string, unknown> = {};
jest.mock('@/AppBuilder/_stores/store', () => ({
  __esModule: true,
  default: (selector: (s: unknown) => unknown) => selector(mockAppState),
}));
jest.mock('@/_styles/branch-dropdown.scss', () => ({}), { virtual: true });
jest.mock('../CreateBranchModal', () => ({ CreateBranchModal: () => null }));
jest.mock('../SwitchBranchModal', () => ({ SwitchBranchModal: () => null }));
jest.mock('../VersionManager', () => ({ CreateVersionModal: () => null }));
jest.mock('react-tooltip', () => ({ Tooltip: () => null }));
jest.mock('@/_ui/Icon/SolidIcons', () => ({ __esModule: true, default: () => null }));
jest.mock('@/_components/OverflowTooltip', () => ({ __esModule: true, default: () => null }));
jest.mock('@/_services', () => ({ authenticationService: {}, gitSyncService: {} }));
jest.mock('@/_helpers/routes', () => ({ getSubpath: () => '' }));

const BRANCH_A = { id: 'branch-a', name: 'devtest-a' };
const BRANCH_B = { id: 'branch-b', name: 'devtest-b' };
const branchVersion = { id: 'v-a', name: 'uuid-a', versionType: 'branch', branchId: BRANCH_A.id };

// The header chip follows the workspace branches store. A workflow opened without ?branch= loads
// the server's remembered branch (A) while the store seeds itself from the tab's last branch (B).
describe('BranchDropdown syncs the workspace branch to the open version', () => {
  const switchBranch = jest.fn();

  beforeEach(() => {
    switchBranch.mockClear();
    Object.assign(mockAppState, {
      currentBranch: null,
      allBranches: [],
      pullRequests: [],
      branchingEnabled: true,
      fetchBranches: jest.fn().mockResolvedValue(undefined),
      fetchPullRequests: jest.fn(),
      fetchDevelopmentVersions: jest.fn(),
      switchBranch: jest.fn(),
      switchToDefaultBranch: jest.fn(),
      setCurrentBranch: jest.fn(),
      createBranch: jest.fn(),
      orgGit: null,
      selectedVersion: branchVersion,
      developmentVersions: [branchVersion],
      isGitSyncConfigured: true,
    });
    useWorkspaceBranchesStore.setState({
      isInitialized: false,
      currentBranch: null,
      branches: [],
      actions: {
        ...useWorkspaceBranchesStore.getState().actions,
        initialize: jest.fn(),
        switchBranch,
      },
    });
  });

  it('waits for the workspace store to initialize before syncing', () => {
    render(<BranchDropdown appId="wf-1" organizationId="org-1" />);

    expect(switchBranch).not.toHaveBeenCalled();
  });

  it("then moves the workspace branch to the version's branch", () => {
    render(<BranchDropdown appId="wf-1" organizationId="org-1" />);

    act(() => {
      useWorkspaceBranchesStore.setState({
        isInitialized: true,
        currentBranch: BRANCH_B,
        branches: [BRANCH_A, BRANCH_B],
      });
    });

    expect(switchBranch).toHaveBeenCalledWith(BRANCH_A.id);
  });
});
