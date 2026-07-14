import React, { useState, useRef, useEffect } from 'react';
import cx from 'classnames';
import { Overlay, Popover } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { workspaceBranchesService } from '@/_services/workspace_branches.service';
import { WorkspaceCreateBranchModal } from './CreateBranchModal';
import { WorkspaceSwitchBranchModal } from './SwitchBranchModal';
import { toast } from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import OverflowTooltip from '@/_components/OverflowTooltip';
import '@/_styles/branch-dropdown.scss';

export function WorkspaceBranchDropdown() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [activeTab, setActiveTab] = useState('open'); // 'open' or 'closed'
  const [lastCommit, setLastCommit] = useState(null);
  const [isLoadingCommit, setIsLoadingCommit] = useState(false);
  const [hasFetchedPRs, setHasFetchedPRs] = useState(false);
  const [hasFetchedBranchInfo, setHasFetchedBranchInfo] = useState(false);
  const [isLoadingPRs, setIsLoadingPRs] = useState(false);
  const [pullRequests, setPullRequests] = useState([]);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  const { branches, currentBranch, orgGitConfig } = useWorkspaceBranchesStore((state) => ({
    branches: state.branches,
    currentBranch: state.currentBranch,
    orgGitConfig: state.orgGitConfig,
  }));

  const darkMode = localStorage.getItem('darkMode') === 'true' || false;

  const isBranchingEnabled = orgGitConfig?.is_branching_enabled || orgGitConfig?.isBranchingEnabled;

  // Determine default branch name from git config
  const defaultGitBranch = orgGitConfig?.default_git_branch || orgGitConfig?.defaultGitBranch || 'main';
  const isOnDefaultBranch =
    currentBranch?.is_default || currentBranch?.isDefault || currentBranch?.name === defaultGitBranch;
  const displayBranchName = currentBranch?.name || defaultGitBranch;

  // Helper function to get relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Updated today';
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
    return `Updated ${Math.floor(diffDays / 30)} months ago`;
  };

  // Helper function to format commit date (e.g., "25 Sept, 8:45am")
  const formatCommitDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${day} ${month}, ${hours}:${minutesStr}${ampm}`;
  };

  // Format PR date
  const formatPRDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Build PR creation URL
  const buildPRCreationURL = () => {
    const sourceBranch = currentBranch?.name;
    const repoUrl = orgGitConfig?.repo_url || orgGitConfig?.repoUrl || '';
    const gitType = orgGitConfig?.git_type || orgGitConfig?.gitType || 'github_https';

    if (!repoUrl || !sourceBranch) return null;

    const githubMatch = repoUrl.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
    const gitlabMatch = repoUrl.match(/gitlab\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
    const bitbucketMatch = repoUrl.match(/bitbucket\.org[:/]([^/]+)\/(.+?)(\.git)?$/);

    if (githubMatch) {
      const [, owner, repo] = githubMatch;
      return `https://github.com/${owner}/${repo}/compare/${defaultGitBranch}...${sourceBranch}?expand=1`;
    } else if (gitlabMatch || gitType === 'gitlab') {
      let baseUrl = repoUrl;
      if (gitlabMatch) {
        const [, owner, repo] = gitlabMatch;
        baseUrl = `https://gitlab.com/${owner}/${repo}`;
      }
      return `${baseUrl}/-/merge_requests/new?merge_request[source_branch]=${encodeURIComponent(
        sourceBranch
      )}&merge_request[target_branch]=${encodeURIComponent(defaultGitBranch)}`;
    } else if (bitbucketMatch) {
      const [, owner, repo] = bitbucketMatch;
      return `https://bitbucket.org/${owner}/${repo}/pull-requests/new?source=${sourceBranch}&dest=${defaultGitBranch}`;
    }

    // GitHub SSH fallback
    if (gitType === 'github_ssh') {
      const match = repoUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
      if (match) {
        return `https://github.com/${match[1]}/compare/${defaultGitBranch}...${sourceBranch}?expand=1`;
      }
    }

    return null;
  };

  // Handle Create PR action
  const handleCreatePR = () => {
    const prUrl = buildPRCreationURL();
    if (prUrl) {
      window.open(prUrl, '_blank', 'noopener,noreferrer');
      setShowDropdown(false);
    } else {
      toast.error('Unable to determine repository URL for PR creation');
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // Reset state when dropdown closes
  useEffect(() => {
    if (!showDropdown) {
      setLastCommit(null);
      setIsLoadingCommit(false);
      setHasFetchedPRs(false);
      setHasFetchedBranchInfo(false);
      setPullRequests([]);
    }
  }, [showDropdown]);

  // Workspace-level PR fetch — returns all repo PRs (no app filtering)
  const handleFetchPRs = async () => {
    setIsLoadingPRs(true);
    try {
      const data = await workspaceBranchesService.fetchPullRequests();
      setPullRequests(data?.pullRequests || []);
      setHasFetchedPRs(true);
      toast.success('PRs fetched successfully');
    } catch (error) {
      console.error('Error fetching PRs:', error);
      toast.error('Failed to fetch PRs');
      setHasFetchedPRs(true);
    } finally {
      setIsLoadingPRs(false);
    }
  };

  // Fetch last commit info for feature branch
  const fetchLastCommit = async () => {
    const branchName = currentBranch?.name;
    if (!branchName || isOnDefaultBranch) {
      setLastCommit(null);
      setIsLoadingCommit(false);
      return;
    }

    setIsLoadingCommit(true);
    try {
      const data = await useWorkspaceBranchesStore.getState().actions.checkForUpdates(branchName);
      const latestCommit = data?.latestCommit || data?.latest_commit;

      if (latestCommit) {
        setLastCommit({
          message: latestCommit.message || latestCommit.commitMessage,
          author: latestCommit.author || latestCommit.author_name,
          date: latestCommit.date || latestCommit.committed_date,
        });
      } else {
        setLastCommit(null);
      }
      setHasFetchedBranchInfo(true);
    } catch (error) {
      console.error('Error fetching last commit:', error);
      setLastCommit(null);
      setHasFetchedBranchInfo(true);
    } finally {
      setIsLoadingCommit(false);
    }
  };

  // Filter PRs based on active tab
  const openPRs = pullRequests.filter(
    (pr) => pr.state?.toLowerCase() === 'open' || pr.status?.toLowerCase() === 'open'
  );
  const closedPRs = pullRequests.filter(
    (pr) =>
      pr.state?.toLowerCase() === 'closed' ||
      pr.status?.toLowerCase() === 'closed' ||
      (pr.state?.toLowerCase() !== 'open' && pr.status?.toLowerCase() !== 'open')
  );
  const displayPRs = activeTab === 'open' ? openPRs : closedPRs;

  if (!orgGitConfig) return null;

  const renderPopover = (overlayProps) => (
    <Popover
      id="branch-dropdown-popover"
      className={cx('branch-dropdown-popover', { 'dark-theme theme-dark': darkMode })}
      ref={popoverRef}
      {...overlayProps}
      style={{
        ...overlayProps?.style,
        minWidth: '320px',
        borderRadius: '8px',
        border: '1px solid var(--border-weak)',
        boxShadow: '0px 0px 1px rgba(48, 50, 51, 0.05), 0px 1px 1px rgba(48, 50, 51, 0.1)',
        padding: 0,
      }}
    >
      <Popover.Body style={{ padding: 0 }}>
        <div className={`${darkMode ? 'theme-dark' : ''}`} data-cy="workspace-branch-dropdown-popover">
          {/* Current Branch Header */}
          <div className={`branch-dropdown-current-branch ${!isOnDefaultBranch ? 'with-border' : ''}`}>
            {isOnDefaultBranch ? (
              <>
                <div className="branch-icon-container">
                  <SolidIcon name="lockclosed" width="16" fill="var(--indigo9)" />
                </div>
                <div className="branch-info">
                  <div className="branch-name-title">{displayBranchName}</div>
                  <div className="branch-metadata">
                    <span className="metadata-text">Default branch</span>
                    {(currentBranch?.updatedAt || currentBranch?.updated_at) && (
                      <>
                        <span>•</span>
                        <span className="metadata-text">
                          {getRelativeTime(currentBranch.updatedAt || currentBranch.updated_at)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="branch-icon-container-feature">
                  <SolidIcon name="gitbranch" width="16" fill="var(--indigo9)" />
                </div>
                <div className="branch-info">
                  <div className="branch-name-title">{displayBranchName}</div>
                  <div className="branch-metadata-feature">
                    <span className="metadata-text">
                      Created by{' '}
                      {currentBranch?.createdBy || currentBranch?.created_by || currentBranch?.author || 'Unknown'}
                    </span>
                    {(currentBranch?.createdAt || currentBranch?.created_at) && (
                      <>
                        <span>•</span>
                        <span className="metadata-text">
                          {getRelativeTime(currentBranch?.createdAt || currentBranch?.created_at)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Main Content Area */}
          {isOnDefaultBranch ? (
            <>
              {/* Old: static info state for default branch */}
              {/* <div className="fetch-prs-section">
                <div className="empty-pr-state-box" style={{ margin: '0' }}>
                  <AlertTriangle width="18" height="18" />
                  <div className="empty-pr-content">
                    <div className="empty-pr-title">Platform-level git sync</div>
                    <div className="empty-pr-description">
                      Pull changes from the default branch to sync workspace resources
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Fetch PRs Button - Shown at top for default branch, hides after fetching */}
              {!hasFetchedPRs && (
                <div className="fetch-prs-section">
                  <button
                    className={`fetch-prs-btn ${isLoadingPRs ? 'loading' : ''}`}
                    onClick={handleFetchPRs}
                    disabled={isLoadingPRs}
                    data-cy="workspace-fetch-prs-btn"
                  >
                    {isLoadingPRs ? (
                      <>
                        <div className="spinner-small"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <SolidIcon name="refresh" width="14" />
                        <span>Fetch PRs</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* PR Tabs and List - Only shown after fetching */}
              {hasFetchedPRs && (
                <>
                  {/* PR Tabs */}
                  <div className="pr-tabs">
                    <button
                      className={`pr-tab ${activeTab === 'open' ? 'active' : ''}`}
                      onClick={() => setActiveTab('open')}
                    >
                      Open PR
                    </button>
                    <button
                      className={`pr-tab ${activeTab === 'closed' ? 'active' : ''}`}
                      onClick={() => setActiveTab('closed')}
                    >
                      Closed PR
                    </button>
                  </div>

                  {/* PR List */}
                  <div className="pr-list-container">
                    {displayPRs.length === 0 ? (
                      <div className="empty-pr-state-box">
                        <AlertTriangle width="18" height="18" />
                        <div className="empty-pr-content">
                          <div className="empty-pr-title">
                            {activeTab === 'open' ? 'There are no open PRs' : 'There are no closed PRs'}
                          </div>
                          <div className="empty-pr-description">
                            {activeTab === 'open'
                              ? 'Create a pull request to contribute your changes'
                              : 'Merge a pull request to contribute your changes'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      displayPRs.map((pr) => (
                        <div key={pr.id} className="pr-item" data-cy={`workspace-pr-item-${pr.id}`}>
                          <div className="pr-icon">
                            <SolidIcon name="gitmerge" width="20" fill="var(--slate11)" />
                          </div>
                          <div className="pr-content">
                            <OverflowTooltip
                              className="pr-title"
                              childrenClassName="pr-title"
                              placement="top"
                              whiteSpace="nowrap"
                            >
                              {pr.title || 'Untitled PR'}
                            </OverflowTooltip>
                            <div className="pr-metadata">
                              from {pr.source_branch || pr.sourceBranch} | {formatPRDate(pr.created_at || pr.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Old: static "Push your changes" state for feature branch */}
              {/* <div className="no-commits-empty-state">
                <AlertTriangle width="18" height="18" />
                <div className="empty-state-content">
                  <div className="empty-state-title">Push your changes</div>
                  <div className="empty-state-description">
                    Commit and push workspace changes, then create a pull request
                  </div>
                </div>
              </div> */}

              {/* Fetch Branch Info Button - Only show when not fetched yet */}
              {!hasFetchedBranchInfo && (
                <div className="fetch-branch-info-section">
                  <button
                    className="fetch-branch-info-btn"
                    onClick={fetchLastCommit}
                    disabled={isLoadingCommit}
                    data-cy="workspace-fetch-branch-info-btn"
                  >
                    <SolidIcon name="refresh" width="14" />
                    <span>{isLoadingCommit ? 'Fetching...' : 'Fetch branch info'}</span>
                  </button>
                </div>
              )}

              {/* Latest Commit Section & Empty State - Only show after fetching */}
              {hasFetchedBranchInfo && (
                <>
                  {/* Latest Commit Section - for non-default branches with commits */}
                  {lastCommit && !isLoadingCommit && (
                    <div className="latest-commit-section">
                      <div className="latest-commit-header">
                        <span className="section-label">LATEST COMMIT</span>
                      </div>
                      <div className="commit-info">
                        <div className="commit-icon">
                          <SolidIcon name="commit" width="20" />
                        </div>
                        <div className="commit-content">
                          <div className="commit-title">{lastCommit.message || 'No message'}</div>
                          <div className="commit-metadata">
                            By {lastCommit.author || 'Unknown'} | {formatCommitDate(lastCommit.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty state - no commits yet */}
                  {!lastCommit && !isLoadingCommit && (
                    <div className="no-commits-empty-state">
                      <AlertTriangle width="18" height="18" />
                      <div className="empty-state-content">
                        <div className="empty-state-title">There are no commits yet</div>
                        <div className="empty-state-description">
                          Commit your changes to create a pull request to contribute them
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading state for commit */}
                  {isLoadingCommit && (
                    <div className="loading-commit-state">
                      <div className="spinner"></div>
                      <span>Loading commit info...</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Footer actions */}
          <div className="branch-dropdown-footer">
            {isOnDefaultBranch ? (
              <>
                {isBranchingEnabled && (
                  <button
                    className="create-branch-btn"
                    onClick={() => {
                      setShowDropdown(false);
                      setShowCreateModal(true);
                    }}
                    data-cy="workspace-create-branch-btn"
                  >
                    <SolidIcon name="plus" width="14" fill="var(--indigo9)" />
                    <span>Create new branch</span>
                  </button>
                )}
                <button
                  className="switch-branch-btn"
                  onClick={() => {
                    setShowDropdown(false);
                    setShowSwitchModal(true);
                  }}
                  data-cy="workspace-switch-branch-btn"
                >
                  <SolidIcon name="refresh" width="14" />
                  <span>Switch branch</span>
                </button>
              </>
            ) : (
              <>
                {/* Feature branch footer: Create PR + Switch branch */}
                <button className="create-pr-btn" onClick={handleCreatePR} data-cy="workspace-create-pr-btn">
                  <SolidIcon name="gitmerge" width="14" fill="var(--indigo9)" />
                  <span>Create pull request</span>
                </button>
                <button
                  className="switch-branch-btn"
                  onClick={() => {
                    setShowDropdown(false);
                    setShowSwitchModal(true);
                  }}
                  data-cy="workspace-switch-branch-btn"
                >
                  <SolidIcon name="refresh" width="14" />
                  <span>Switch branch</span>
                </button>
              </>
            )}
          </div>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <>
      <div
        className={`branch-dropdown-container ${showDropdown ? 'selected' : ''} ${darkMode ? 'dark-theme' : ''}`}
        ref={buttonRef}
        data-cy="workspace-branch-dropdown-container"
      >
        <button
          className="branch-dropdown-button"
          onClick={() => setShowDropdown(!showDropdown)}
          data-cy="workspace-branch-dropdown-header"
        >
          <SolidIcon name="gitbranch" width="16" fill="var(--slate12)" />
          <span className="branch-name" data-cy="workspace-current-branch-name">
            {displayBranchName}
          </span>
        </button>
      </div>

      <Overlay
        show={showDropdown}
        target={buttonRef.current}
        placement="bottom-end"
        rootClose
        onHide={() => setShowDropdown(false)}
        popperConfig={{
          modifiers: [
            {
              name: 'preventOverflow',
              options: { boundary: 'viewport', padding: 8 },
            },
            {
              name: 'flip',
              options: { fallbackPlacements: ['bottom-start', 'top-end', 'top-start'] },
            },
            {
              name: 'offset',
              options: { offset: [0, 4] },
            },
          ],
        }}
      >
        {({ placement: _p, arrowProps: _a, show: _s, popper: _po, ...props }) => (
          <div style={{ position: 'absolute', zIndex: 1050 }}>{renderPopover(props)}</div>
        )}
      </Overlay>

      {/* Create Branch Modal */}
      {showCreateModal && (
        <WorkspaceCreateBranchModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}

      {/* Switch Branch Modal */}
      {showSwitchModal && (
        <WorkspaceSwitchBranchModal show={showSwitchModal} onClose={() => setShowSwitchModal(false)} />
      )}
    </>
  );
}

export default WorkspaceBranchDropdown;
