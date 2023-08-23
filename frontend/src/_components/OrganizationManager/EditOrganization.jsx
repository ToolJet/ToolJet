import React, { useState, useEffect } from 'react';
import { organizationService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { validateName, handleHttpErrorMessages } from '@/_helpers/utils';

export const EditOrganization = ({ showEditOrg, setShowEditOrg, currentValue }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [errorText, setErrorText] = useState('');
  const { t } = useTranslation();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setNewOrgName(currentValue?.name), [currentValue]);

  const editOrganization = () => {
    const trimmedName = newOrgName?.trim();
    if (errorText) {
      return;
    }
    if (currentValue?.name !== trimmedName) {
      setIsCreating(true);
      organizationService.editOrganization({ name: trimmedName }).then(
        () => {
          toast.success('Workspace updated');
          setIsCreating(false);
          setShowEditOrg(false);
          window.location.reload();
        },
        (error) => {
          handleHttpErrorMessages(error, 'Workspace');
          setIsCreating(false);
        }
      );
    } else {
      setShowEditOrg(false);
    }
  };

  const handleInputChange = (e) => {
    setErrorText('');
    const error = validateName(e.target.value, 'Workspace name');
    if (!error.status) {
      setErrorText(error.errorMsg);
    }
    setNewOrgName(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editOrganization();
    }
  };

  const closeModal = () => {
    setShowEditOrg(false);
    setErrorText('');
    setNewOrgName(currentValue.name);
  };

  return (
    <AlertDialog
      show={showEditOrg}
      closeModal={closeModal}
      title={t('header.organization.editWorkspace', 'Edit workspace')}
      checkForBackground={false}
    >
      <div className="row mb-3 workspace-folder-modal">
        <div className="col modal-main tj-app-input">
          <input
            type="text"
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="form-control"
            placeholder={t('header.organization.workspaceName', 'workspace name')}
            disabled={isCreating}
            value={newOrgName}
            maxLength={50}
            autoFocus
          />
          <label className="tj-input-error">{errorText || ''}</label>
        </div>
      </div>
      <div className="row">
        <div className="col d-flex justify-content-end gap-2">
          <ButtonSolid
            variant="tertiary"
            onClick={closeModal}
          >
            {t('globals.cancel', 'Cancel')}
          </ButtonSolid>
          <ButtonSolid
            isLoading={isCreating}
            onClick={editOrganization}
          >
            {t('globals.save', 'Save')}
          </ButtonSolid>
        </div>
      </div>
    </AlertDialog>
  );
};
