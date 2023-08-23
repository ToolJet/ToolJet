import React, { useState, useEffect, useContext, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import _ from 'lodash';
import { validateAppName } from '@/_helpers/utils';

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
}) {
  if (!selectedAppName && templateDetails) {
    selectedAppName = templateDetails?.name || '';
  } else if (!selectedAppName && fileContent) {
    selectedAppName = fileContent?.appV2?.name || '';
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

  const [deploying, setDeploying] = useState(false);
  const [newAppName, setNewAppName] = useState(selectedAppName);
  const [errorText, setErrorText] = useState('');
  const [infoText, setInfoText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNameChanged, setIsNameChanged] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [clearInput, setClearInput] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setIsNameChanged(newAppName?.trim() !== selectedAppName);
  }, [newAppName, selectedAppName]);

  useEffect(() => {
    setIsSuccess(false);
  }, [show]);

  useEffect(() => {
    inputRef.current?.select();
  }, [show]);

  useEffect(() => {
    setIsSuccess(false);
    setClearInput(false);
    setNewAppName(selectedAppName);
  }, [selectedAppName]);

  const handleAction = async (e) => {
    setDeploying(true);
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
          setErrorText('App name already exists');
          setInfoText('');
        } else {
          setErrorText('');
          setInfoText('');
          closeModal();
        }
      } catch (error) {
        toast.error(e.error, {
          position: 'top-center',
        });
      }
    }
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    const newAppName = e.target.value;
    const trimmedName = newAppName.trim();
    if (trimmedName.length === 50) {
      setInfoText('Maximum length has been reached');
    } else {
      setInfoText('');
      const error = validateAppName(trimmedName);
      setErrorText(error?.errorMsg || '');

      if (clearInput) {
        setNewAppName('');
        setClearInput(false);
      } else {
        setNewAppName(newAppName);
      }
    }
  };

  const createBtnDisableState =
    isLoading ||
    errorText ||
    (actionButton === 'Rename app' && (!isNameChanged || newAppName.trim().length === 0 || newAppName.length > 50)) || // For rename case
    (actionButton !== 'Rename app' && (newAppName.length > 50 || newAppName.trim().length === 0));

  return (
    <Modal
      show={show}
      closeModal={closeModal}
      title={title}
      footerContent={
        <>
          <ButtonSolid variant="tertiary" onClick={closeModal} data-cy="cancel-button" className="modal-footer-divider">
            Cancel
          </ButtonSolid>
          <ButtonSolid onClick={(e) => handleAction(e)} data-cy={actionButton} disabled={createBtnDisableState}>
            {isLoading ? actionLoadingButton : actionButton}
          </ButtonSolid>
        </>
      }
    >
      <div className="row workspace-folder-modal mb-3">
        <div className="col modal-main tj-app-input">
          <label className="tj-input-label">{'App Name'}</label>
          <input
            type="text"
            onChange={handleInputChange}
            className={`form-control ${errorText ? 'input-error-border' : ''}`}
            placeholder={'Enter app name'}
            value={newAppName}
            data-cy="app-name-input"
            autoFocus
            maxLength={50}
            ref={inputRef}
            style={{
              borderColor: errorText ? '#DB4324 !important' : 'initial',
            }}
          />
          {errorText ? (
            <small
              className="tj-input-error"
              style={{
                fontSize: '10px',
                color: '#DB4324',
              }}
            >
              {errorText}
            </small>
          ) : infoText ? (
            <small
              className="tj-input-error"
              style={{
                fontSize: '10px',
                color: '#ED5F00',
              }}
            >
              {infoText}
            </small>
          ) : (
            <small
              className="tj-input-error"
              style={{
                fontSize: '10px',
                color: '#7E868C',
              }}
            >
              App name must be unique and max 50 characters
            </small>
          )}
        </div>
      </div>
    </Modal>
  );
}
