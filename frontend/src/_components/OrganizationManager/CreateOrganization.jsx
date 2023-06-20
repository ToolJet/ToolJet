import React, { useState } from 'react';
import { organizationService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { appendWorkspaceId, validateName, handleHttpErrorMessages } from '@/_helpers/utils';

export const CreateOrganization = ({ showCreateOrg, setShowCreateOrg }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [errorText, setErrorText] = useState('');
  const { t } = useTranslation();

  const createOrganization = () => {
    const newName = newOrgName?.trim();
    if (!newName) {
      setErrorText("Workspace name can't be empty");
      return;
    }

    if (!errorText) {
      setIsCreating(true);
      organizationService.createOrganization(newName).then(
        (data) => {
          setIsCreating(false);
          const newPath = appendWorkspaceId(data.current_organization_id, location.pathname, true);
          window.history.replaceState(null, null, newPath);
          window.location.reload();
        },
        (error) => {
          setIsCreating(false);
          handleHttpErrorMessages(error, 'workspace');
        }
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      createOrganization();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setErrorText('');
    const error = validateName(value, 'Workspace name');
    if (!error.status) {
      setErrorText(error.errorMsg);
    }
    setNewOrgName(value);
  };

  const closeModal = () => {
    setErrorText('');
    setNewOrgName('');
    setShowCreateOrg(false);
  };

  return (
    <AlertDialog
      show={showCreateOrg}
      closeModal={closeModal}
      title={t('header.organization.createWorkspace', 'Create workspace')}
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
            maxLength={50}
            data-cy="workspace-name-input-field"
            autoFocus
          />
          <label className="tj-input-error">{errorText || ''}</label>
        </div>
      </div>
      <div className="row">
        <div className="col d-flex justify-content-end gap-2">
          <ButtonSolid variant="tertiary" onClick={closeModal} data-cy="cancel-button">
            {t('globals.cancel', 'Cancel')}
          </ButtonSolid>
          <ButtonSolid
            disabled={isCreating}
            onClick={createOrganization}
            data-cy="create-workspace-button"
            isLoading={isCreating}
          >
            {t('header.organization.createWorkspace', 'Create workspace')}
          </ButtonSolid>
        </div>
      </div>
    </AlertDialog>
  );
};
