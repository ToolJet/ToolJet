import React, { useState } from 'react';
import { organizationService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
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
        <div className="col modal-main">
          <input
            type="text"
            onChange={(e) => setNewOrgName(e.target.value)}
            className="form-control"
            placeholder={t('header.organization.workspaceName', 'workspace name')}
            disabled={isCreating}
            maxLength={25}
            data-cy="workspace-name-input-field"
          />
        </div>
      </div>
      <div className="row">
        <div className="col d-flex justify-content-end">
          <button className="btn mx-2" onClick={() => setShowCreateOrg(false)} data-cy="cancel-button">
            {t('globals.cancel', 'Cancel')}
          </button>
          <button
            disabled={isCreating}
            className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`}
            onClick={createOrganization}
            data-cy="create-workspace-button"
          >
            {t('header.organization.createWorkspace', 'Create workspace')}
          </button>
        </div>
      </div>
    </AlertDialog>
  );
};
