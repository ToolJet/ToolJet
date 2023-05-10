import React, { useState } from 'react';
import { organizationService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { appendWorkspaceId } from '../../_helpers/utils';

export const CreateOrganization = ({ showCreateOrg, setShowCreateOrg }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const { t } = useTranslation();

  const createOrganization = () => {
    if (!(newOrgName && newOrgName.trim())) {
      toast.error('Workspace name can not be empty.', {
        position: 'top-center',
      });
      return;
    }

    setIsCreating(true);
    organizationService.createOrganization(newOrgName).then(
      (data) => {
        setIsCreating(false);
        const newPath = appendWorkspaceId(data.current_organization_id, location.pathname, true);
        window.history.replaceState(null, null, newPath);
        window.location.reload();
      },
      () => {
        setIsCreating(false);
        toast.error('Error while creating workspace', {
          position: 'top-center',
        });
      }
    );
  };

  return (
    <AlertDialog
      show={showCreateOrg}
      closeModal={() => setShowCreateOrg(false)}
      title={t('header.organization.createWorkspace', 'Create workspace')}
    >
      <div className="row mb-3">
        <div className="col modal-main tj-app-input">
          <input
            type="text"
            onChange={(e) => setNewOrgName(e.target.value)}
            className="form-control"
            placeholder={t('header.organization.workspaceName', 'workspace name')}
            disabled={isCreating}
            maxLength={25}
            data-cy="workspace-name-input-field"
            autoFocus
          />
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
