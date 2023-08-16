import React, { useState, useEffect, useContext, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import _ from 'lodash';
import { validateAppName } from '@/_helpers/utils';

export function CreateAppFromTemplate({ templateDetails, closeModal, deployApp, show }) {
  const [deploying, setDeploying] = useState(false);
  const selectedAppName = templateDetails?.name || '';
  const [newAppName, setNewAppName] = useState(selectedAppName);
  const [errorText, setErrorText] = useState('');
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
    setNewAppName(selectedAppName);
    setClearInput(false);
  }, [show, selectedAppName]);

  const handleDeployApp = async (e) => {
    setDeploying(true);
    if (!errorText) {
      setIsLoading(true);
      try {
        const success = await deployApp(e, newAppName, templateDetails);
        if (success === false) {
          setErrorText('App name already exists');
        } else {
          setErrorText('');
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
    const error = validateAppName(newAppName, 'App name', true, false);
    setErrorText(error?.errorMsg || '');

    if (clearInput) {
      setNewAppName('');
      setClearInput(false);
    } else {
      setNewAppName(newAppName);
    }
  };

  return (
    <Modal
      show={show}
      closeModal={closeModal}
      title={'Create new app from template'}
      footerContent={
        <>
          <ButtonSolid variant="tertiary" onClick={closeModal} data-cy="cancel-button" className="modal-footer-divider">
            Cancel
          </ButtonSolid>
          <ButtonSolid
            onClick={(e) => handleDeployApp(e)}
            data-cy="+ Create App"
            disabled={isLoading || errorText || newAppName.length > 50 || newAppName.trim().length === 0}
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
            value={newAppName}
            data-cy="app-name-input"
            autoFocus
            ref={inputRef}
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
