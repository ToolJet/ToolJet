import React, { useState } from 'react';
import { organizationService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const EditOrganization = ({ showEditOrg, setShowEditOrg }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const { t } = useTranslation();

  const editOrganization = () => {
    if (!(newOrgName && newOrgName.trim())) {
      toast.error('Workspace name can not be empty.');
      return;
    }

    setIsCreating(true);
    organizationService.editOrganization({ name: newOrgName }).then(
      () => {
        toast.success('Workspace updated');
        window.location.reload();
      },
      (err) => {
        toast.error(err?.data?.message || 'Error while editing workspace');
      }
    );
    setIsCreating(false);
    setShowEditOrg(false);
  };

  return (
    <AlertDialog
      show={showEditOrg}
      closeModal={() => setShowEditOrg(false)}
      title={t('header.organization.editWorkspace', 'Edit workspace')}
      checkForBackground={false}
    >
      <div className="row mb-3">
        <div className="col modal-main tj-app-input">
          <input
            type="text"
            onChange={(e) => setNewOrgName(e.target.value)}
            className="form-control"
            placeholder={t('header.organization.workspaceName', 'workspace name')}
            disabled={isCreating}
            value={newOrgName}
            maxLength={25}
            autoFocus
          />
        </div>
      </div>
      <div className="row">
        <div className="col d-flex justify-content-end gap-2">
          <ButtonSolid variant="tertiary" onClick={() => setShowEditOrg(false)}>
            {t('globals.cancel', 'Cancel')}
          </ButtonSolid>
          <ButtonSolid isLoading={isCreating} onClick={editOrganization}>
            {t('globals.save', 'Save')}
          </ButtonSolid>
        </div>
      </div>
    </AlertDialog>
  );
};
