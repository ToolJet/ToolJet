import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import Modal from 'react-bootstrap/Modal';
import moment from 'moment';
import { useLocation, useNavigate } from 'react-router-dom';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { authenticationService, gitSyncService, appVersionService } from '@/_services';
import toast from 'react-hot-toast';
import { getSubpath } from '@/_helpers/routes';
import ModalBase from '@/_ui/Modal';
import { useAppVersionStore } from '@/_stores/appVersionStore';

const MODAL_TYPE = {
  CONFIG: 'CONFIG',
  COMMIT: 'COMMIT',
  PULL: 'PULL',
};

const UPDATE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  FETCHING: 'FETCHING',
  NONE: 'NONE',
};

export default function GitSyncModal({
  showGitSyncModal,
  handleClose,
  app,
  isVersionReleased,
  featureAccess,
  setAppDefinitionFromVersion,
  creationMode,
}) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const editingVersion = useAppVersionStore.getState().editingVersion;
  const { state, pathname } = useLocation();
  const { commitEnabled, type } = state ?? {};
  const navigate = useNavigate();
  const { admin, current_organization_id, current_organization_slug } = authenticationService.currentSessionValue;
  const confirmBtnProps = {
    title: 'Continue',
    variant: modalToShow === MODAL_TYPE.COMMIT ? 'dangerPrimary' : 'primary',
  };

  const [commitMessage, setCommitMessage] = useState('');
  const [appGitData, setAppGitData] = useState(null);
  const [appPullData, setAppPullData] = useState(null);
  const [appGitLoading, setAppGitLoading] = useState(true);
  const [appPushLoading, setAppPushLoading] = useState(false);
  const [modalToShow, setModalToShow] = useState(MODAL_TYPE.CONFIG);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pullingChanges, setPullingChanges] = useState(false);
  const [checkingForUpdate, setCheckingForUpdate] = useState({
    visible: true,
    message: 'Check for update',
    status: UPDATE_STATUS.NONE,
  });

  const fetchAppGit = () => {
    setAppGitLoading(true);
    gitSyncService
      .getAppConfig(current_organization_id, editingVersion?.id)
      .then((data) => {
        creationMode === 'GIT' ? setModalToShow(MODAL_TYPE.PULL) : setModalToShow(MODAL_TYPE.COMMIT);
        setAppGitLoading(false);
        setAppGitData({ ...data?.app_git });
      })
      .catch((error) => {
        setAppGitLoading(false);
        if (error?.statusCode === 404) {
          setModalToShow(MODAL_TYPE.CONFIG);
        }
      });
  };

  const appGitPush = () => {
    const isDifferentVersion = appGitData?.git_version_id && editingVersion?.id !== appGitData?.git_version_id;
    if (isDifferentVersion && !showConfirmModal) {
      setShowConfirmModal(true);
      handleClose();
      return;
    }

    const body = {
      gitAppName: appGitData?.git_app_name,
      versionId: editingVersion?.id,
      lastCommitMessage: commitMessage ?? 'App creation',
      gitVersionName: editingVersion?.name,
    };
    setAppPushLoading(true);
    gitSyncService
      .gitPush(body, appGitData?.id, editingVersion?.id)
      .then((data) => {
        toast.success('Changes commited successfully');
      })
      .catch((error) => {
        toast.error(error?.error);
      })
      .finally(() => {
        if (!isDifferentVersion) {
          handleClose();
        } else {
          handleConfirmModalClose();
        }
        setCommitMessage('');
        setAppPushLoading(false);
      });
  };

  const appGitPull = () => {
    const isDifferentVersion =
      appPullData?.git_version_id && appPullData?.git_version_id !== appGitData?.git_version_id;

    if (isDifferentVersion && !showConfirmModal) {
      setShowConfirmModal(true);
      handleClose();
      return;
    }
    const { git_app_name, git_version_id, git_version_name, last_commit_message, last_commit_user, lastpush_date } =
      appPullData;

    const body = {
      gitAppName: git_app_name,
      gitVersionName: git_version_name,
      gitVersionId: git_version_id,
      lastCommitMessage: last_commit_message,
      lastCommitUser: last_commit_user,
      lastPushDate: lastpush_date,
    };
    setAppPushLoading(true);
    gitSyncService
      .confirmPullChanges(body, appGitData?.app_id)
      .then((data) => {
        handleClose();
        const appData = data?.app;
        appVersionService
          .getAppVersionData(appData.id, appData.editing_version.id)
          .then((appV2) => {
            setAppDefinitionFromVersion(appV2);
            toast.success('App changes pulled successfully');
          })
          .catch((error) => {
            toast.error(error);
          });
      })
      .catch((error) => {
        toast.error(error?.error);
      });
  };

  const handleCommitChange = (event) => setCommitMessage(event.target.value);

  const handleGitConfigRoute = () => {
    handleClose();
    window.open(
      getSubpath()
        ? `${getSubpath()}/${
            current_organization_slug ? current_organization_slug : current_organization_id
          }/workspace-settings/configure-git`
        : `${
            current_organization_slug ? current_organization_slug : current_organization_id
          }/workspace-settings/configure-git`,
      '_blank'
    );
  };

  const insideHandleClose = () => {
    setCommitMessage('');
    handleClose();
  };

  const handleConfirmModalClose = () => setShowConfirmModal(!showConfirmModal);

  const checkForUpdates = () => {
    setCheckingForUpdate({ visible: true, message: 'Checking...', status: UPDATE_STATUS.FETCHING });
    gitSyncService
      .checkForUpdates(appGitData?.app_id)
      .then((data) => {
        setAppPullData(data?.meta_data);
        if (data?.meta_data?.lastpush_date !== appGitData?.last_push_date) {
          setCheckingForUpdate({ visible: false, message: '', status: UPDATE_STATUS.AVAILABLE });
        } else {
          setCheckingForUpdate({
            visible: true,
            message: 'App is up to date with latest changes',
            status: UPDATE_STATUS.UNAVAILABLE,
          });
        }
      })
      .catch((error) => {
        toast.error(error?.error);
        setCheckingForUpdate({ visible: true, message: 'Check for updates', status: UPDATE_STATUS.NONE });
      });
  };

  const generateModalFooter = () => {
    switch (modalToShow) {
      case MODAL_TYPE.COMMIT:
        return (
          !appGitLoading &&
          !commitEnabled && (
            <Modal.Footer>
              <ButtonSolid
                disabled={appPushLoading}
                variant={'tertiary'}
                onClick={insideHandleClose}
                data-cy="cancel-button"
              >
                Cancel
              </ButtonSolid>
              <ButtonSolid
                disabled={!commitMessage}
                isLoading={appPushLoading}
                variant={'primary'}
                onClick={appGitPush}
                data-cy="commit-button"
              >
                Commit changes
              </ButtonSolid>
            </Modal.Footer>
          )
        );
      case MODAL_TYPE.CONFIG:
        return <></>;
      case MODAL_TYPE.PULL:
        return (
          <Modal.Footer>
            <ButtonSolid
              disabled={appPushLoading}
              variant={'tertiary'}
              onClick={insideHandleClose}
              data-cy="cancel-button"
            >
              Cancel
            </ButtonSolid>
            <ButtonSolid
              disabled={checkingForUpdate?.status !== UPDATE_STATUS.AVAILABLE || !!generatePullErrorMessage()}
              isLoading={appPushLoading}
              variant={'primary'}
              onClick={appGitPull}
              data-cy="pull-button"
            >
              Pull changes
            </ButtonSolid>
          </Modal.Footer>
        );
    }
  };

  const generateModal = () => {
    switch (modalToShow) {
      case MODAL_TYPE.CONFIG:
        return (
          <div className="connect-to-repository-container">
            <SolidIcon name="gitsync" />
            <div className="tj-text tj-text-sm font-weight-500 my-2" data-cy="no-connection-yet-label">
              No connection yet
            </div>
            <div className="tj-text-xsm" data-cy="sync-app-helper-text">
              Sync applications to your git repository and never lose your progress!
            </div>
            {admin ? (
              <ButtonSolid
                onClick={handleGitConfigRoute}
                rightIcon="arrowright"
                variant="ghostBlue"
                className="mt-2"
                data-cy="connect-repo-button"
              >
                Connect to repository
              </ButtonSolid>
            ) : (
              <div className="tj-text-sm mt-1 font-weight-500" data-cy="contact-admin-helper-text">
                Contact admins to know more.
              </div>
            )}
          </div>
        );
      case MODAL_TYPE.COMMIT:
        return (
          <div className="create-commit-container">
            <form noValidate className="commit-form">
              <div className="form-group mb-3">
                <label className="mb-1 tj-text-xsm font-weight-500" data-cy="git-repo-url-label">
                  Git repo URL
                </label>
                <div className="tj-app-input">
                  <input
                    type="text"
                    className="form-control font-weight-400 disabled"
                    value={appGitData?.org_git?.git_url}
                    disabled={true}
                    readOnly={true}
                    data-cy="git-repo-input"
                  />
                </div>
              </div>
              <div className="form-group mb-3">
                <label className="mb-1 tj-text-xsm font-weight-500" data-cy="commit-message-label">
                  Commit message
                </label>
                <div className="tj-app-input">
                  <input
                    onChange={handleCommitChange}
                    type="text"
                    value={commitMessage}
                    placeholder={`Briefly describe the changes you've made`}
                    className="form-control font-weight-400"
                    data-cy="commit-message-input"
                  />
                </div>
                {/* <div>
                  <div className="tj-text-xxsm info-text">Message must be unique and max 50 characters</div>
                </div> */}
              </div>
              <div className="form-group mb-3">
                <label className="mb-1 tj-text-xsm font-weight-500" data-cy="last-commit-label">
                  Last commit
                </label>
                <div className="last-commit-info form-control">
                  <div className="message-info">
                    <div data-cy="las-commit-message">{appGitData?.last_commit_message ?? 'No commits yet'}</div>
                    <div data-cy="last-commit-version">{appGitData?.git_version_name}</div>
                  </div>
                  <div className="author-info" data-cy="auther-info">
                    {appGitData?.last_commit_user
                      ? `Done by ${appGitData?.last_commit_user} at ${moment(
                          new Date(appGitData?.last_push_date)
                        ).format('DD MMM YYYY, h:mm a')}`
                      : 'Sync applications to your git repository and never lose progress!'}
                  </div>
                </div>
              </div>
            </form>
          </div>
        );
      case MODAL_TYPE.PULL:
        return (
          <div className="pull-container">
            <form noValidate>
              <div className="form-group mb-3">
                <label className="mb-1 tj-text-xsm font-weight-500" data-cy="git-repo-url-label">
                  Git repo URL
                </label>
                <div className="tj-app-input">
                  <input
                    type="text"
                    className="form-control font-weight-400 disabled"
                    value={appGitData?.org_git?.git_url}
                    disabled={true}
                    readOnly={true}
                    data-cy="git-repo-info"
                  />
                </div>
              </div>
              {checkingForUpdate?.visible && (
                <div className="form-group mb-3">
                  <div onClick={checkForUpdates} className="check-for-updates cursor-pointer">
                    {checkingForUpdate?.status === UPDATE_STATUS.FETCHING ? (
                      <div className="loader-container">
                        <div className="primary-spin-loader"></div>
                      </div>
                    ) : (
                      <SolidIcon name={checkingForUpdate?.status === UPDATE_STATUS.UNAVAILABLE ? 'tick' : 'gitsync'} />
                    )}
                    <div className="font-weight-500 tj-text-xsm">{checkingForUpdate?.message}</div>
                  </div>
                </div>
              )}
              {checkingForUpdate?.status === UPDATE_STATUS.AVAILABLE && (
                <>
                  <div className="form-group mb-3">
                    <label className="mb-1 tj-text-xsm font-weight-500">Update available</label>
                    <div
                      className={cx('last-commit-info form-control', {
                        'tj-input-error-state': !!generatePullErrorMessage(),
                      })}
                    >
                      <div className="message-info">
                        <div>{appPullData?.last_commit_message ?? 'No commits yet'}</div>
                        <div>{appPullData?.git_version_name}</div>
                      </div>
                      <div className="author-info">
                        {appPullData?.last_commit_user
                          ? `Done by ${appPullData?.last_commit_user} at ${moment(
                              new Date(appPullData?.lastpush_date)
                            ).format('DD MMM YYYY, h:mm a')}`
                          : 'Sync applications to your git repository and never lose progress!'}
                      </div>
                    </div>
                    <div className="mt-1">
                      <div className={cx('tj-text-xxsm info-text', { 'tj-input-error': generatePullErrorMessage() })}>
                        {generatePullErrorMessage()}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>
        );
      default:
        return <></>;
    }
  };

  const generatePullErrorMessage = () => {
    if (isVersionReleased && editingVersion?.id === appPullData?.git_version_id) {
      return 'This version is released, no new changes can be pulled';
    } else if (appPullData?.app_name_exist === 'EXIST' && app?.name !== appPullData?.git_app_name) {
      return 'App name already exists';
    } else {
      return '';
    }
  };

  useEffect(() => {
    if (featureAccess?.gitSync && ((editingVersion?.id && showGitSyncModal) || (commitEnabled && editingVersion?.id))) {
      fetchAppGit();
    }
    return () => {
      setCheckingForUpdate({ visible: true, message: 'Check for updates', status: UPDATE_STATUS.NONE });
    };
  }, [showGitSyncModal, editingVersion?.id]);

  useEffect(() => {
    if (appGitData && commitEnabled && editingVersion?.id) {
      const body = {
        gitAppName: appGitData.git_app_name,
        versionId: editingVersion?.id,
        lastCommitMessage: type === 'version' ? 'Version creation' : 'App creation',
        gitVersionName: editingVersion?.name,
      };
      setAppPushLoading(true);
      gitSyncService
        .gitPush(body, appGitData?.id, editingVersion?.id)
        .then((data) => {
          !type === 'version' && toast.success('App created successfully');
        })
        .catch((error) => {
          toast.error(error?.error);
        })
        .finally(() => {
          fetchAppGit();
          navigate(pathname, { replace: true });
          setCommitMessage('');
          setAppPushLoading(false);
        });
    }
  }, [appGitData, type]);

  const modalBody = generateModal();
  return (
    <>
      <Modal
        backdrop="static"
        show={showGitSyncModal}
        onHide={insideHandleClose}
        size="sm"
        centered={true}
        contentClassName={`${darkMode ? 'theme-dark dark-theme git-sync-modal' : 'git-sync-modal'}`}
      >
        <Modal.Header>
          <Modal.Title className="font-weight-500" data-cy="modal-title">
            GitSync
          </Modal.Title>
          <div onClick={insideHandleClose} className="cursor-pointer" data-cy="modal-close-button">
            <SolidIcon name="remove" width="20" />
          </div>
        </Modal.Header>
        <Modal.Body>
          {appGitLoading || commitEnabled ? (
            <div className="loader-container">
              <div className="primary-spin-loader"></div>
            </div>
          ) : (
            modalBody
          )}
        </Modal.Body>
        {generateModalFooter()}
      </Modal>
      <ModalBase
        show={showConfirmModal}
        handleClose={handleConfirmModalClose}
        darkMode={darkMode}
        title={modalToShow === MODAL_TYPE.COMMIT ? 'Commit changes' : 'Pull changes'}
        body={
          <div className="tj-text-sm">
            {modalToShow === MODAL_TYPE.COMMIT
              ? `Commiting changes to ${editingVersion?.name} will replace ${
                  modalToShow === MODAL_TYPE.COMMIT ? appGitData?.git_version_name : appPullData?.git_version_name
                } in the git repo. Are you sure you want to continue?`
              : `Pulling changes from git repository will create a new version ${appPullData?.git_version_name}. Are you sure you want to continue?`}
          </div>
        }
        confirmBtnProps={confirmBtnProps}
        handleConfirm={modalToShow === MODAL_TYPE.COMMIT ? appGitPush : appGitPull}
        isLoading={appPushLoading}
      />
    </>
  );
}
