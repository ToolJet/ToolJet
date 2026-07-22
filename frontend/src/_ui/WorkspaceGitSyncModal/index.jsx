import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import Modal from 'react-bootstrap/Modal';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { workspaceBranchesService } from '@/_services/workspace_branches.service';
import { setActiveBranch } from '@/_helpers/active-branch';
import { toast } from 'react-hot-toast';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { PullConflictModal } from '@/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal';
import Dropdown from '@/components/ui/Dropdown/Index.jsx';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import './WorkspaceGitSyncModal.scss';

const UPDATE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  FETCHING: 'FETCHING',
  NONE: 'NONE',
};

export function WorkspaceGitSyncModal({ isOnDefaultBranch, initialTab = 'push', onClose }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [commitMessage, setCommitMessage] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [checkingForUpdate, setCheckingForUpdate] = useState({
    visible: true,
    message: 'Check for updates',
    status: UPDATE_STATUS.NONE,
  });
  const [latestCommitData, setLatestCommitData] = useState(null);
  const [pushLatestCommitData, setPushLatestCommitData] = useState(null);
  const [pushLatestCommitLoading, setPushLatestCommitLoading] = useState(false);
  const [latestCommit, setLatestCommit] = useState(null);
  const [isLatestCommitLoading, setIsLatestCommitLoading] = useState(false);
  const [latestCommitFetched, setLatestCommitFetched] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [actionChoiceMode, setActionChoiceMode] = useState(false);
  const [pullConflictGroups, setPullConflictGroups] = useState(null);

  const { orgGitConfig, branches, remoteBranches, currentBranch, isPushing, isPulling } = useWorkspaceBranchesStore(
    (state) => ({
      orgGitConfig: state.orgGitConfig,
      branches: state.branches || [],
      remoteBranches: state.remoteBranches || [],
      currentBranch: state.currentBranch,
      isPushing: state.isPushing,
      isPulling: state.isPulling,
    })
  );
  const actions = useWorkspaceBranchesStore((state) => state.actions);

  const repoUrl = orgGitConfig?.repo_url || orgGitConfig?.repoUrl || '';
  const defaultGitBranch = orgGitConfig?.default_git_branch || orgGitConfig?.defaultGitBranch || 'main';
  const gitType = orgGitConfig?.git_type || orgGitConfig?.gitType || 'github_https';
  const currentBranchName = currentBranch?.name || defaultGitBranch;

  const gitSyncUrl = (() => {
    if (gitType === 'gitlab') return repoUrl;
    if (gitType === 'github_ssh') {
      const match = repoUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
      return match ? `https://github.com/${match[1]}` : repoUrl;
    }
    return repoUrl;
  })();

  // Set initial selected branch to current branch
  useEffect(() => {
    if (!selectedBranch && currentBranchName) {
      setSelectedBranch(currentBranchName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBranchName]);

  // Populate remote branches on mount so the pull dropdown has up-to-date options
  useEffect(() => {
    actions.fetchRemoteBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push auto-fetch replaced by onViewLatestCommit (user-triggered)
  // useEffect(() => {
  //   if (activeTab === 'push' && defaultGitBranch && !pushLatestCommitData && !pushLatestCommitLoading) { ... }
  // }, [activeTab, defaultGitBranch]);

  // Re-check when selected branch changes (only if we already have results and not in action choice)
  useEffect(() => {
    if (selectedBranch && checkingForUpdate?.status === UPDATE_STATUS.AVAILABLE && !actionChoiceMode) {
      checkForUpdates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Enter' || isPushing || isPulling) return;
      if (activeTab === 'push' && commitMessage.trim()) {
        handlePush();
      } else if (activeTab === 'pull' && checkingForUpdate?.status === UPDATE_STATUS.AVAILABLE && !actionChoiceMode) {
        handlePull();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, commitMessage, isPushing, isPulling, checkingForUpdate, actionChoiceMode]);

  const checkForUpdates = () => {
    setCheckingForUpdate({
      visible: true,
      message: 'Checking...',
      status: UPDATE_STATUS.FETCHING,
    });

    // Fetch remote branches and check for updates in parallel
    Promise.all([actions.checkForUpdates(selectedBranch || currentBranchName), actions.fetchRemoteBranches()])
      .then(([data]) => {
        setLatestCommitData(data?.latestCommit || null);
        // Always show dropdown after check, regardless of whether updates exist
        setCheckingForUpdate({
          visible: false,
          message: '',
          status: UPDATE_STATUS.AVAILABLE,
        });
      })
      .catch((error) => {
        toast.error(error?.error || error?.message || 'Failed to check for updates');
        setCheckingForUpdate({
          visible: true,
          message: 'Check for updates',
          status: UPDATE_STATUS.NONE,
        });
      });
  };

  const handleBranchChange = (branchName) => {
    setSelectedBranch(branchName);
    setLatestCommit(null);
    setLatestCommitFetched(false);
    // If selected branch differs from current, show confirmation
    if (branchName !== currentBranchName) {
      setActionChoiceMode(true);
    } else {
      setActionChoiceMode(false);
    }
  };

  const getAppIdFromUrl = () => {
    const match = window.location.pathname.match(/\/[^/]+\/apps\/([^/]+)/);
    return match ? match[1] : null;
  };

  const handleImportBranch = async () => {
    useWorkspaceBranchesStore.setState({ isPulling: true });
    try {
      // Check if branch already exists locally — if so, update it; if not, create it
      const existingBranch = branches.find((b) => b.name === selectedBranch);
      let branchId;

      if (existingBranch) {
        branchId = existingBranch.id;
      } else {
        const newBranch = await actions.createBranch(selectedBranch);
        branchId = newBranch.id;
      }

      // Switch to the target branch — pass appId for co_relation_id resolution
      const appId = getAppIdFromUrl();
      const switchResult = await workspaceBranchesService.switchBranch(branchId, appId);

      // Also update localStorage + workspace store
      const branchObj = existingBranch || { id: branchId, name: selectedBranch };
      setActiveBranch(branchObj);
      useWorkspaceBranchesStore.setState({
        activeBranchId: branchId,
        currentBranch: branchObj,
      });

      // Pull from that branch (now active) — creates stubs for all apps
      await actions.pullWorkspace();

      toast.success(`Imported ${selectedBranch} successfully`);
      onClose();

      // Navigate based on whether the current app exists in the target branch
      const resolvedAppId = switchResult?.resolvedAppId || switchResult?.resolved_app_id;
      const pathParts = window.location.pathname.split('/');
      if (resolvedAppId && appId) {
        window.location.href = `/${pathParts[1]}/apps/${resolvedAppId}`;
      } else if (appId) {
        // Current app doesn't exist in that branch — go to homepage
        window.location.href = `/${pathParts[1]}`;
      } else {
        // Already on homepage — just reload
        window.location.reload();
      }
    } catch (error) {
      if (error?.statusCode === 409) {
        try {
          const parsed = JSON.parse(error?.data?.message || error?.error || '{}');
          if (parsed?.conflictGroups?.length) {
            setPullConflictGroups(parsed.conflictGroups);
            return;
          }
        } catch {
          /* fall through to generic toast */
        }
      }
      toast.error(error?.error || error?.message || 'Import failed');
    } finally {
      useWorkspaceBranchesStore.setState({ isPulling: false });
    }
  };

  const handleContinue = async () => {
    await handleImportBranch();
  };

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

  const handleCommitChange = (e) => setCommitMessage(e.target.value);

  const handlePush = async () => {
    if (!commitMessage.trim()) {
      toast.error('Commit message is required');
      return;
    }
    const pushScope = window.location.pathname.includes('data-sources') ? 'datasource' : 'app';
    try {
      await actions.pushWorkspace(commitMessage, undefined, {}, pushScope);
      // toast.success('Changes pushed successfully');
      toast.success('Commit was pushed to git successfully!');
      onClose();
    } catch (error) {
      if (error?.statusCode === 409) {
        try {
          const parsed = JSON.parse(error?.data?.message || error?.error || '{}');
          if (parsed?.conflictGroups?.length) {
            setPullConflictGroups(parsed.conflictGroups);
            return;
          }
        } catch {
          /* fall through to generic toast */
        }
      }
      toast.error(error?.error || error?.message || 'Push failed');
    }
  };

  const handlePull = async () => {
    try {
      await actions.pullWorkspace();
      toast.success('Commit pulled successfully!');
      onClose();
      window.location.reload();
    } catch (error) {
      if (error?.statusCode === 409) {
        try {
          const parsed = JSON.parse(error?.data?.message || error?.error || '{}');
          if (parsed?.conflictGroups?.length) {
            setPullConflictGroups(parsed.conflictGroups);
            return;
          }
        } catch {
          /* fall through to generic toast */
        }
      }
      toast.error(error?.error || error?.message || 'Pull failed');
    }
  };

  // Use remote branches for dropdown, fall back to local branches
  const dropdownBranches = remoteBranches.length > 0 ? remoteBranches : branches;

  const branchExistsLocally = branches.some((b) => b.name === selectedBranch);

  // ---- Confirmation view for importing a different branch ----
  const renderImportConfirmation = () => (
    <div className="import-confirmation-section">
      <p>
        {branchExistsLocally ? (
          <>
            <strong>{selectedBranch}</strong> branch already exists in ToolJet. Pulling this will update it with the
            latest commit from git. Do you want to proceed?
          </>
        ) : (
          <>
            <strong>{selectedBranch}</strong> branch does not exist in ToolJet, pulling this will import it as a new
            branch with the latest commit. Do you want to proceed?
          </>
        )}
      </p>
    </div>
  );

  const onViewLatestCommit = () => {
    const branch = activeTab === 'push' ? currentBranchName : selectedBranch || currentBranchName;
    setIsLatestCommitLoading(true);
    actions
      .checkForUpdates(branch)
      .then((data) => {
        setLatestCommit(data?.latestCommit || null);
        setLatestCommitFetched(true);
      })
      .catch((error) => {
        toast.error(error?.error || error?.message || 'Failed to fetch latest commit');
        setLatestCommitFetched(false);
      })
      .finally(() => {
        setIsLatestCommitLoading(false);
      });
  };

  const resetLatestCommit = () => {
    setLatestCommit(null);
    setLatestCommitFetched(false);
  };

  // ---- Pull section content ----
  const renderPullSection = () => (
    <div className="pull-section">
      <form noValidate className="d-flex w-100 align-items-start justify-content-start">
        <div className="d-flex flex-column w-100" style={{ gap: '12px' }}>
          {/* PULL INTO */}
          <div className="import-in-row">
            <span className="tj-text-xsm font-weight-500 tj-text">Pull into</span>
            <span className="branch-name-badge">
              <SolidIcon name="gitbranch" width="14" fill="var(--indigo9)" />
              {currentBranchName}
            </span>
          </div>

          {/* PULL FROM */}
          <div className="form-group mb-0">
            <label
              className="mb-1 tj-text-xsm font-weight-500"
              style={{ color: 'var(--slate8)' }}
              data-cy="pull-from-label"
            >
              Pull from
            </label>
            <Dropdown
              data-cy="branch-select"
              options={{ [currentBranchName]: { value: currentBranchName, label: currentBranchName } }}
              value={currentBranchName}
              onChange={() => {}}
              width="100%"
              theme={darkMode ? 'dark' : 'light'}
              disabled={true}
            />
            <div className="tj-text-xxsm import-from-helper-text">Apps can only be pulled from the same branch</div>
          </div>

          {/* LATEST COMMIT */}
          <div className="w-100">
            <div className="selected-commit-header">LATEST COMMIT</div>
            {!latestCommitFetched && !isLatestCommitLoading && (
              <div onClick={onViewLatestCommit} className="latest-commit-placeholder cursor-pointer">
                <RefreshCcw width="14" height="14" />
                <span className="font-weight-500 tj-text-xsm" data-cy="view-latest-commit-label">
                  View latest commit
                </span>
              </div>
            )}
            {isLatestCommitLoading && (
              <div className="latest-commit-placeholder">
                <div className="primary-spin-loader" style={{ width: '18px', height: '18px' }}></div>
              </div>
            )}
            {latestCommitFetched && latestCommit && (
              <div className="d-flex w-100">
                <div className="selected-commit-info">
                  <div className="commit-icon">
                    <SolidIcon name="commit" width="20" />
                  </div>
                  <div className="commit-content">
                    <OverflowTooltip
                      className="commit-title"
                      whiteSpace="normal"
                      style={{
                        maxWidth: '100%',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {latestCommit.message || 'No message'}
                    </OverflowTooltip>
                    <div className="commit-metadata">
                      By {latestCommit.author || 'Unknown'} | {formatCommitDate(latestCommit.date)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {latestCommitFetched && !latestCommit && (
              <div className="no-commits-empty-state w-100">
                <AlertTriangle width="20" height="20" />
                <div className="empty-state-content">
                  <div className="empty-state-title">No commits yet</div>
                  <div className="empty-state-description">Sync apps to your git repo and never lose progress</div>
                </div>
              </div>
            )}
          </div>

          {/* INFO ALERT */}
          <div className="import-dependent-info-alert">
            <SolidIcon name="warning" width="16" fill="var(--indigo9)" />
            <span>
              The latest commit across <strong>all resources</strong> in this branch will be pulled
            </span>
          </div>
        </div>
      </form>
    </div>
  );

  // ---- Push section content ----
  const renderPushSection = () => (
    <form noValidate>
      <div className="push-section mb-2">
        <div className="d-flex flex-column w-100 align-items-start">
          <div className="form-group mb-2 w-100">
            <label className="mb-1 tj-text-xsm font-weight-500" data-cy="commit-message-label">
              Commit message
            </label>
            <div className="tj-app-input">
              <input
                onChange={handleCommitChange}
                type="text"
                value={commitMessage}
                placeholder="Briefly describe the changes you've made"
                className="form-control font-weight-400"
                data-cy="commit-message-input"
                autoFocus
              />
            </div>
          </div>

          <div className="w-100 mt-2">
            <div className="selected-commit-header">LATEST COMMIT</div>
            {!latestCommitFetched && !isLatestCommitLoading && (
              <div onClick={onViewLatestCommit} className="latest-commit-placeholder cursor-pointer">
                <RefreshCcw width="14" height="14" />
                <span className="font-weight-500 tj-text-xsm" data-cy="view-latest-commit-label">
                  View latest commit
                </span>
              </div>
            )}
            {isLatestCommitLoading && (
              <div className="latest-commit-placeholder">
                <div className="primary-spin-loader" style={{ width: '18px', height: '18px' }}></div>
              </div>
            )}
            {latestCommitFetched && latestCommit && (
              <div className="selected-commit-info w-100">
                <div className="commit-icon">
                  <SolidIcon name="commit" width="20" />
                </div>
                <div className="commit-content">
                  <OverflowTooltip
                    className="commit-title"
                    whiteSpace="normal"
                    style={{
                      maxWidth: '100%',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {latestCommit.message || 'No message'}
                  </OverflowTooltip>
                  <div className="commit-metadata">
                    By {latestCommit.author || 'Unknown'} | {formatCommitDate(latestCommit.date)}
                  </div>
                </div>
              </div>
            )}
            {latestCommitFetched && !latestCommit && (
              <div className="no-commits-empty-state w-100">
                <AlertTriangle width="20" height="20" />
                <div className="empty-state-content">
                  <div className="empty-state-title">No commits yet</div>
                  <div className="empty-state-description">This will be your first commit to the repository.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );

  // ---- Push/Pull tab header (feature branches only) ----
  const renderPushPullTabs = () => (
    <div className="push-pull-tabs row mt-2" style={{ width: '350px' }}>
      <div className={`tab-push ${activeTab === 'push' ? 'active' : ''} text-center w-50`}>
        <button
          className={`btn w-100 py-2 ${activeTab === 'push' ? 'text-primary' : 'text-secondary'} border-0`}
          style={{
            color: activeTab === 'push' ? '#4368E3' : '',
            backgroundColor: darkMode ? '#1E2226' : '#FCFCFD',
          }}
          onClick={() => {
            setActiveTab('push');
            resetLatestCommit();
          }}
        >
          <span className="push-icon" style={{ marginRight: '5px', fontWeight: '500' }}>
            <SolidIcon name="push-changes" fill={activeTab === 'push' ? '#4368E3' : '#ACB2B9'} />
          </span>
          <span style={{ fontWeight: activeTab === 'push' ? '500' : 'normal' }}>Push</span>
        </button>
      </div>
      <div className={`tab-pull ${activeTab === 'pull' ? 'active' : ''} text-center w-50`}>
        <button
          className={`btn w-100 py-2 ${activeTab === 'pull' ? 'text-primary' : 'text-secondary'} border-0`}
          style={{
            color: activeTab === 'pull' ? '#4368E3' : '',
            backgroundColor: darkMode ? '#1E2226' : '#FCFCFD',
          }}
          onClick={() => {
            setActiveTab('pull');
            resetLatestCommit();
          }}
        >
          <span className="push-icon" style={{ marginRight: '5px', fontWeight: '500' }}>
            <SolidIcon name="pull-changes" fill={activeTab === 'pull' ? '#4368E3' : '#ACB2B9'} />
          </span>
          <span style={{ fontWeight: activeTab === 'pull' ? '500' : 'normal' }}>Pull</span>
        </button>
      </div>
    </div>
  );

  // --- Modal body ---
  const renderModalBody = () => {
    // Default branch: pull-only
    if (isOnDefaultBranch) {
      if (actionChoiceMode) {
        return <div className="pull-container">{renderImportConfirmation()}</div>;
      }
      return <div className="pull-container">{renderPullSection()}</div>;
    }

    // Feature branch: push/pull tabs
    if (activeTab === 'pull') {
      if (actionChoiceMode) {
        return <div className="pushpull-container">{renderImportConfirmation()}</div>;
      }
      return <div className="pushpull-container">{renderPullSection()}</div>;
    }
    return <div className="pushpull-container">{renderPushSection()}</div>;
  };

  const renderModalFooter = () => {
    // Pull tab active (default branch or feature branch pull tab)
    if (activeTab === 'pull' || isOnDefaultBranch) {
      if (actionChoiceMode) {
        return (
          <Modal.Footer>
            <ButtonSolid
              variant="tertiary"
              onClick={() => {
                setActionChoiceMode(false);
                setSelectedBranch(currentBranchName);
              }}
              disabled={isPulling}
              data-cy="cancel-button"
            >
              Cancel
            </ButtonSolid>
            <ButtonSolid
              variant="primary"
              onClick={handleContinue}
              disabled={isPulling}
              isLoading={isPulling}
              data-cy="continue-button"
            >
              Continue
            </ButtonSolid>
          </Modal.Footer>
        );
      }
      return (
        <Modal.Footer>
          <ButtonSolid variant="tertiary" onClick={onClose} disabled={isPulling} data-cy="cancel-button">
            Cancel
          </ButtonSolid>
          <ButtonSolid
            variant="primary"
            onClick={handlePull}
            disabled={isPulling}
            isLoading={isPulling}
            data-cy="pull-button"
          >
            Pull commit
          </ButtonSolid>
        </Modal.Footer>
      );
    }
    // Push tab active
    return (
      <Modal.Footer>
        <ButtonSolid variant="tertiary" onClick={onClose} disabled={isPushing} data-cy="cancel-button">
          Cancel
        </ButtonSolid>
        <ButtonSolid
          variant="primary"
          onClick={handlePush}
          disabled={isPushing || !commitMessage.trim()}
          isLoading={isPushing}
          data-cy="commit-button"
          // leftIcon="commit"
          // fill="var(--indigo1)"
          // iconWidth="20"
        >
          Commit changes
        </ButtonSolid>
      </Modal.Footer>
    );
  };

  // Modal title changes based on mode
  const modalTitle = (() => {
    if (actionChoiceMode) {
      return branchExistsLocally ? `Update ${selectedBranch} from git` : `Import ${selectedBranch} from git`;
    }

    if (isOnDefaultBranch) return 'Pull Commit';
    return activeTab === 'pull' ? 'Pull Commit' : 'Push Commit';
  })();

  return (
    <>
      <Modal
        backdrop="static"
        show={true}
        onHide={onClose}
        size="sm"
        centered={true}
        contentClassName={cx('git-sync-modal', {
          'theme-dark dark-theme': darkMode,
          'pull-commit-expanded': activeTab === 'pull' || isOnDefaultBranch,
        })}
      >
        <Modal.Header>
          <Modal.Title
            className={cx('font-weight-500', { 'mt-3': !isOnDefaultBranch && !actionChoiceMode })}
            data-cy="modal-title"
          >
            <div className="git-sync-title row align-items-center" style={{ width: '350px' }}>
              <div className="col-9">{modalTitle}</div>
              <div onClick={onClose} className="col-3 text-end cursor-pointer" data-cy="modal-close-button">
                <SolidIcon name="remove" width="20" />
              </div>
              {gitSyncUrl && !actionChoiceMode && (
                <div
                  className="col-12 d-flex align-items-center"
                  style={{
                    color: 'var(--text-placeholder, #6A727C)',
                    fontSize: 'var(--size-default, 12px)',
                    fontWeight: 'var(--weight-regular, 400)',
                  }}
                >
                  <span className="me-1" style={{ textDecoration: 'none' }}>
                    in
                  </span>
                  <OverflowTooltip placement="bottom" style={{ maxWidth: '300px' }}>
                    <span className="helper-text">{gitSyncUrl}</span>
                  </OverflowTooltip>
                </div>
              )}
            </div>
            {/* {!isOnDefaultBranch && !actionChoiceMode && renderPushPullTabs()} */}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderModalBody()}</Modal.Body>
        {renderModalFooter()}
      </Modal>

      <PullConflictModal
        show={!!pullConflictGroups}
        conflictGroups={pullConflictGroups || []}
        onClose={() => setPullConflictGroups(null)}
      />
    </>
  );
}

export default WorkspaceGitSyncModal;
