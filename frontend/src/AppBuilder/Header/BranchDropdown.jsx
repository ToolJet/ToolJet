import React, { useState, useRef, useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import '@/_styles/branch-dropdown.scss';
import { toast } from 'react-hot-toast';
import { CreateBranchModal } from './CreateBranchModal';
import { Tooltip } from 'react-tooltip';

export function BranchDropdown({ appId, organizationId }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedBranches, setExpandedBranches] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef(null);

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

  // Helper function to check if branch is locked
  const isBranchLocked = (branch) => {
    return branch.is_merged || branch.isMerged || branch.is_released || branch.isReleased;
  };

  // Zustand state
  const {
    currentBranch,
    allBranches,
    pullRequests,
    branchingEnabled,
    isLoadingBranches,
    fetchBranches,
    fetchPullRequests,
    switchBranch,
    setCurrentBranch,
  } = useStore((state) => ({
    currentBranch: state.currentBranch,
    allBranches: state.allBranches,
    pullRequests: state.pullRequests,
    branchingEnabled: state.branchingEnabled,
    isLoadingBranches: state.isLoadingBranches,
    fetchBranches: state.fetchBranches,
    fetchPullRequests: state.fetchPullRequests,
    switchBranch: state.switchBranch,
    setCurrentBranch: state.setCurrentBranch,
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

  // Fetch branches and PRs on mount and when dropdown opens
  useEffect(() => {
    if (branchingEnabled && appId && organizationId) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchingEnabled, appId, organizationId]);

  const handleRefresh = async () => {
    if (!appId || !organizationId) return;

    try {
      await Promise.all([fetchBranches(appId, organizationId), fetchPullRequests(appId)]);
    } catch (error) {
      console.error('Error refreshing branches/PRs:', error);
      toast.error('Failed to refresh branches');
    }
  };

  const handleBranchClick = async (branch) => {
    if (branch.name === currentBranch?.name) {
      setShowDropdown(false);
      return;
    }

    try {
      const result = await switchBranch(appId, branch.name);
      if (result.success) {
        setCurrentBranch(branch);
        toast.success(`Switched to branch: ${branch.name}`);
        setShowDropdown(false);
      } else {
        toast.error(`Failed to switch branch: ${result.error}`);
      }
    } catch (error) {
      console.error('Error switching branch:', error);
      toast.error('Failed to switch branch');
    }
  };

  const toggleBranchExpand = (branchName) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(branchName)) {
      newExpanded.delete(branchName);
    } else {
      newExpanded.add(branchName);
    }
    setExpandedBranches(newExpanded);
  };

  const getPRForBranch = (branchName) => {
    return pullRequests.find((pr) => pr.source_branch === branchName || pr.sourceBranch === branchName);
  };

  const getPRBadge = (pr) => {
    if (!pr) return null;

    const badgeClass =
      {
        open: 'pr-badge-open',
        merged: 'pr-badge-merged',
        closed: 'pr-badge-closed',
      }[pr.state?.toLowerCase()] || 'pr-badge-open';

    const badgeText =
      {
        open: 'Open PR',
        merged: 'Merged',
        closed: 'Closed',
      }[pr.state?.toLowerCase()] || 'Open PR';

    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return 'Unknown';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Build tooltip content with PR details
    const tooltipContent = `
      ${pr.title || 'Untitled PR'}
      Author: ${pr.author || 'Unknown'}
      Created: ${formatDate(pr.created_at || pr.createdAt)}
      ${pr.merged_at || pr.mergedAt ? `Merged: ${formatDate(pr.merged_at || pr.mergedAt)}` : ''}
    `.trim();

    return (
      <span
        className={`pr-badge ${badgeClass}`}
        data-tooltip-id="branch-dropdown-tooltip"
        data-tooltip-content={tooltipContent}
        data-tooltip-place="right"
      >
        {badgeText}
      </span>
    );
  };

  // Separate master and sub-branches
  const masterBranch = allBranches.find((b) => b.name === 'master' || b.name === 'main');
  const subBranches = allBranches.filter((b) => b.name !== 'master' && b.name !== 'main');

  if (!branchingEnabled) {
    return null;
  }

  return (
    <div
      className={`branch-dropdown-container ${showDropdown ? 'selected' : ''} ${darkMode ? 'dark-theme' : ''}`}
      ref={dropdownRef}
      data-cy="branch-dropdown-container"
    >
      <button
        className="branch-dropdown-button"
        onClick={() => setShowDropdown(!showDropdown)}
        data-cy="branch-dropdown-header"
      >
        <SolidIcon name="gitbranch" width="16" fill="var(--slate12)" />
        <span className="branch-name" data-cy="current-branch-name">
          {currentBranch?.name || 'Select branch'}
        </span>
      </button>

      {showDropdown && (
        <div className={`branch-dropdown-popover ${darkMode ? 'theme-dark' : ''}`} data-cy="branch-dropdown-popover">
          {/* Current Branch Header */}
          <div className="branch-dropdown-current-branch">
            <div className="branch-icon-container">
              <SolidIcon name="lockclosed" width="16" fill="var(--indigo9)" />
            </div>
            <div className="branch-info">
              <div className="branch-name-title">{currentBranch?.name || 'No branch selected'}</div>
              <div className="branch-metadata">
                <span className="metadata-text">Default branch</span>
                {currentBranch?.updatedAt && (
                  <>
                    <span className="metadata-dot">•</span>
                    <span className="metadata-text">{getRelativeTime(currentBranch.updatedAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="branch-dropdown-content">
            {/* Fetch PRs Button */}
            {!isLoadingBranches && allBranches.length > 0 && (
              <div className="fetch-prs-section">
                <button
                  className="fetch-prs-btn"
                  onClick={handleRefresh}
                  disabled={isLoadingBranches}
                  data-cy="fetch-prs-btn"
                >
                  <SolidIcon
                    name="refresh"
                    width="14"
                    fill="var(--slate12)"
                    className={isLoadingBranches ? 'rotating' : ''}
                  />
                  <span>Fetch PRs</span>
                </button>
              </div>
            )}

            {/* Empty state */}
            {allBranches.length === 0 && !isLoadingBranches && (
              <div className="empty-state" data-cy="branches-empty-state">
                <div className="empty-state-icon">
                  <SolidIcon name="gitbranch" width="48" fill="var(--slate8)" />
                </div>
                <p className="empty-state-text">No branches yet</p>
                <p className="empty-state-subtext">Create your first branch to get started</p>
              </div>
            )}

            {/* Loading state */}
            {isLoadingBranches && (
              <div className="loading-state" data-cy="branches-loading-state">
                <div className="spinner"></div>
                <span>Loading branches...</span>
              </div>
            )}
          </div>

          {/* Branch list */}
          {!isLoadingBranches && allBranches.length > 0 && (
            <div className="branches-list" data-cy="branches-list">
              {/* Master branch section */}
              {masterBranch && (
                <div className="branch-section">
                  <div className="section-label">Master Branch</div>
                  <div
                    className={`branch-item ${currentBranch?.name === masterBranch.name ? 'active' : ''}`}
                    onClick={() => handleBranchClick(masterBranch)}
                    data-cy={`branch-item-${masterBranch.name}`}
                  >
                    <div className="branch-item-content">
                      <div className="branch-name">
                        <SolidIcon name="circledot" width="14" fill="var(--slate12)" />
                        <span>{masterBranch.name}</span>
                      </div>
                      <div className="branch-metadata">
                        {isBranchLocked(masterBranch) && (
                          <SolidIcon name="lockclosed" width="14" fill="var(--amber10)" className="branch-lock-icon" />
                        )}
                        {masterBranch.updated_at && (
                          <span className="branch-updated">{getRelativeTime(masterBranch.updated_at)}</span>
                        )}
                        {getPRBadge(getPRForBranch(masterBranch.name))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-branches section */}
              {subBranches.length > 0 && (
                <div className="branch-section">
                  <div className="section-label">Feature Branches</div>
                  {subBranches.map((branch) => {
                    const pr = getPRForBranch(branch.name);
                    const isExpanded = expandedBranches.has(branch.name);
                    const isActive = currentBranch?.name === branch.name;

                    return (
                      <div key={branch.name} className="branch-group">
                        <div
                          className={`branch-item ${isActive ? 'active' : ''}`}
                          data-cy={`branch-item-${branch.name}`}
                        >
                          <div className="branch-item-content" onClick={() => handleBranchClick(branch)}>
                            <div className="branch-name">
                              {branch.has_versions && (
                                <button
                                  className="expand-icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBranchExpand(branch.name);
                                  }}
                                  data-cy={`expand-branch-${branch.name}`}
                                >
                                  <SolidIcon
                                    name="chevrondownsmall"
                                    width="12"
                                    fill="var(--slate11)"
                                    className={isExpanded ? 'expanded' : ''}
                                  />
                                </button>
                              )}
                              <SolidIcon name="circledot" width="14" fill="var(--slate12)" />
                              <span>{branch.name}</span>
                            </div>
                            <div className="branch-metadata">
                              {isBranchLocked(branch) && (
                                <SolidIcon
                                  name="lockclosed"
                                  width="14"
                                  fill="var(--amber10)"
                                  className="branch-lock-icon"
                                />
                              )}
                              {branch.updated_at && (
                                <span className="branch-updated">{getRelativeTime(branch.updated_at)}</span>
                              )}
                              {getPRBadge(pr)}
                            </div>
                          </div>
                        </div>

                        {/* Nested versions (if expanded) */}
                        {isExpanded && branch.versions && branch.versions.length > 0 && (
                          <div className="nested-versions">
                            {branch.versions.map((version) => (
                              <div key={version.id} className="version-item" data-cy={`version-item-${version.name}`}>
                                <div className="version-name">
                                  <span className="version-label">{version.name}</span>
                                  {version.is_draft && <span className="draft-badge">Draft</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="branch-dropdown-footer">
            <button
              className="create-branch-btn accent"
              onClick={() => {
                setShowDropdown(false);
                setShowCreateModal(true);
              }}
              data-cy="create-branch-btn"
            >
              <SolidIcon name="plusicon" width="14" fill="var(--indigo9)" />
              <span>Create new branch</span>
            </button>
            {allBranches.length > 0 && (
              <button className="switch-branch-btn" onClick={() => setShowDropdown(false)} data-cy="switch-branch-btn">
                <SolidIcon name="refresh" width="14" fill="var(--slate12)" />
                <span>Switch branch</span>
              </button>
            )}
          </div>
        </div>
      )}

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
    </div>
  );
}
