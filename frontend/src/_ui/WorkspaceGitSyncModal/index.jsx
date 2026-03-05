import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import Modal from 'react-bootstrap/Modal';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
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

export function WorkspaceGitSyncModal({ isOnDefaultBranch, onClose }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [commitMessage, setCommitMessage] = useState('');
  const [activeTab, setActiveTab] = useState('push');
  const [checkingForUpdate, setCheckingForUpdate] = useState({
    visible: true,
    message: 'Check for updates',
    status: UPDATE_STATUS.NONE,
  });
  const [latestCommitData, setLatestCommitData] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');

  const { orgGitConfig, branches, isPushing, isPulling } = useWorkspaceBranchesStore((state) => ({
    orgGitConfig: state.orgGitConfig,
    branches: state.branches || [],
    isPushing: state.isPushing,
    isPulling: state.isPulling,
  }));
  const actions = useWorkspaceBranchesStore((state) => state.actions);

  const repoUrl = orgGitConfig?.repo_url || orgGitConfig?.repoUrl || '';
  const defaultGitBranch = orgGitConfig?.default_git_branch || orgGitConfig?.defaultGitBranch || 'main';
  const gitType = orgGitConfig?.git_type || orgGitConfig?.gitType || 'github_https';

  const gitSyncUrl = (() => {
    if (gitType === 'gitlab') return repoUrl;
    if (gitType === 'github_ssh') {
      const match = repoUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
      return match ? `https://github.com/${match[1]}` : repoUrl;
    }
    return repoUrl;
  })();

  // Set initial selected branch
  useEffect(() => {
    if (!selectedBranch && defaultGitBranch) {
      setSelectedBranch(defaultGitBranch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultGitBranch]);

  // Re-check when selected branch changes (only if we already have results)
  useEffect(() => {
    if (selectedBranch && checkingForUpdate?.status === UPDATE_STATUS.AVAILABLE) {
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

    actions
      .checkForUpdates(selectedBranch || defaultGitBranch)
      .then((data) => {
        if (data?.latestCommit) {
          setLatestCommitData(data.latestCommit);
          setCheckingForUpdate({
            visible: false,
            message: '',
            status: UPDATE_STATUS.AVAILABLE,
          });
        } else {
          setLatestCommitData(null);
          setCheckingForUpdate({
            visible: true,
            message: 'Workspace is up to date with latest changes',
            status: UPDATE_STATUS.UNAVAILABLE,
          });
        }
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
      toast.success('Changes pushed successfully');
      onClose();
    } catch (error) {
      toast.error(error?.message || 'Push failed');
    }
  };

  const handlePull = async () => {
    try {
      await actions.pullWorkspace();
      toast.success('Changes pulled successfully');
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error(error?.message || 'Pull failed');
    }
  };

  const togglePushModal = () => setActiveTab('push');
  const togglePullModal = () => setActiveTab('pull');

  // ---- Pull section content (shared between pull-only and pushpull pull tab) ----
  const renderPullSection = () => (
    <div className="pull-section">
      <form noValidate className="d-flex align-items-center justify-content-center w-100">
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
                options={branches.reduce((acc, branch) => {
                  acc[branch.name] = {
                    value: branch.name,
                    label: branch.name,
                  };
                  return acc;
                }, {})}
                value={selectedBranch}
                onChange={setSelectedBranch}
                width="100%"
                theme={darkMode ? 'dark' : 'light'}
              />
            </div>

            {/* Latest commit info */}
            {latestCommitData && (
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
            )}
          </div>
        )}
      </form>
    </div>
  );

  // Push/Pull tabs — only rendered on feature branches
  const showPushPullHeader = () => (
    <div className="push-pull-tabs row mt-2" style={{ width: '350px' }}>
      <div className={`tab-push ${activeTab === 'push' ? 'active' : ''} text-center w-50`}>
        <button
          className={`btn w-100 py-2 ${activeTab === 'push' ? 'text-primary' : 'text-secondary'} border-0`}
          style={{
            color: activeTab === 'push' ? '#4368E3' : '',
            backgroundColor: darkMode ? '#1E2226' : '#FCFCFD',
          }}
          onClick={togglePushModal}
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
          onClick={togglePullModal}
        >
          <span className="push-icon" style={{ marginRight: '5px', fontWeight: '500' }}>
            <SolidIcon name="pull-changes" fill={activeTab === 'pull' ? '#4368E3' : '#ACB2B9'} />
          </span>
          <span style={{ fontWeight: activeTab === 'pull' ? '500' : 'normal' }}>Pull</span>
        </button>
      </div>
    </div>
  );

  // --- PULL-only modal body (default branch) ---
  const renderPullOnlyBody = () => <div className="pull-container">{renderPullSection()}</div>;

  // --- PUSHPULL modal body (feature branch) ---
  const renderPushPullBody = () => (
    <div className="pushpull-container">
      {activeTab === 'push' && (
        <form noValidate>
          <div className="push-section mb-4">
            <div className="d-flex flex-column w-100 align-items-center">
              <div className="form-group mb-5 w-100">
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
            </div>
          </div>
        </form>
      )}

      {activeTab === 'pull' && renderPullSection()}
    </div>
  );

  const renderModalFooter = () => {
    if (isOnDefaultBranch) {
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
    return (
      <Modal.Footer>
        <ButtonSolid variant="tertiary" onClick={onClose} disabled={isPushing || isPulling}>
          Cancel
        </ButtonSolid>
        {activeTab === 'push' && (
          <ButtonSolid
            variant="primary"
            onClick={handlePush}
            disabled={isPushing || !commitMessage.trim()}
            isLoading={isPushing}
            leftIcon="commit"
            fill="var(--indigo1)"
            iconWidth="20"
          >
            Commit changes
          </ButtonSolid>
        )}
        {activeTab === 'pull' && (
          <ButtonSolid
            variant="primary"
            onClick={handlePull}
            disabled={checkingForUpdate?.status !== UPDATE_STATUS.AVAILABLE || isPulling}
            isLoading={isPulling}
          >
            Pull changes
          </ButtonSolid>
        )}
      </Modal.Footer>
    );
  };

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
        <Modal.Title className={cx('font-weight-500', { 'mt-3': !isOnDefaultBranch })} data-cy="modal-title">
          <div className="git-sync-title row align-items-center" style={{ width: '350px' }}>
            <div className="col-9">Commit</div>
            <div onClick={onClose} className="col-3 text-end cursor-pointer" data-cy="modal-close-button">
              <SolidIcon name="remove" width="20" />
            </div>
            {gitSyncUrl && (
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
          {!isOnDefaultBranch && showPushPullHeader()}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{isOnDefaultBranch ? renderPullOnlyBody() : renderPushPullBody()}</Modal.Body>
      {renderModalFooter()}
    </Modal>
  );
}

export default WorkspaceGitSyncModal;
