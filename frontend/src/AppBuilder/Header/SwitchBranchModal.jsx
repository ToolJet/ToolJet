import React, { useState, useEffect } from 'react';
import AlertDialog from '@/_ui/AlertDialog';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import useStore from '@/AppBuilder/_stores/store';
import { toast } from 'react-hot-toast';
import { CreateBranchModal } from './CreateBranchModal';
import '@/_styles/switch-branch-modal.scss';

export function SwitchBranchModal({ show, onClose, appId, organizationId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    allBranches,
    selectedVersion,
    currentBranch,
    fetchBranches,
    switchBranch,
    switchToDefaultBranch,
    setCurrentBranch,
    orgGit,
    lazyLoadAppVersions,
    fetchDevelopmentVersions,
    appVersions,
  } = useStore((state) => ({
    allBranches: state.allBranches,
    selectedVersion: state.selectedVersion,
    currentBranch: state.currentBranch,
    fetchBranches: state.fetchBranches,
    switchBranch: state.switchBranch,
    switchToDefaultBranch: state.switchToDefaultBranch,
    setCurrentBranch: state.setCurrentBranch,
    orgGit: state.orgGit,
    lazyLoadAppVersions: state.lazyLoadAppVersions,
    fetchDevelopmentVersions: state.fetchDevelopmentVersions,
    appVersions: state.appVersions,
  }));

  const currentBranchName = selectedVersion?.name || currentBranch?.name;

  useEffect(() => {
    if (show && appId && organizationId) {
      setIsLoading(true);
      // Fetch branches, versions, and development versions for proper branch switching
      Promise.all([
        fetchBranches(appId, organizationId),
        lazyLoadAppVersions(appId),
        fetchDevelopmentVersions(appId),
      ]).finally(() => setIsLoading(false));
    }
  }, [show, appId, organizationId, fetchBranches, lazyLoadAppVersions, fetchDevelopmentVersions]);

  // Filter branches: exclude branches that are version names (versionType === 'version')
  const filteredBranches = allBranches.filter((branch) => {
    // Apply search filter
    if (!branch.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Check if this branch name corresponds to a version with versionType === 'version'
    // If so, exclude it (it's a version name, not an actual branch)
    const isVersionName = appVersions?.some(
      (v) => v.name === branch.name && (v.versionType === 'version' || v.version_type === 'version')
    );

    // Show the branch only if it's NOT a version name
    return !isVersionName;
  });

  const handleBranchClick = async (branch) => {
    if (branch.name === currentBranchName) {
      onClose();
      return;
    }

    try {
      // Determine if this is the default branch
      const defaultBranchName = orgGit?.git_https?.github_branch || orgGit?.git_ssh?.github_branch || 'main';
      const isDefaultBranch = branch.name === defaultBranchName;

      if (isDefaultBranch) {
        // Switch to default branch (finds active draft or latest version)
        const result = await switchToDefaultBranch(appId, branch.name);
        if (result.success) {
          setCurrentBranch(branch);
          if (result.isDraft) {
            toast.success(`Switched to ${branch.name} - Working on draft version`);
          }
          onClose();
        }
      } else {
        // Switch to feature branch
        await switchBranch(appId, branch.name);
        setCurrentBranch(branch);
        onClose();
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
              data-cy="branch-search-input"
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
              const isCurrentBranch = branch.name === currentBranchName;
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
                </div>
              );
            })
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
  );
}
