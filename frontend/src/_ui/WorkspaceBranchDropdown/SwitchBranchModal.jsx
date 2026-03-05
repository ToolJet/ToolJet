import React, { useState, useEffect } from 'react';
import AlertDialog from '@/_ui/AlertDialog';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { toast } from 'react-hot-toast';
import { WorkspaceCreateBranchModal } from './CreateBranchModal';
import '@/_styles/switch-branch-modal.scss';

export function WorkspaceSwitchBranchModal({ show, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { branches, activeBranchId, orgGitConfig } = useWorkspaceBranchesStore((state) => ({
    branches: state.branches,
    activeBranchId: state.activeBranchId,
    orgGitConfig: state.orgGitConfig,
  }));
  const actions = useWorkspaceBranchesStore((state) => state.actions);

  useEffect(() => {
    if (show) {
      setIsLoading(true);
      actions.fetchBranches().finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // Filter branches by search term
  const filteredBranches = branches.filter((branch) => {
    if (!branch.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleBranchClick = async (branch) => {
    if (branch.id === activeBranchId) {
      onClose();
      return;
    }

    try {
      await actions.switchBranch(branch.id);
      toast.success(`Switched to ${branch.name}`);
      onClose();
      window.location.reload();
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
    <AlertDialog
      show={show}
      closeModal={onClose}
      title="Switch branch"
      checkForBackground={true}
      customClassName="switch-branch-modal"
    >
      <div className="switch-branch-modal-content">
        {/* Search Section */}
        <div className="search-section">
          <label className="section-label">ALL OPEN BRANCHES</label>
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
          ) : filteredBranches.length === 0 ? (
            <div className="empty-state">
              <p>No branches found</p>
            </div>
          ) : (
            filteredBranches.map((branch) => {
              const isCurrentBranch = branch.id === activeBranchId;
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
                      {(branch.is_default || branch.isDefault) && (
                        <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 4 }}>(default)</span>
                      )}
                    </div>
                    <div className="branch-list-meta">
                      Created by {branch.author || branch.created_by || 'default'},{' '}
                      {getRelativeTime(branch.createdAt || branch.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
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
  );
}

export default WorkspaceSwitchBranchModal;
