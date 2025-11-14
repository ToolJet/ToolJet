import React, { useState, useRef, useEffect } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import useStore from '@/AppBuilder/_stores/store';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import '@/_styles/branch-dropdown.scss';
import { toast } from 'react-hot-toast';
import { CreateBranchModal } from './CreateBranchModal';
import { SwitchBranchModal } from './SwitchBranchModal';
import { Tooltip } from 'react-tooltip';
import { gitSyncService } from '@/_services';
import OverflowTooltip from '@/_components/OverflowTooltip';

export function BranchDropdown({ appId, organizationId }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedBranches, setExpandedBranches] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [activeTab, setActiveTab] = useState('open'); // 'open' or 'closed'
  const [lastCommit, setLastCommit] = useState(null);
  const [isLoadingCommit, setIsLoadingCommit] = useState(false);
  const [hasFetchedPRs, setHasFetchedPRs] = useState(false); // Track if PRs have been fetched
  const [hasFetchedBranchInfo, setHasFetchedBranchInfo] = useState(false); // Track if branch info has been fetched
  const [isLoadingPRs, setIsLoadingPRs] = useState(false); // Track PR loading state
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

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

  // Helper function to check if branch is locked (will be used for branch switching UI later)
  const _isBranchLocked = (branch) => {
    return branch.is_merged || branch.isMerged || branch.is_released || branch.isReleased;
  };

  // Helper function to build PR creation URL
  const buildPRCreationURL = () => {
    const defaultBranchName = orgGit?.git_https?.github_branch || orgGit?.git_ssh?.github_branch || 'main';
    const sourceBranch = currentBranchName;

    // Get repository URL from orgGit (check https_url, ssh_url, or repository fields)
    const repoUrl =
      orgGit?.git_https?.https_url ||
      orgGit?.git_https?.repository ||
      orgGit?.git_ssh?.ssh_url ||
      orgGit?.git_ssh?.repository;

    if (!repoUrl) {
      console.error('No repository URL found in orgGit:', orgGit);
      return null;
    }

    // Extract owner and repo name from URL
    // Handles: https://github.com/owner/repo.git, git@github.com:owner/repo.git, etc.
    // Updated regex to handle dots in repo names (e.g., git-sync-2.0-repo.git)
    const githubMatch = repoUrl.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
    const gitlabMatch = repoUrl.match(/gitlab\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
    const bitbucketMatch = repoUrl.match(/bitbucket\.org[:/]([^/]+)\/(.+?)(\.git)?$/);

    if (githubMatch) {
      const [, owner, repo] = githubMatch;
      return `https://github.com/${owner}/${repo}/compare/${defaultBranchName}...${sourceBranch}?expand=1`;
    } else if (gitlabMatch) {
      const [, owner, repo] = gitlabMatch;
      return `https://gitlab.com/${owner}/${repo}/-/merge_requests/new?merge_request[source_branch]=${sourceBranch}&merge_request[target_branch]=${defaultBranchName}`;
    } else if (bitbucketMatch) {
      const [, owner, repo] = bitbucketMatch;
      return `https://bitbucket.org/${owner}/${repo}/pull-requests/new?source=${sourceBranch}&dest=${defaultBranchName}`;
    }

    console.error('Could not parse repository URL:', repoUrl);
    return null;
  };

  // Handle Create PR action
  const _handleCreatePR = () => {
    const prUrl = buildPRCreationURL();
    if (prUrl) {
      window.open(prUrl, '_blank', 'noopener,noreferrer');
      setShowDropdown(false);
    } else {
      toast.error('Unable to determine repository URL for PR creation');
    }
  };

  // Zustand state
  const {
    currentBranch,
    allBranches,
    pullRequests,
    branchingEnabled,
    fetchBranches,
    fetchPullRequests,
    fetchDevelopmentVersions,
    switchBranch,
    switchToDefaultBranch,
    setCurrentBranch,
    orgGit,
    selectedVersion,
  } = useStore((state) => ({
    currentBranch: state.currentBranch,
    allBranches: state.allBranches,
    pullRequests: state.pullRequests,
    branchingEnabled: state.branchingEnabled,
    fetchBranches: state.fetchBranches,
    fetchPullRequests: state.fetchPullRequests,
    fetchDevelopmentVersions: state.fetchDevelopmentVersions,
    switchBranch: state.switchBranch,
    switchToDefaultBranch: state.switchToDefaultBranch,
    setCurrentBranch: state.setCurrentBranch,
    orgGit: state.orgGit,
    selectedVersion: state.selectedVersion,
  }));

  const darkMode = localStorage.getItem('darkMode') === 'true' || false;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        event.stopPropagation();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset commit state when dropdown closes
  useEffect(() => {
    if (!showDropdown) {
      setLastCommit(null);
      setIsLoadingCommit(false);
      setHasFetchedPRs(false); // Reset PR fetch state when dropdown closes
      setHasFetchedBranchInfo(false); // Reset branch info fetch state when dropdown closes
    }
  }, [showDropdown]);

  // Fetch branches and PRs on mount and when dropdown opens
  useEffect(() => {
    if (branchingEnabled && appId && organizationId) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchingEnabled, appId, organizationId]);

  // Manual fetch last commit function
  const fetchLastCommit = async () => {
    const currentBranchName = selectedVersion?.name || currentBranch?.name;
    const defaultBranchName = orgGit?.git_https?.github_branch || orgGit?.git_ssh?.github_branch || 'main';
    const isOnDefaultBranch = currentBranchName === defaultBranchName;

    // Only fetch commit if on non-default branch
    if (!isOnDefaultBranch && currentBranchName && appId && organizationId) {
      setIsLoadingCommit(true);
      try {
        const data = await gitSyncService.checkForUpdates(appId, currentBranchName);
        const latestCommit = data?.meta_data?.latest_commit?.[0];

        if (latestCommit) {
          setLastCommit({
            message: latestCommit.message || latestCommit.commitMessage,
            author: latestCommit.author || latestCommit.author_name,
            date: latestCommit.date || latestCommit.committed_date,
          });
          toast.success('Branch info fetched successfully');
        } else {
          setLastCommit(null);
          toast.info('No commits found for this branch');
        }
        setIsLoadingCommit(false);
        setHasFetchedBranchInfo(true); // Mark branch info as fetched
      } catch (error) {
        console.error('Error fetching last commit:', error);
        setLastCommit(null);
        setIsLoadingCommit(false);
        setHasFetchedBranchInfo(true); // Mark as fetched even on error to hide button
        toast.error('Failed to fetch branch info');
      }
    } else {
      setLastCommit(null);
      setIsLoadingCommit(false);
    }
  };

  const handleRefresh = async () => {
    if (!appId || !organizationId) return;

    setIsLoadingPRs(true);
    try {
      await Promise.all([
        fetchBranches(appId, organizationId),
        fetchPullRequests(appId, organizationId),
        fetchDevelopmentVersions(appId), // Fetch development versions for branch switching
      ]);
      setHasFetchedPRs(true); // Mark PRs as fetched
    } catch (error) {
      console.error('Error refreshing branches/PRs:', error);
      toast.error('Failed to refresh branches');
    } finally {
      setIsLoadingPRs(false);
    }
  };

  const _handleBranchClick = async (branch) => {
    if (branch.name === currentBranch?.name) {
      setShowDropdown(false);
      return;
    }

    try {
      // Check if this is the default branch (main/master/etc from config)
      const defaultBranchName = orgGit?.git_https?.github_branch || orgGit?.git_ssh?.github_branch || 'main';
      const isDefaultBranch = branch.name === defaultBranchName;

      if (isDefaultBranch) {
        // Switch to default branch (finds active draft or latest version)
        const result = await switchToDefaultBranch(appId, branch.name);
        if (result.success) {
          setCurrentBranch(branch);
          if (result.isDraft) {
            toast.success(`Switched to ${branch.name} - Working on draft version`);
          } else {
            toast.success(`Switched to ${branch.name}`);
          }
          setShowDropdown(false);
        } else {
          toast.error(`Failed to switch to default branch: ${result.error}`);
        }
      } else {
        // Switch to feature branch
        const result = await switchBranch(appId, branch.name);
        if (result.success) {
          setCurrentBranch(branch);
          toast.success(`Switched to branch: ${branch.name}`);
          setShowDropdown(false);
        } else {
          toast.error(`Failed to switch branch: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error switching branch:', error);
      toast.error(error.message || 'Failed to switch branch');
    }
  };

  const _toggleBranchExpand = (branchName) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(branchName)) {
      newExpanded.delete(branchName);
    } else {
      newExpanded.add(branchName);
    }
    setExpandedBranches(newExpanded);
  };

  const _getPRForBranch = (branchName) => {
    return pullRequests.find((pr) => pr.source_branch === branchName || pr.sourceBranch === branchName);
  };

  // Check if current branch is the default branch
  const defaultBranchName = orgGit?.git_https?.github_branch || orgGit?.git_ssh?.github_branch || 'main';
  // Use selectedVersion.name as the current branch (ToolJet's version/branch name)
  const currentBranchName = selectedVersion?.name || currentBranch?.name;

  // Determine if on default branch:
  // - If versionType is 'version', we're on a regular version (show default branch UI)
  // - If versionType is 'branch', we're on a feature branch (show branch commit UI)
  const isOnDefaultBranch = selectedVersion?.versionType === 'version' || selectedVersion?.versionType !== 'branch';

  // Display name: show default branch name when on a version, otherwise show current branch name
  const displayBranchName = isOnDefaultBranch ? defaultBranchName : currentBranchName;

  // Filter PRs based on active tab
  // Check both 'state' and 'status' fields to support different API responses
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

  if (!branchingEnabled) {
    return null;
  }

  const renderPopover = (overlayProps) => (
    <Popover
      id="branch-dropdown-popover"
      className="branch-dropdown-popover"
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
        <div className={`${darkMode ? 'theme-dark' : ''}`} data-cy="branch-dropdown-popover">
          {/* Current Branch Header */}
          <div className="branch-dropdown-current-branch">
            {isOnDefaultBranch ? (
              <>
                <div className="branch-icon-container">
                  <SolidIcon name="lockclosed" width="16" fill="var(--indigo9)" />
                </div>
                <div className="branch-info">
                  <div className="branch-name-title">{displayBranchName || 'No branch selected'}</div>
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
                  <div className="branch-name-title">{displayBranchName || 'No branch selected'}</div>
                  <div className="branch-metadata-feature">
                    <span className="metadata-text">
                      Created by {selectedVersion?.createdBy || currentBranch?.author || 'Unknown'}
                    </span>
                    <span>•</span>
                    <span className="metadata-text">
                      {getRelativeTime(
                        selectedVersion?.createdAt ||
                          selectedVersion?.created_at ||
                          currentBranch?.createdAt ||
                          currentBranch?.created_at
                      )}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Main Content Area */}
          {isOnDefaultBranch ? (
            <>
              {/* Fetch PRs Button - Shown at top for default branch, hides after fetching */}
              {!hasFetchedPRs && (
                <div className="fetch-prs-section">
                  <button
                    className={`fetch-prs-btn ${isLoadingPRs ? 'loading' : ''}`}
                    onClick={handleRefresh}
                    disabled={isLoadingPRs}
                    data-cy="fetch-prs-btn"
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
                        <div className="empty-pr-icon">
                          <SolidIcon name="alert" width="18" fill="var(--amber9)" />
                        </div>
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
                        <div key={pr.id} className="pr-item" data-cy={`pr-item-${pr.id}`}>
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
              {/* Fetch Branch Info Button - Only show when not fetched yet */}
              {!hasFetchedBranchInfo && (
                <div className="fetch-branch-info-section">
                  <button
                    className="fetch-branch-info-btn"
                    onClick={fetchLastCommit}
                    disabled={isLoadingCommit}
                    data-cy="fetch-branch-info-btn"
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
                      {/* <div className="latest-commit-header">
                        <span className="section-label">LATEST COMMIT</span>
                      </div> */}
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
                      <div className="empty-state-icon-warning">
                        <SolidIcon name="alert" width="16" fill="var(--amber9)" />
                      </div>
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
            {/* Default branch footer: Create branch + Switch branch */}
            {isOnDefaultBranch ? (
              <>
                <button
                  className="create-branch-btn"
                  onClick={() => {
                    setShowDropdown(false);
                    setShowCreateModal(true);
                  }}
                  data-cy="create-branch-btn"
                >
                  <SolidIcon name="plus" width="14" fill="var(--indigo9)" />
                  <span>Create new branch</span>
                </button>
                {console.log('BranchDropdown - allBranches:', allBranches, 'length:', allBranches.length) ||
                  (true && allBranches.length > 0 && (
                    <button
                      className="switch-branch-btn"
                      onClick={() => {
                        setShowDropdown(false);
                        setShowSwitchModal(true);
                      }}
                      data-cy="switch-branch-btn"
                    >
                      <SolidIcon name="refresh" width="14" />
                      <span>Switch branch</span>
                    </button>
                  ))}
              </>
            ) : (
              <>
                {/* Feature branch footer: Create PR + Switch branch */}
                {/* Show Create PR button when there's a commit */}
                {hasFetchedBranchInfo && lastCommit && (
                  <button className="create-pr-btn" onClick={_handleCreatePR} data-cy="create-pr-btn">
                    <SolidIcon name="gitmerge" width="14" fill="var(--indigo9)" />
                    <span>Create pull request</span>
                  </button>
                )}
                {allBranches.length > 0 && (
                  <button
                    className="switch-branch-btn"
                    onClick={() => {
                      setShowDropdown(false);
                      setShowSwitchModal(true);
                    }}
                    data-cy="switch-branch-btn"
                  >
                    <SolidIcon name="refresh" width="14" />
                    <span>Switch branch</span>
                  </button>
                )}
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
        data-cy="branch-dropdown-container"
      >
        <button
          className="branch-dropdown-button"
          onClick={() => setShowDropdown(!showDropdown)}
          data-cy="branch-dropdown-header"
        >
          <SolidIcon name="gitbranch" width="16" fill="var(--slate12)" />
          <span className="branch-name" data-cy="current-branch-name">
            {displayBranchName || 'Select branch'}
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
              options: {
                boundary: 'viewport',
                padding: 8,
              },
            },
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
              },
            },
            {
              name: 'offset',
              options: {
                offset: [0, 4],
              },
            },
          ],
        }}
      >
        {({ placement: _placement, arrowProps: _arrowProps, show: _show, popper: _popper, ...props }) => (
          <div
            style={{
              position: 'absolute',
              zIndex: 1050,
            }}
          >
            {renderPopover(props)}
          </div>
        )}
      </Overlay>

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
            }
          }}
        />
      )}

      {/* Switch Branch Modal */}
      {showSwitchModal && (
        <SwitchBranchModal
          show={showSwitchModal}
          onClose={() => setShowSwitchModal(false)}
          appId={appId}
          organizationId={organizationId}
        />
      )}

      {/* Tooltip for PR details */}
      {/* Tooltip for PR details */}
      <Tooltip
        id="branch-dropdown-tooltip"
        className="branch-pr-tooltip"
        style={{
          backgroundColor: 'var(--slate12)',
          color: 'var(--slate1)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          maxWidth: '300px',
          whiteSpace: 'pre-line',
          zIndex: 10000,
        }}
      />
    </>
  );
}
