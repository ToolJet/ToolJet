import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import _, { noop } from 'lodash';
import { validateName } from '@/_helpers/utils';
import { FormWrapper } from './FormWrapper';
import { PluginsListForAppModal } from './PluginsListForAppModal';

const APP_TYPE = {
  WORKFLOW: 'workflow',
  APP: 'app',
};

export function AppModal({
  closeModal,
  processApp,
  show,
  fileContent = null,
  templateDetails = null,
  selectedAppId = null,
  selectedAppName = null,
  title,
  actionButton,
  actionLoadingButton,
  fetchingOrgGit,
  orgGit,
  commitEnabled,
  handleCommitEnableChange,
  appType,
  dependentPluginsDetail = [],
  dependentPlugins = [],
}) {
  if (!selectedAppName && templateDetails) {
    selectedAppName = templateDetails?.name || '';
  } else if (!selectedAppName) {
    selectedAppName = '';
  }

  if (actionButton === 'Clone app') {
    if (selectedAppName.length >= 45) {
      selectedAppName = selectedAppName.slice(0, 45) + '_Copy';
    } else {
      selectedAppName = selectedAppName + '_Copy';
    }
  }

  const [newAppName, setNewAppName] = useState(selectedAppName);
  const [errorText, setErrorText] = useState('');
  const [infoText, setInfoText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNameChanged, setIsNameChanged] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setIsNameChanged(newAppName?.trim() !== selectedAppName);
  }, [newAppName, selectedAppName]);

  useEffect(() => {
    inputRef.current?.select();
  }, [show]);

  useEffect(() => {
    setNewAppName(selectedAppName);
  }, [selectedAppName]);

  const handleAction = async (e) => {
    const trimmedAppName = newAppName.trim();
    setNewAppName(trimmedAppName);
    if (!errorText) {
      setIsLoading(true);
      try {
        let success = true;
        //create app from template
        if (templateDetails) {
          success = await processApp(e, trimmedAppName, templateDetails);
          //import app
        } else if (fileContent) {
          success = await processApp(fileContent, trimmedAppName);
          //rename app/clone existing app
        } else if (selectedAppId) {
          success = await processApp(trimmedAppName, selectedAppId);
          //create app from scratch
        } else {
          success = await processApp(trimmedAppName);
        }
        if (success === false) {
          setErrorText(`${appType == APP_TYPE.WORKFLOW ? 'Workflow' : 'App'} name already exists`);
          setInfoText('');
        } else {
          setErrorText('');
          setInfoText('');
          closeModal();
        }
      } catch (error) {
        let errorMessage = 'Some Error Occured';
        if (error?.error) {
          errorMessage = error.error;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        toast.error(errorMessage, {
          position: 'top-center',
          style: { fontSize: '12px' },
        });
      }
    }
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    const newAppName = e.target.value;
    const trimmedName = newAppName.trim();
    setNewAppName(newAppName);
    if (newAppName.length >= 50) {
      setInfoText('Maximum length has been reached');
    } else {
      setInfoText('');
      const error = validateName(trimmedName, 'App', false);
      setErrorText(error?.errorMsg || '');
    }
  };

  const createBtnDisableState =
    isLoading ||
    errorText ||
    (actionButton === 'Rename app' && (!isNameChanged || newAppName.trim().length === 0 || newAppName.length > 50)) || // For rename case
    (actionButton !== 'Rename app' && (newAppName.length > 50 || newAppName.trim().length === 0));

  const appTypeName = APP_TYPE.WORKFLOW == appType ? 'Workflow' : 'App';

  return (
    <Modal
      show={show}
      closeModal={closeModal}
      title={title}
      footerContent={
        <>
          <ButtonSolid
            variant="tertiary"
            onClick={closeModal}
            data-cy="cancel-button"
            className="modal-footer-divider"
            disabled={isLoading}
          >
            Cancel
          </ButtonSolid>
          <ButtonSolid
            form="createAppForm"
            type="submit"
            data-cy={actionButton.toLowerCase().replace(/\s+/g, '-')}
            disabled={createBtnDisableState}
          >
            {isLoading ? actionLoadingButton : actionButton}
          </ButtonSolid>
        </>
      }
    >
      {fetchingOrgGit ? (
        <div className="loader-container">
          <div className="primary-spin-loader"></div>
        </div>
      ) : (
        <FormWrapper callback={handleAction} id="createAppForm">
          <div className="row workspace-folder-modal custom-gap-16">
            <div className="col modal-main tj-app-input">
              <label className="tj-input-label" data-cy="app-name-label">
                {`${appTypeName} name`}
              </label>
              <input
                type="text"
                onChange={handleInputChange}
                className={`form-control ${errorText ? 'input-error-border' : ''}`}
                placeholder={`Enter ${appTypeName.toLowerCase()} name`}
                value={newAppName}
                data-cy="app-name-input"
                maxLength={50}
                autoFocus
                ref={inputRef}
                style={{
                  borderColor: errorText ? '#DB4324 !important' : 'initial',
                }}
                disabled={isLoading}
              />
              {errorText ? (
                <small
                  className="tj-input-error"
                  style={{
                    fontSize: '10px',
                    color: '#DB4324',
                  }}
                  data-cy="app-name-error-label"
                >
                  {errorText}
                </small>
              ) : infoText || newAppName.length >= 50 ? (
                <small
                  className="tj-input-error"
                  style={{
                    fontSize: '10px',
                    color: '#ED5F00',
                  }}
                  data-cy="app-name-error-label"
                >
                  {infoText || 'Maximum length has been reached'}
                </small>
              ) : (
                <small
                  className="tj-input-error"
                  style={{
                    fontSize: '10px',
                    color: '#7E868C',
                  }}
                  data-cy="app-name-info-label"
                >
                  {`${appTypeName} name must be unique and max 50 characters`}
                </small>
              )}
              {orgGit?.is_enabled && appType != APP_TYPE.WORKFLOW && (
                <div className="commit-changes mt-3">
                  <div>
                    <input
                      class="form-check-input"
                      checked={commitEnabled}
                      type="checkbox"
                      onChange={handleCommitEnableChange}
                      data-cy="git-commit-input"
                    />
                  </div>
                  <div>
                    <div className="tj-text tj-text-xsm" data-cy="commit-changes-label">
                      Commit changes
                    </div>
                    <div className="tj-text-xxsm" data-cy="commit-helper-text">
                      This action commits the app&apos;s creation to the git repository
                    </div>
                  </div>
                </div>
              )}
            </div>
            {dependentPlugins && dependentPlugins.length >= 1 && (
              <div onClick={(e) => e.stopPropagation()}>
                <PluginsListForAppModal
                  dependentPlugins={dependentPlugins}
                  dependentPluginsDetail={dependentPluginsDetail}
                />
              </div>
            )}
          </div>
        </FormWrapper>
      )}
    </Modal>
  );
}
