import React, { useState } from 'react';
import { organizationService } from '@/_services';
import AlertDialog from '@/_ui/AlertDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
    >
      <div className="row mb-3">
        <div className="col modal-main">
          <input
            type="text"
            onChange={(e) => setNewOrgName(e.target.value)}
            className="form-control"
            placeholder={t('header.organization.workspaceName', 'workspace name')}
            disabled={isCreating}
            value={newOrgName}
            maxLength={25}
          />
        </div>
      </div>
      <div className="row">
        <div className="col d-flex justify-content-end">
          <button className="btn mx-1" onClick={() => setShowEditOrg(false)}>
            {t('globals.cancel', 'Cancel')}
          </button>
          <button className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`} onClick={editOrganization}>
            {t('globals.save', 'Save')}
          </button>
        </div>
      </div>
    </AlertDialog>
  );
};
