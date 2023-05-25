import React, { useEffect, useState } from 'react';
import { organizationService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { appendWorkspaceId, validateName, handleHttpErrorMessages, sessionStorageOperations } from '@/_helpers/utils';

export const CreateOrganization = ({ showCreateOrg, setShowCreateOrg }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [errorText, setErrorText] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const sessionStorageData = sessionStorageOperations('get', 'new_workspace_modal');
    if (sessionStorageData) {
      const { value, visibility } = sessionStorageData;
      if (visibility) {
        setShowCreateOrg(true);
        setNewOrgName(value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createOrganization = () => {
    if (errorText) {
      return;
    }

    setIsCreating(true);
    organizationService.createOrganization(newOrgName.trim()).then(
      (data) => {
        setIsCreating(false);
        sessionStorageOperations('remove', 'new_workspace_modal');
        const newPath = appendWorkspaceId(data.current_organization_id, location.pathname, true);
        window.history.replaceState(null, null, newPath);
        window.location.reload();
      },
      (error) => {
        setIsCreating(false);
        handleHttpErrorMessages(error, 'workspace');
      }
    );
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setErrorText('');
    sessionStorageOperations('set', null, { new_workspace_modal: { value, visibility: true } });
    const error = validateName(value, '', 'Workspace name', false);
    if (!error.status) {
      setErrorText(error.errorMsg);
    }
    setNewOrgName(value);
  };

  return (
    <AlertDialog
      show={showCreateOrg}
      closeModal={() => {
        sessionStorageOperations('remove', 'new_workspace_modal');
        setShowCreateOrg(false);
      }}
      title={t('header.organization.createWorkspace', 'Create workspace')}
    >
      <div className="row mb-3 workspace-folder-modal">
        <div className="col modal-main tj-app-input">
          <input
            type="text"
            value={newOrgName}
            onChange={handleInputChange}
            className="form-control"
            placeholder={t('header.organization.workspaceName', 'workspace name')}
            disabled={isCreating}
            maxLength={40}
            data-cy="workspace-name-input-field"
            autoFocus
          />
          <label className="tj-input-error">{errorText || ''}</label>
        </div>
      </div>
      <div className="row">
        <div className="col d-flex justify-content-end gap-2">
          <ButtonSolid variant="tertiary" onClick={() => setShowCreateOrg(false)} data-cy="cancel-button">
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
