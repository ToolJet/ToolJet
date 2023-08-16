import React, { useState, useEffect, useRef } from 'react';
import Modal from '../HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { appService } from '@/_services';
import { toast } from 'react-hot-toast';
import { validateAppName } from '@/_helpers/utils';

export function RenameApp({ closeModal, renameApp, show, selectedAppId, selectedAppName }) {
  const [newAppName, setNewAppName] = useState(selectedAppName);
  const [isNameChanged, setIsNameChanged] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setIsNameChanged(newAppName.trim() !== selectedAppName);
  }, [newAppName, selectedAppName]);

  useEffect(() => {
    setIsSuccess(false);
  }, [show]);

  useEffect(() => {
    inputRef.current?.select();
  }, [show]);

  const handleRenameApp = async (newAppName, selectedAppId) => {
    if (!errorText) {
      setIsLoading(true);
      try {
        const success = await renameApp(newAppName, selectedAppId);
        console.log(success);
        if (success === false) {
          setErrorText('App name already exists');
        } else {
          setErrorText('');
          closeModal();
        }
      } catch (error) {
        toast.error('App name could not be updated. Please try again!');
      }
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newAppName = e.target.value;
    const error = validateAppName(newAppName, 'App Name', true, false);
    setErrorText(error?.errorMsg || '');
    setNewAppName(newAppName);
  };

  return (
    <Modal
      show={show}
      closeModal={closeModal}
      title={'Rename app'}
      footerContent={
        <>
          <ButtonSolid variant="tertiary" onClick={closeModal} data-cy="cancel-button" className="modal-footer-divider">
            Cancel
          </ButtonSolid>
          <ButtonSolid
            onClick={() => handleRenameApp(newAppName, selectedAppId)}
            data-cy="Update"
            disabled={isLoading || errorText || !isNameChanged || newAppName.trim().length === 0}
          >
            {isLoading ? 'Creating...' : 'Update'}
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
            value={newAppName || selectedAppName}
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
