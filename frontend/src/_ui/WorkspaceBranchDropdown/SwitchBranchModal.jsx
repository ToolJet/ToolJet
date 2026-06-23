import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import AlertDialog from '@/_ui/AlertDialog';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { toast } from 'react-hot-toast';
import { WorkspaceCreateBranchModal } from './CreateBranchModal';
import { Alert } from '@/_ui/Alert';
import '@/_styles/switch-branch-modal.scss';
import { DeleteBranchConfirmModal } from './DeleteBranchConfirmModal';
import { PullConflictModal } from './WorkspacePullConflictModal';
import { Tooltip } from 'react-tooltip';
import { authenticationService } from '@/_services';
import TablerIcon from '@/_ui/Icon/TablerIcon';

export function WorkspaceSwitchBranchModal({ show, onClose, onBranchSwitch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [pullConflictGroups, setPullConflictGroups] = useState(null);

  const { branches, activeBranchId, orgGitConfig, currentBranch, remoteBranches, hasMoreRemote, visibleCount } =
    useWorkspaceBranchesStore((state) => ({
      branches: state.branches,
      activeBranchId: state.activeBranchId,
      orgGitConfig: state.orgGitConfig,
      currentBranch: state.currentBranch,
      remoteBranches: state.remoteBranches,
      hasMoreRemote: state.hasMoreRemote,
      visibleCount: state.visibleCount,
    }));
  const actions = useWorkspaceBranchesStore((state) => state.actions);
  const organizationId = authenticationService.currentSessionValue?.current_organization_id;

  const defaultGitBranch = orgGitConfig?.default_git_branch || orgGitConfig?.defaultGitBranch || 'main';
  const isOnDefaultBranch =
    currentBranch?.is_default || currentBranch?.isDefault || currentBranch?.name === defaultGitBranch;

  useEffect(() => {
    if (show) {
      actions.resetRemoteBranches();
      setIsLoading(true);
      Promise.all([actions.fetchBranches(), actions.fetchRemoteBranches().catch(() => {})]).finally(() =>
        setIsLoading(false)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const branchSorter = useCallback(
    (a, b) => {
      const aIsDefault = a.is_default || a.isDefault;
      const bIsDefault = b.is_default || b.isDefault;
      const aIsActive = a.id === activeBranchId;
      const bIsActive = b.id === activeBranchId;
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      const aDate = a.lastCommitAt ? new Date(a.lastCommitAt).getTime() : 0;
      const bDate = b.lastCommitAt ? new Date(b.lastCommitAt).getTime() : 0;
      if (bDate !== aDate) return bDate - aDate;
      // Tiebreaker: branches with the same committedDate (e.g. created from the same source)
      // are ordered by DB createdAt DESC — more recently created branch appears first.
      const aCreated = a.createdAt || a.created_at;
      const bCreated = b.createdAt || b.created_at;
      const aCreatedMs = aCreated ? new Date(aCreated).getTime() : 0;
      const bCreatedMs = bCreated ? new Date(bCreated).getTime() : 0;
      return bCreatedMs - aCreatedMs;
    },
    [activeBranchId]
  );
  // Full list is always in store — just sort and slice to visibleCount
  const filteredBranches = useMemo(() => {
    const all = (remoteBranches || []).filter((branch) => !(onBranchSwitch && (branch.is_default || branch.isDefault)));
    return [...all].sort(branchSorter).slice(0, visibleCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteBranches, onBranchSwitch, branchSorter, visibleCount]);

  // Fuse instance over all branches (DB-loaded, no commit dates) — rebuilt only when branches list changes
  const fuse = useMemo(
    () =>
      new Fuse(branches || [], {
        keys: ['name'],
        threshold: 0.4,
        includeScore: true,
        ignoreLocation: true,
      }),
    [branches]
  );

  // Fuzzy search results across ALL branches (not just loaded page)
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return fuse
      .search(searchTerm)
      .map((r) => r.item)
      .filter((b) => !(onBranchSwitch && (b.is_default || b.isDefault)))
      .sort(branchSorter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuse, searchTerm, onBranchSwitch, activeBranchId]);

  const displayBranches = searchTerm ? searchResults : filteredBranches;

  const handleBranchClick = async (branch) => {
    if (branch.id === activeBranchId) {
      onClose();
      return;
    }

    try {
      // Verify branch exists on remote before switching
      const existsOnRemote = await actions.checkBranchExistsOnRemote(branch.name);
      if (!existsOnRemote) {
        toast.error(
          'Branch does not exist in git. Delete this branch and create a new one to continue to make changes.'
        );
        return;
      }

      // Seeded branches (no createdBy, non-default) were created at git sync config time without
      // workspace data. Pull FIRST before switching — if pull fails the user stays on the modal
      // on their current branch rather than landing on an empty workspace.
      const isSeededBranch = !branch.createdBy && !(branch.is_default || branch.isDefault);
      if (isSeededBranch) {
        setIsLoading(true);
        try {
          await actions.pullWorkspace(branch.name, branch.id);
        } catch (pullError) {
          setIsLoading(false);
          if (pullError?.statusCode === 409) {
            try {
              const parsed = JSON.parse(pullError?.data?.message || pullError?.error || '{}');
              if (parsed?.conflictGroups?.length) {
                setPullConflictGroups(parsed.conflictGroups);
                return;
              }
            } catch {
              /* fall through to generic toast */
            }
          }
          toast.error(pullError?.error || pullError?.message || 'Pull failed');
          return;
        }
      }

      // Pull succeeded (or not a seeded branch) — now switch
      await actions.switchBranch(branch.id);

      toast.success(`Switched to ${branch.name}`);
      if (onBranchSwitch) {
        onBranchSwitch(branch);
      } else {
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error('Error switching branch:', error);
      const errorMessage = error?.error || error?.message || 'Failed to switch branch';
      toast.error(errorMessage);
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
    const repoUrl = orgGitConfig?.repo_url || orgGitConfig?.repoUrl || '';

    if (!repoUrl) {
      toast.error('Git repository URL not available');
      return;
    }

    // Extract web URL from repo URL
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
          {/* Info message - only shown on default branch */}
          {isOnDefaultBranch && (
            <Alert placeSvgTop={true} svg="warning-icon" cls="create-branch-info">
              Default branch is locked. Switch branches to make changes.
            </Alert>
          )}

          {/* Search Section */}
          <div className="search-section">
            <label className="section-label">RECENT BRANCHES</label>
            <div className="search-input-wrapper">
              <SolidIcon name="search" width="16" fill="var(--slate11)" />
              <input
                type="text"
                className="search-input"
                placeholder="Search.."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-cy="workspace-branch-search-input"
              />
            </div>
          </div>

          {/* Branch List */}
          <div className="branch-list-section">
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <span>Loading branches...</span>
              </div>
            ) : displayBranches.length === 0 ? (
              <div className="empty-state">
                <p>No branches found</p>
              </div>
            ) : (
              <>
                {displayBranches.map((branch) => {
                  const isCurrentBranch = branch.id === activeBranchId;
                  const isDefaultBranch = branch.is_default || branch.isDefault;
                  return (
                    <div
                      key={branch.id || branch.name}
                      className={`branch-list-item ${isCurrentBranch ? 'active' : ''}`}
                      onClick={() => handleBranchClick(branch)}
                      data-cy={`workspace-branch-list-item-${branch.name}`}
                    >
                      <div className="branch-checkbox">
                        {isCurrentBranch && <SolidIcon name="check2" width="16" fill="var(--indigo9)" />}
                      </div>
                      <div className="branch-list-content">
                        <div className="branch-list-name">
                          {branch.name}
                          {isDefaultBranch && (
                            <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 4 }}>(default)</span>
                          )}
                        </div>
                        <div className="branch-list-meta">
                          Created by {branch.author || branch.created_by || 'default'},{' '}
                          {getRelativeTime(branch.createdAt || branch.created_at)}
                        </div>
                      </div>
                      <div
                        className="branch-delete-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isDefaultBranch) return;
                          actions.resetDeleteState();
                          setBranchToDelete(branch);
                        }}
                      >
                        {isDefaultBranch ? (
                          <span
                            className="branch-delete-icon branch-delete-locked"
                            data-tooltip-id="delete-branch-tooltip"
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
                    </div>
                  );
                })}
                <Tooltip id="delete-branch-tooltip" place="right" />
                {hasMoreRemote && !searchTerm && (
                  <button
                    className="load-more-btn"
                    onClick={() => actions.loadMoreRemoteBranches()}
                    data-cy="workspace-branch-load-more-btn"
                  >
                    Load more..
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="modal-footer-actions">
            <button
              className="footer-btn secondary"
              onClick={handleViewInGitRepo}
              data-cy="workspace-view-in-git-repo-btn"
            >
              <span>View in git repo</span>
              <SolidIcon name="newtab" width="14" fill="var(--icon-default)" />
            </button>
            <button
              className="footer-btn accent"
              onClick={() => {
                setShowCreateModal(true);
              }}
              data-cy="workspace-create-branch-from-modal-btn"
            >
              <SolidIcon name="plusicon" width="14" fill="var(--indigo9)" />
              <span>Create new branch</span>
            </button>
          </div>
        </div>

        {/* Create Branch Modal */}
        {showCreateModal && (
          <WorkspaceCreateBranchModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              onClose();
            }}
          />
        )}
      </AlertDialog>

      {/* Delete Branch Confirmation Dialog — rendered as sibling so switch-branch modal is hidden */}
      {branchToDelete && (
        <DeleteBranchConfirmModal
          branchToDelete={branchToDelete}
          onCancel={() => {
            actions.resetDeleteState();
            setBranchToDelete(null);
          }}
          onCloseParent={onClose}
          onDelete={(branchId) => actions.deleteWorkspaceBranch(branchId)}
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

export default WorkspaceSwitchBranchModal;
