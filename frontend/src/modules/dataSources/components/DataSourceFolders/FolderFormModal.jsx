import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '@/HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { validateName, handleHttpErrorMessages } from '@/_helpers/utils';

// Shared create/rename modal for data-source folders. `mode` is 'create' | 'rename'.
// - Create: primary disabled while the name is empty.
// - Rename: pre-filled, primary disabled while empty OR unchanged.
// Both show a loading state on the primary button and a success toast (copy per the design).
export const FolderFormModal = ({ show, mode, folder, onClose, onCreate, onRename }) => {
  const isRename = mode === 'rename';
  const [name, setName] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setName(isRename ? (folder?.name ?? '') : '');
      setErrorText('');
      setIsSubmitting(false);
    }
  }, [show, isRename, folder]);

  const handleChange = (e) => {
    const value = e.target.value;
    setName(value);
    // allowSpecialChars=false, allowSpaces=true, allowAllCases=true — mirrors the backend folder
    // name DTO (alphanumeric + space/hyphen, no path separators).
    const validation = validateName(value, 'Folder name', true, false, false, true, false, true);
    setErrorText(validation.status ? '' : validation.errorMsg);
  };

  const trimmedName = name.trim().replace(/\s+/g, ' ');
  const isUnchanged = isRename && trimmedName === folder?.name;
  const isDisabled = !!errorText || !trimmedName || isUnchanged || isSubmitting;

  const handleSubmit = () => {
    if (isDisabled) return;
    setIsSubmitting(true);
    const request = isRename ? onRename(trimmedName, folder.id) : onCreate(trimmedName);
    request
      .then(() => {
        toast.success(isRename ? 'Folder renamed successfully!' : 'Folder created successfully!');
        onClose();
      })
      .catch((error) => {
        handleHttpErrorMessages(error, 'folder');
        setIsSubmitting(false);
      });
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') handleSubmit();
  };

  return (
    <Modal show={show} closeModal={onClose} title={isRename ? 'Rename folder' : 'Create folder'}>
      <div className="row workspace-folder-modal">
        <div className="col modal-main tj-app-input">
          <label className="tw-mb-1 tj-text-xsm font-weight-500">Folder name</label>
          <input
            type="text"
            onChange={handleChange}
            className="form-control"
            placeholder="Enter folder name.."
            disabled={isSubmitting}
            value={name}
            maxLength={50}
            data-cy="datasource-folder-name-input"
            onKeyPress={handleKeyPress}
            autoFocus
          />
          <label className="tj-input-error">{errorText || ''}</label>
        </div>
      </div>
      <div className="row">
        <div className="col d-flex modal-footer-btn justify-content-end">
          <ButtonSolid variant="tertiary" onClick={onClose} data-cy="cancel-button">
            Cancel
          </ButtonSolid>
          <ButtonSolid
            onClick={handleSubmit}
            data-cy={`${isRename ? 'rename' : 'create'}-datasource-folder-button`}
            isLoading={isSubmitting}
            disabled={isDisabled}
          >
            {isRename ? 'Rename folder' : 'Create folder'}
          </ButtonSolid>
        </div>
      </div>
    </Modal>
  );
};
