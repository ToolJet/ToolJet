import React, { useState, useEffect } from 'react';
import AlertDialog from '@/_ui/AlertDialog';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import useStore from '@/AppBuilder/_stores/store';
import { toast } from 'react-hot-toast';
import { CreateBranchModal } from './CreateBranchModal';
import { workspaceBranchesService } from '@/_services/workspace_branches.service';
import { setActiveBranch } from '@/_helpers/active-branch';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import '@/_styles/switch-branch-modal.scss';

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
  const { workspaceActiveBranch, wsBranches, wsActions } = useWorkspaceBranchesStore((state) => ({
    workspaceActiveBranch: state.currentBranch,
    wsBranches: state.branches,
    wsActions: state.actions,
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
        // Platform git sync: fetch workspace branches from DB only (no remote call)
        wsActions.fetchBranches().finally(() => setIsLoading(false));
      } else {
        // Per-app branching: fetch from remote git
        Promise.all([
          fetchBranches(appId, organizationId),
          lazyLoadAppVersions(appId),
          fetchDevelopmentVersions(appId),
        ]).finally(() => setIsLoading(false));
      }
    }
  }, [show, appId, organizationId, branchingEnabled, fetchBranches, lazyLoadAppVersions, fetchDevelopmentVersions, wsActions]);

  // Branch list: workspace branches for platform git sync, per-app branches otherwise
  const branchList = branchingEnabled ? wsBranches : allBranches;
  const filteredBranches = branchList.filter((branch) => {
    if (!branch.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // For per-app branching: exclude version names from the list
    if (!branchingEnabled) {
      const isVersionName = appVersions?.some(
        (v) => v.name === branch.name && (v.versionType === 'version' || v.version_type === 'version')
      );
      return !isVersionName;
    }
    return true;
  });

  const [switchingBranchName, setSwitchingBranchName] = useState(null);

  const handleBranchClick = async (branch) => {
    if (branch.name === currentBranchName) {
      onClose();
      return;
    }

    setSwitchingBranchName(branch.name);
    try {
      // Platform git sync: use workspace-level switching (navigates to resolved app)
      const wsBranches = useWorkspaceBranchesStore.getState().branches;
      if (wsBranches?.length > 0) {
        const targetWsBranch = wsBranches.find((b) => b.name === branch.name);
        if (targetWsBranch) {
          const result = await workspaceBranchesService.switchBranch(targetWsBranch.id, appId);
          const resolvedAppId = result?.resolvedAppId || result?.resolved_app_id;
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
            // Navigate to the corresponding app on the target branch
            toast.success(`Switched to ${branch.name}`);
            window.location.href = `/${pathParts[1]}/apps/${resolvedAppId}`;
          } else {
            // App doesn't exist on target branch — go to dashboard
            sessionStorage.setItem('git_sync_toast', `${appName || 'This app'} does not exist on this branch`);
            window.location.href = `/${pathParts[1]}`;
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
          {isLoading || switchingBranchName ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>{switchingBranchName ? `Switching to ${switchingBranchName}...` : 'Loading branches...'}</span>
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
