import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import AlertDialog from '@/_ui/AlertDialog';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import useStore from '@/AppBuilder/_stores/store';
import { toast } from 'react-hot-toast';
import { CreateBranchModal } from './CreateBranchModal';
import { workspaceBranchesService } from '@/_services/workspace_branches.service';
import { setActiveBranch } from '@/_helpers/active-branch';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import '@/_styles/switch-branch-modal.scss';
import { DeleteBranchConfirmModal } from '@/_ui/WorkspaceBranchDropdown/DeleteBranchConfirmModal';
import { PullConflictModal } from '@/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal';
import { Tooltip } from 'react-tooltip';
import TablerIcon from '@/_ui/Icon/TablerIcon';

export function SwitchBranchModal({ show, onClose, appId, organizationId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    allBranches,
    selectedVersion,
    appName,
    currentBranch,
    fetchBranches,
    switchBranch,
    switchToDefaultBranch,
    setCurrentBranch,
    orgGit,
    lazyLoadAppVersions,
    fetchDevelopmentVersions,
    appVersions,
    branchingEnabled,
  } = useStore((state) => ({
    allBranches: state.allBranches,
    selectedVersion: state.selectedVersion,
    appName: state.appStore?.modules?.canvas?.app?.appName,
    currentBranch: state.currentBranch,
    fetchBranches: state.fetchBranches,
    switchBranch: state.switchBranch,
    switchToDefaultBranch: state.switchToDefaultBranch,
    setCurrentBranch: state.setCurrentBranch,
    orgGit: state.orgGit,
    lazyLoadAppVersions: state.lazyLoadAppVersions,
    fetchDevelopmentVersions: state.fetchDevelopmentVersions,
    appVersions: state.appVersions,
    branchingEnabled: state.branchingEnabled,
  }));

  const defaultBranchName = orgGit?.git_https?.github_branch || orgGit?.git_ssh?.github_branch || 'main';
  const {
    workspaceActiveBranch,
    wsBranches,
    wsActions,
    wsRemoteBranches,
    wsHasMoreRemote,
    wsVisibleCount,
    wsActiveBranchId,
  } = useWorkspaceBranchesStore((state) => ({
    workspaceActiveBranch: state.currentBranch,
    wsBranches: state.branches,
    wsActions: state.actions,
    wsRemoteBranches: state.remoteBranches,
    wsHasMoreRemote: state.hasMoreRemote,
    wsVisibleCount: state.visibleCount,
    wsActiveBranchId: state.activeBranchId,
  }));

  // Determine current branch name:
  // For platform git sync: use workspace active branch name
  // For per-app branching: use selectedVersion.name for branches, or default branch name for versions
  const currentBranchName = workspaceActiveBranch?.name
    ? workspaceActiveBranch.name
    : selectedVersion?.versionType === 'branch' || selectedVersion?.version_type === 'branch'
    ? selectedVersion?.name
    : currentBranch?.name || defaultBranchName;

  useEffect(() => {
    if (show && appId && organizationId) {
      setIsLoading(true);
      if (branchingEnabled) {
        wsActions.resetRemoteBranches();
        Promise.all([wsActions.fetchBranches(), wsActions.fetchRemoteBranches().catch(() => {})]).finally(() =>
          setIsLoading(false)
        );
      } else {
        // Per-app branching: fetch from remote git
        Promise.all([
          fetchBranches(appId, organizationId),
          lazyLoadAppVersions(appId),
          fetchDevelopmentVersions(appId),
        ]).finally(() => setIsLoading(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, appId, organizationId, branchingEnabled]);

  // Stable sort function — only recreated when active branch changes.
  const branchSorter = useCallback(
    (a, b) => {
      const aIsDefault = a.is_default || a.isDefault;
      const bIsDefault = b.is_default || b.isDefault;
      const aIsActive = a.id === wsActiveBranchId;
      const bIsActive = b.id === wsActiveBranchId;
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      const aDate = a.lastCommitAt ? new Date(a.lastCommitAt).getTime() : 0;
      const bDate = b.lastCommitAt ? new Date(b.lastCommitAt).getTime() : 0;
      if (bDate !== aDate) return bDate - aDate;
      const aCreated = a.createdAt || a.created_at;
      const bCreated = b.createdAt || b.created_at;
      return (bCreated ? new Date(bCreated).getTime() : 0) - (aCreated ? new Date(aCreated).getTime() : 0);
    },
    [wsActiveBranchId]
  );

  // Fuse instance over all DB branches — rebuilt only when wsBranches changes
  const fuse = useMemo(
    () =>
      new Fuse(wsBranches || [], {
        keys: ['name'],
        threshold: 0.4,
        includeScore: true,
        ignoreLocation: true,
      }),
    [wsBranches]
  );

  // Platform git sync: full list is in store — sort, then slice to visibleCount
  const wsDisplayBranches = useMemo(() => {
    if (!branchingEnabled) return [];
    if (searchTerm) {
      return fuse
        .search(searchTerm)
        .map((r) => r.item)
        .sort(branchSorter);
    }
    return [...(wsRemoteBranches || [])].sort(branchSorter).slice(0, wsVisibleCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchingEnabled, searchTerm, fuse, wsRemoteBranches, wsVisibleCount, branchSorter]);

  // Per-app branching: simple filter + search (unchanged)
  const perAppFilteredBranches = useMemo(() => {
    if (branchingEnabled) return [];
    return (allBranches || []).filter((branch) => {
      if (!branch.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      const isVersionName = appVersions?.some(
        (v) => v.name === branch.name && (v.versionType === 'version' || v.version_type === 'version')
      );
      return !isVersionName;
    });
  }, [branchingEnabled, allBranches, searchTerm, appVersions]);

  const displayBranches = branchingEnabled ? wsDisplayBranches : perAppFilteredBranches;

  const [switchingBranchName, setSwitchingBranchName] = useState(null);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [pullConflictGroups, setPullConflictGroups] = useState(null);

  const handleBranchClick = async (branch) => {
    if (branch.name === currentBranchName) {
      onClose();
      return;
    }

    setSwitchingBranchName(branch.name);
    try {
      // Platform git sync: verify branch exists on remote before switching
      if (branchingEnabled) {
        const existsOnRemote = await wsActions.checkBranchExistsOnRemote(branch.name);
        if (!existsOnRemote) {
          toast.error(
            'Branch does not exist in git. Delete this branch and create a new one to continue to make changes.'
          );
          setSwitchingBranchName(null);
          return;
        }
      }

      // Platform git sync: use workspace-level switching (navigates to resolved app)
      const wsBranches = useWorkspaceBranchesStore.getState().branches;
      if (wsBranches?.length > 0) {
        const targetWsBranch = wsBranches.find((b) => b.name === branch.name);
        if (targetWsBranch) {
          // Seeded branches (no createdBy, non-default) were created at git sync config time without
          // workspace data. Pull FIRST before switching — if pull fails the user stays on the modal
          // on their current branch rather than landing on an empty workspace.
          const isSeededBranch = !targetWsBranch.createdBy && !targetWsBranch.isDefault;
          if (isSeededBranch) {
            try {
              await wsActions.pullWorkspace(branch.name, targetWsBranch.id);
            } catch (pullError) {
              if (pullError?.statusCode === 409) {
                try {
                  const parsed = JSON.parse(pullError?.data?.message || pullError?.error || '{}');
                  if (parsed?.conflictGroups?.length) {
                    setSwitchingBranchName(null);
                    setPullConflictGroups(parsed.conflictGroups);
                    return;
                  }
                } catch {
                  /* fall through to generic toast */
                }
              }
              toast.error(pullError?.error || pullError?.message || 'Pull failed');
              setSwitchingBranchName(null);
              return;
            }
          }

          // Pull succeeded (or not a seeded branch) — now switch
          const result = await workspaceBranchesService.switchBranch(targetWsBranch.id, appId);
          const resolvedAppId = result?.resolvedAppId || result?.resolved_app_id;
          const resolvedSlug = result?.slug;
          // Persist branch to localStorage + update store
          const branchObj = targetWsBranch;
          setActiveBranch(branchObj);
          useWorkspaceBranchesStore.setState({
            activeBranchId: targetWsBranch.id,
            currentBranch: branchObj,
          });

          // Don't close modal — let the dimmed/spinner state persist until page navigates
          const pathParts = window.location.pathname.split('/');
          if (resolvedAppId) {
            // Navigate to the corresponding app on the target branch using slug for clean URL.
            // Use location.replace so the previous branch's URL doesn't stay in the back stack
            // (clicking Back would navigate to a slug that doesn't exist on the new branch).
            toast.success(`Switched to ${branch.name}`);
            window.location.replace(`/${pathParts[1]}/apps/${resolvedSlug || resolvedAppId}`);
          } else {
            // App doesn't exist on target branch — go to dashboard
            sessionStorage.setItem('git_sync_toast', `${appName || 'This app'} does not exist on this branch`);
            window.location.replace(`/${pathParts[1]}`);
          }
          return;
        }
      }

      // Fallback: per-app branch switching (changes version in-place)
      const isDefaultBranch = branch.name === defaultBranchName;
      if (isDefaultBranch) {
        const result = await switchToDefaultBranch(appId, branch.name);
        if (result.success) {
          setCurrentBranch(branch);
          if (result.isDraft) {
            toast.success(`Switched to ${branch.name} - Working on draft version`);
          }
          onClose();
        }
      } else {
        await switchBranch(appId, branch.name);
        setCurrentBranch(branch);
        onClose();
      }
    } catch (error) {
      console.error('Error switching branch:', error);
      const errorMessage = error?.error || error?.message || 'Failed to switch branch';
      toast.error(errorMessage);
      setSwitchingBranchName(null);
    }
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleViewInGitRepo = () => {
    // Get repository URL from orgGit (check https_url, ssh_url, or repository fields)
    const repoUrl =
      orgGit?.git_https?.https_url ||
      orgGit?.git_https?.repository ||
      orgGit?.git_ssh?.ssh_url ||
      orgGit?.git_ssh?.repository;

    if (!repoUrl) {
      console.error('No repository URL found in orgGit:', orgGit);
      toast.error('Git repository URL not available');
      return;
    }

    // Extract owner and repo name from URL and construct web URL
    // Handles: https://github.com/owner/repo.git, git@github.com:owner/repo.git, etc.
    const githubMatch = repoUrl.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
    const gitlabMatch = repoUrl.match(/gitlab\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
    const bitbucketMatch = repoUrl.match(/bitbucket\.org[:/]([^/]+)\/(.+?)(\.git)?$/);

    let webUrl = null;
    if (githubMatch) {
      const [, owner, repo] = githubMatch;
      webUrl = `https://github.com/${owner}/${repo}`;
    } else if (gitlabMatch) {
      const [, owner, repo] = gitlabMatch;
      webUrl = `https://gitlab.com/${owner}/${repo}`;
    } else if (bitbucketMatch) {
      const [, owner, repo] = bitbucketMatch;
      webUrl = `https://bitbucket.org/${owner}/${repo}`;
    } else {
      // Fallback: try to clean up the URL
      webUrl = repoUrl
        .replace(/\.git$/, '')
        .replace(/^git@/, 'https://')
        .replace(/:([^/])/, '/$1');
    }

    if (webUrl) {
      window.open(webUrl, '_blank');
    } else {
      toast.error('Could not parse repository URL');
    }
  };

  return (
    <>
      <AlertDialog
        show={show && !branchToDelete}
        closeModal={onClose}
        title="Switch branch"
        checkForBackground={true}
        customClassName="switch-branch-modal"
      >
        <div className="switch-branch-modal-content">
          {/* Search Section */}
          <div className="search-section">
            <label className="section-label">{branchingEnabled ? 'RECENT BRANCHES' : 'ALL OPEN BRANCHES'}</label>
            <div className="search-input-wrapper">
              <SolidIcon name="search" width="16" fill="var(--slate11)" />
              <input
                type="text"
                className="search-input"
                placeholder="Search.."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-cy="branch-search-input"
              />
            </div>
          </div>

          {/* Branch List */}
          <div className="branch-list-section">
            {isLoading || switchingBranchName ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <span>{switchingBranchName ? `Switching to ${switchingBranchName}...` : 'Loading branches...'}</span>
              </div>
            ) : displayBranches.length === 0 ? (
              <div className="empty-state">
                <p>No branches found</p>
              </div>
            ) : (
              <>
                {displayBranches.map((branch) => {
                  const isCurrentBranch = branch.name === currentBranchName;
                  const isDefaultBranch = branch.is_default || branch.isDefault;
                  return (
                    <div
                      key={branch.id || branch.name}
                      className={`branch-list-item ${isCurrentBranch ? 'active' : ''}`}
                      onClick={() => handleBranchClick(branch)}
                      data-cy={`branch-list-item-${branch.name}`}
                    >
                      <div className="branch-checkbox">
                        {isCurrentBranch && <SolidIcon name="check2" width="16" fill="var(--indigo9)" />}
                      </div>
                      <div className="branch-list-content">
                        <div className="branch-list-name">{branch.name}</div>
                        <div className="branch-list-meta">
                          Created by {branch.author || branch.created_by || 'default'},{' '}
                          {getRelativeTime(branch.createdAt || branch.created_at)}
                        </div>
                      </div>
                      {branchingEnabled && (
                        <div
                          className="branch-delete-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isDefaultBranch) return;
                            wsActions.resetDeleteState();
                            setBranchToDelete(branch);
                          }}
                        >
                          {isDefaultBranch ? (
                            <span
                              className="branch-delete-icon branch-delete-locked"
                              data-tooltip-id="ab-delete-branch-tooltip"
                              data-tooltip-content="Cannot delete default branch"
                            >
                              <TablerIcon iconName="IconTrash" size={18} color="var(--slate8)" stroke={1.5} />
                            </span>
                          ) : (
                            <span className="branch-delete-icon">
                              <TablerIcon iconName="IconTrash" size={18} color="var(--tomato9)" stroke={1.5} />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {branchingEnabled && <Tooltip id="ab-delete-branch-tooltip" place="right" style={{ zIndex: 9999 }} />}
                {/* Load More — platform git sync only, hidden during search */}
                {branchingEnabled && wsHasMoreRemote && !searchTerm && (
                  <button
                    className="load-more-btn"
                    onClick={() => wsActions.loadMoreRemoteBranches()}
                    data-cy="branch-load-more-btn"
                  >
                    Load more..
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="modal-footer-actions">
            <button className="footer-btn secondary" onClick={handleViewInGitRepo} data-cy="view-in-git-repo-btn">
              <span>View in git repo</span>
              <SolidIcon name="newtab" width="14" fill="var(--icon-default)" />
            </button>
            <button
              className="footer-btn accent"
              onClick={() => {
                setShowCreateModal(true);
              }}
              data-cy="create-branch-from-modal-btn"
            >
              <SolidIcon name="plusicon" width="14" fill="var(--indigo9)" />
              <span>Create new branch</span>
            </button>
          </div>
        </div>

        {/* Create Branch Modal */}
        {showCreateModal && (
          <CreateBranchModal
            appId={appId}
            organizationId={organizationId}
            onClose={() => setShowCreateModal(false)}
            onSuccess={(newBranch) => {
              // Optionally switch to the new branch after creation
              if (newBranch) {
                setCurrentBranch(newBranch);
                onClose(); // Close the switch branch modal too
              }
            }}
          />
        )}
      </AlertDialog>

      {/* Delete Branch Confirmation Dialog — rendered as sibling so switch-branch modal is hidden */}
      {branchToDelete && (
        <DeleteBranchConfirmModal
          branchToDelete={branchToDelete}
          onCancel={() => {
            wsActions.resetDeleteState();
            setBranchToDelete(null);
          }}
          onCloseParent={onClose}
          onDelete={(branchId) => wsActions.deleteWorkspaceBranch(branchId)}
        />
      )}

      {/* Pull conflict modal — shown when seeded branch auto-pull detects naming conflicts */}
      <PullConflictModal
        show={!!pullConflictGroups}
        conflictGroups={pullConflictGroups || []}
        onClose={() => setPullConflictGroups(null)}
        context="branch-switch"
      />
    </>
  );
}
