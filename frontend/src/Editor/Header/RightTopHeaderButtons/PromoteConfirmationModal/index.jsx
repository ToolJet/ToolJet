import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import { capitalize } from 'lodash';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { appVersionService, gitSyncService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import ArrowRightIcon from '@assets/images/icons/arrow-right.svg';
import '@/_styles/versions.scss';
import { useAppInfo } from '@/_stores/appDataStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useEnvironmentsAndVersionsStore } from '@/_stores/environmentsAndVersionsStore';
import { shallow } from 'zustand/shallow';

export default function EnvironmontConfirmationModal(props) {
  const { data, editingVersion, appEnvironmentChanged, onClose } = props;
  const [promtingEnvirontment, setPromtingEnvirontment] = useState(false);
  const darkMode = props.darkMode ?? (localStorage.getItem('darkMode') === 'true' || false);
  const [showModal, setShow] = useState(data);
  const { t } = useTranslation();
  const { current_organization_id } = authenticationService.currentSessionValue;

  const { promoteAppVersionAction } = useEnvironmentsAndVersionsStore(
    (state) => ({
      promoteAppVersionAction: state.actions.promoteAppVersionAction,
    }),
    shallow
  );

  useEffect(() => {
    setShow(data);
  }, [data]);

  const handleClose = () => {
    if (promtingEnvirontment) return;
    onClose();
    setShow(false);
  };

  const handleConfirm = () => {
    setPromtingEnvirontment(true);

    promoteAppVersionAction(
      editingVersion?.id,
      async (response) => {
        toast.success(`${editingVersion.name} has been promoted to ${data.target.name}!`);
        if (data?.current?.name == 'development') {
          try {
            const gitData = await gitSyncService.getAppConfig(current_organization_id, editingVersion?.id);
            const appGit = gitData?.app_git;
            if (appGit && appGit?.org_git?.auto_commit) {
              const body = {
                gitAppName: appGit?.git_app_name,
                versionId: editingVersion?.id,
                lastCommitMessage: ` ${editingVersion.name} Version of app ${appGit?.git_app_name} promoted from development to staging`,
                gitVersionName: editingVersion?.name,
              };
              await gitSyncService.gitPush(body, appGit?.id, editingVersion?.id);
              toast.success('Changes committed successfully');
            }
          } catch (err) {
            const status = err?.statusCode;
            const error = err?.error;
            if (!(status === 404 && error === 'Git Configuration not found')) {
              toast.error(err?.error);
            }
          }
        }
        appEnvironmentChanged(response, true);
        setPromtingEnvirontment(false);
        onClose();
      },
      (error) => {
        console.error(error);
        toast.error(`${editingVersion.name} could not be promoted to ${data.target.name}. Please try again!`);
        setPromtingEnvirontment(false);
      }
    );
  };

  if (!editingVersion) return null;

  return (
    <Modal
      show={showModal}
      onHide={handleClose}
      size="sm"
      animation={false}
      centered={true}
      contentClassName={`promote-confirm-dialogue-modal ${darkMode ? 'dark-theme' : ''}`}
    >
      <Modal.Header>
        <Modal.Title className={`confirmation-header ${darkMode ? 'dark-theme' : ''}`} data-cy="modal-title">
          Promote {editingVersion.name}
        </Modal.Title>
        <svg
          onClick={handleClose}
          className="cursor-pointer"
          width="33"
          height="33"
          viewBox="0 0 33 33"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          data-cy="close-button"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.5996 11.6201C11.8599 11.3597 12.282 11.3597 12.5424 11.6201L16.071 15.1487L19.5996 11.6201C19.8599 11.3597 20.282 11.3597 20.5424 11.6201C20.8027 11.8804 20.8027 12.3025 20.5424 12.5629L17.0138 16.0915L20.5424 19.6201C20.8027 19.8804 20.8027 20.3025 20.5424 20.5629C20.282 20.8232 19.8599 20.8232 19.5996 20.5629L16.071 17.0343L12.5424 20.5629C12.282 20.8232 11.8599 20.8232 11.5996 20.5629C11.3392 20.3025 11.3392 19.8804 11.5996 19.6201L15.1282 16.0915L11.5996 12.5629C11.3392 12.3025 11.3392 11.8804 11.5996 11.6201Z"
            fill={`var(--slate12)`}
          />
        </svg>
      </Modal.Header>

      <Modal.Body className="env-confirm-dialogue-body">
        <div className={`change-info ${darkMode ? 'theme-dark' : ''}`}>
          <div className="section">
            <div className="label" data-cy="from-label">
              FROM
            </div>
            <div className="env-name" data-cy="current-env-name">
              {capitalize(data?.current.name)}
            </div>
          </div>
          <div className="arrow-container">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M0.942841 0.344988C0.673302 0.560619 0.629601 0.953927 0.845232 1.22347L3.86622 4.9997L0.845232 8.77593C0.629601 9.04547 0.673301 9.43878 0.94284 9.65441C1.21238 9.87004 1.60569 9.82634 1.82132 9.5568L5.15465 5.39013C5.33726 5.16187 5.33726 4.83753 5.15465 4.60926L1.82132 0.442596C1.60569 0.173058 1.21238 0.129357 0.942841 0.344988Z"
                fill="#11181C"
              />
            </svg>
          </div>
          <div className="section">
            <div className="label" data-cy="to-label">
              TO
            </div>
            <div className="env-name" data-cy="target-env-name">
              {capitalize(data?.target.name)}
            </div>
          </div>
        </div>
        {data?.current.name === 'development' && (
          <div className="env-change-info" data-cy="env-change-info-text">
            You won’t be able to edit this version after promotion. Are you sure you want to continue?
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="mt-3 env-modal-footer">
        <ButtonSolid variant="tertiary" onClick={handleClose} data-cy="cancel-button">
          {t('globals.cancel', 'Cancel')}
        </ButtonSolid>
        <ButtonSolid
          variant="primary"
          onClick={handleConfirm}
          isLoading={promtingEnvirontment}
          data-cy="promote-button"
        >
          Promote <ArrowRightIcon />
        </ButtonSolid>
      </Modal.Footer>
    </Modal>
  );
}
