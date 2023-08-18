import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { appService } from '@/_services';
import _ from 'lodash';
import { validateAppName } from '@/_helpers/utils';

export function CreateApp({ closeModal, createApp, show }) {
  const [appName, setappName] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateApp = async () => {
    if (!errorText) {
      setIsLoading(true);
      try {
        const success = await createApp(appName);
        if (success === false) {
          setErrorText('App name already exists');
        } else {
          setErrorText('');
          closeModal();
        }
      } catch (error) {
        toast.error(error);
      }
    }
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    const newAppName = e.target.value;
    const error = validateAppName(newAppName);
    setErrorText(error?.errorMsg || '');
    setappName(newAppName);
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
          <ButtonSolid
            onClick={handleCreateApp}
            data-cy="+ Create App"
            disabled={isLoading || errorText || appName.trim().length === 0}
          >
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
