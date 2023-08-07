import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { appService } from '@/_services';
import _ from 'lodash';

export function CreateApp({ closeModal, createApp, show }) {
  const [appName, setappName] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateApp = async () => {
    if (!errorText) {
      setIsLoading(true);
      const appExists = await checkIfAppExists(appName);
      if (appExists) {
        setErrorText('App name already exists');
      } else {
        createApp(appName);
        closeModal();
      }
      setIsLoading(false);
    }
  };

  const checkIfAppExists = async (appName) => {
    try {
      const response = await appService.getAll(1, null, appName);
      const apps = response.apps;
      return apps.some((app) => app.name === appName);
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleInputChange = (e) => {
    const newAppName = e.target.value.trim();
    const error = validateAppName(newAppName, 'App Name', true, false);
    setErrorText(error?.errorMsg || '');
    setappName(newAppName);
  };

  const validateAppName = (name, nameType, showError = false, allowSpecialChars = true) => {
    const newName = name.trim();
    let errorMsg = '';
    if (newName.length > 50) {
      errorMsg = `Maximum length has been reached`;
      showError &&
        toast.error(errorMsg, {
          id: '1',
        });
    }
    return {
      status: errorMsg.length > 0,
      errorMsg,
    };
  };

  return (
    <Modal
      show={show}
      closeModal={closeModal}
      title={'Create new app'}
      footerContent={
        <>
          <ButtonSolid variant="tertiary" onClick={closeModal} data-cy="cancel-button" className="modal-footer-divider">
            Cancel
          </ButtonSolid>
          <ButtonSolid onClick={handleCreateApp} data-cy="+ Create App" disabled={isLoading || errorText || !appName}>
            {isLoading ? 'Creating...' : '+ Create App'}
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
            className="form-control"
            placeholder={'Enter app name'}
            value={appName}
            data-cy="app-name-input"
            autoFocus
          />
          {errorText ? (
            <small className="tj-input-error">{errorText}</small>
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
