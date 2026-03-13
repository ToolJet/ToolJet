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
import Dropdown from '@/components/ui/Dropdown/Index.jsx';
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
  const [selectedBranch, setSelectedBranch] = useState('');
  const [pullAction, setPullAction] = useState('import');
  const [actionChoiceMode, setActionChoiceMode] = useState(false);

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

  // Fetch latest commit for push/commit section
  useEffect(() => {
    if (activeTab === 'push' && defaultGitBranch && !pushLatestCommitData && !pushLatestCommitLoading) {
      setPushLatestCommitLoading(true);
      actions
        .checkForUpdates(defaultGitBranch)
        .then((data) => {
          setPushLatestCommitData(data?.latestCommit || null);
        })
        .catch(() => {
          setPushLatestCommitData(null);
        })
        .finally(() => {
          setPushLatestCommitLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, defaultGitBranch]);

  // Re-check when selected branch changes (only if we already have results and not in action choice)
  useEffect(() => {
    if (selectedBranch && checkingForUpdate?.status === UPDATE_STATUS.AVAILABLE && !actionChoiceMode) {
      checkForUpdates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

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
    // If selected branch differs from current, show action choice
    if (branchName !== currentBranchName) {
      setPullAction('import');
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
      toast.error(error?.error || error?.message || 'Import failed');
    }
  };

  // Build a PR/merge URL to merge sourceBranch into targetBranch on the git provider
  const buildMergeUrl = (sourceBranch, targetBranch) => {
    const url = repoUrl || gitSyncUrl;
    if (!url) return null;

    const githubMatch = url.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
    const gitlabMatch = url.match(/gitlab\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
    const bitbucketMatch = url.match(/bitbucket\.org[:/]([^/]+)\/(.+?)(?:\.git)?$/);

    if (githubMatch) {
      const [, owner, repo] = githubMatch;
      return `https://github.com/${owner}/${repo}/compare/${targetBranch}...${sourceBranch}?expand=1`;
    } else if (gitlabMatch) {
      const [, owner, repo] = gitlabMatch;
      return `https://gitlab.com/${owner}/${repo}/-/merge_requests/new?merge_request[source_branch]=${sourceBranch}&merge_request[target_branch]=${targetBranch}`;
    } else if (bitbucketMatch) {
      const [, owner, repo] = bitbucketMatch;
      return `https://bitbucket.org/${owner}/${repo}/pull-requests/new?source=${sourceBranch}&dest=${targetBranch}`;
    }
    return null;
  };

  const handleOverwritePull = async () => {
    // Open PR/merge page on git provider instead of doing a local overwrite pull.
    // The user merges on git, then pulls normally — this keeps local and git in sync.
    const mergeUrl = buildMergeUrl(selectedBranch, currentBranchName);
    if (mergeUrl) {
      window.open(mergeUrl, '_blank', 'noopener,noreferrer');
      toast.success('After merging on git, click Pull to update');
      onClose();
    } else {
      toast.error('Unable to determine repository URL');
    }
  };

  const handleContinue = async () => {
    if (pullAction === 'import') {
      await handleImportBranch();
    } else {
      await handleOverwritePull();
    }
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
    try {
      await actions.pushWorkspace(commitMessage);
      // toast.success('Changes pushed successfully');
      toast.success('Commit was pushed to git successfully!');
      onClose();
    } catch (error) {
      toast.error(error?.message || 'Push failed');
    }
  };

  const handlePull = async () => {
    try {
      await actions.pullWorkspace();
      //toast.success('Changes pulled successfully');
      toast.success('Commit pulled successfully!');
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error(error?.message || 'Pull failed');
    }
  };

  // Use remote branches for dropdown, fall back to local branches
  const dropdownBranches = remoteBranches.length > 0 ? remoteBranches : branches;

  // ---- Action choice view (Import vs Pull into current branch) ----
  const renderActionChoice = () => (
    <div className="action-choice-section">
      <label
        className={cx('action-choice-option', { active: pullAction === 'import' })}
        onClick={() => setPullAction('import')}
      >
        <input
          type="radio"
          name="pullAction"
          value="import"
          checked={pullAction === 'import'}
          onChange={() => setPullAction('import')}
        />
        <div className="option-content">
          <div className="option-title">Import as new branch</div>
          <div className="option-description">Imports {selectedBranch} branch in ToolJet with the latest commit</div>
        </div>
      </label>
      <label
        className={cx('action-choice-option', { active: pullAction === 'overwrite' })}
        onClick={() => setPullAction('overwrite')}
      >
        <input
          type="radio"
          name="pullAction"
          value="overwrite"
          checked={pullAction === 'overwrite'}
          onChange={() => setPullAction('overwrite')}
        />
        <div className="option-content">
          <div className="option-title">Pull into current branch</div>
          <div className="option-description">Overwrites changes on current branch</div>
        </div>
      </label>
    </div>
  );

  // ---- Pull section content ----
  const renderPullSection = () => (
    // <div className="pull-section">
       <div className={cx('pull-section', { 'pull-section--centered': checkingForUpdate?.status !== UPDATE_STATUS.AVAILABLE })}>
      <form
        noValidate
        className={`d-flex w-100 ${
          checkingForUpdate?.status === UPDATE_STATUS.AVAILABLE
            ? 'align-items-start justify-content-start'
            : 'align-items-center justify-content-center'
        }`}
      >
        {/* Check for updates button */}
        {checkingForUpdate?.visible && (
          <div className="form-group mb-3">
            <div onClick={() => checkForUpdates()} className="check-for-updates cursor-pointer">
              {checkingForUpdate?.status === UPDATE_STATUS.FETCHING ? (
                <div className="loader-container">
                  <div className="primary-spin-loader"></div>
                </div>
              ) : (
                <SolidIcon name={checkingForUpdate?.status === UPDATE_STATUS.UNAVAILABLE ? 'tick' : 'gitsync'} />
              )}
              <div className="font-weight-500 tj-text-xsm" data-cy="check-for-updates-label">
                {checkingForUpdate?.message}
              </div>
            </div>
          </div>
        )}

        {/* Updates available: branch dropdown + commit info */}
        {checkingForUpdate?.status === UPDATE_STATUS.AVAILABLE && (
          <div className="d-flex flex-column align-items-center justify-content-center w-100">
            <div className="form-group mb-3 w-100">
              <Dropdown
                label="Select branch to pull from"
                options={dropdownBranches.reduce((acc, branch) => {
                  acc[branch.name] = {
                    value: branch.name,
                    label: branch.name,
                  };
                  return acc;
                }, {})}
                value={selectedBranch}
                onChange={handleBranchChange}
                width="100%"
                theme={darkMode ? 'dark' : 'light'}
              />
            </div>

            {/* Latest commit info or up-to-date message */}
            {latestCommitData ? (
              <div className="w-100">
                <div className="selected-commit-header">LATEST COMMIT</div>
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
                        {latestCommitData.message || 'No message'}
                      </OverflowTooltip>
                      <div className="commit-metadata">
                        By {latestCommitData.author || 'Unknown'} | {formatCommitDate(latestCommitData.date)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-commits-empty-state w-100">
                <SolidIcon name="tick" />
                <div className="empty-state-content">
                  <div className="empty-state-title">Up to date</div>
                  <div className="empty-state-description">
                    Workspace is up to date with the latest changes on this branch
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );

  // ---- Push section content ----
  const renderPushSection = () => (
    <form noValidate>
      <div className="push-section mb-4">
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
          {pushLatestCommitLoading && (
            <div className="d-flex justify-content-center w-100 mt-2">
              <div className="loader-container">
                <div className="primary-spin-loader"></div>
              </div>
            </div>
          )}

          {!pushLatestCommitLoading && pushLatestCommitData && (
            <div className="w-100 mt-2">
              <div className="selected-commit-header">LATEST COMMIT</div>
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
                      {pushLatestCommitData.message || 'No message'}
                    </OverflowTooltip>
                    <div className="commit-metadata">
                      By {pushLatestCommitData.author || 'Unknown'} | {formatCommitDate(pushLatestCommitData.date)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!pushLatestCommitLoading && !pushLatestCommitData && (
            <div className="no-commits-empty-state w-100 mt-2">
              <div className="empty-state-content">
                <div className="empty-state-title">No commits yet</div>
                <div className="empty-state-description">This will be your first commit to the repository.</div>
              </div>
            </div>
          )}
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
          onClick={() => setActiveTab('push')}
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
          onClick={() => setActiveTab('pull')}
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
        return <div className="pull-container">{renderActionChoice()}</div>;
      }
      return <div className="pull-container">{renderPullSection()}</div>;
    }

    // Feature branch: push/pull tabs
    if (activeTab === 'pull') {
      if (actionChoiceMode) {
        return <div className="pushpull-container">{renderActionChoice()}</div>;
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
            >
              Cancel
            </ButtonSolid>
            <ButtonSolid variant="primary" onClick={handleContinue} disabled={isPulling} isLoading={isPulling}>
              Continue
            </ButtonSolid>
          </Modal.Footer>
        );
      }
      return (
        <Modal.Footer>
          <ButtonSolid variant="tertiary" onClick={onClose} disabled={isPulling}>
            Cancel
          </ButtonSolid>
          <ButtonSolid
            variant="primary"
            onClick={handlePull}
            disabled={checkingForUpdate?.status !== UPDATE_STATUS.AVAILABLE || isPulling}
            isLoading={isPulling}
          >
            Pull changes
          </ButtonSolid>
        </Modal.Footer>
      );
    }
    // Push tab active
    return (
      <Modal.Footer>
        <ButtonSolid variant="tertiary" onClick={onClose} disabled={isPushing}>
          Cancel
        </ButtonSolid>
        <ButtonSolid
          variant="primary"
          onClick={handlePush}
          disabled={isPushing || !commitMessage.trim()}
          isLoading={isPushing}
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
      return `Import ${selectedBranch} from git`;
    }
    if (isOnDefaultBranch) return 'Pull Commit';
    return activeTab === 'pull' ? 'Pull Commit' : 'Push Commit';
  })();

  return (
    <Modal
      backdrop="static"
      show={true}
      onHide={onClose}
      size="sm"
      centered={true}
      contentClassName={cx('git-sync-modal', {
        'theme-dark dark-theme': darkMode,
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
  );
}

export default WorkspaceGitSyncModal;
