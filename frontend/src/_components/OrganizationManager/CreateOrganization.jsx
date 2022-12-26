import React, { useState } from 'react';
import { authenticationService, organizationService } from '@/_services';
import Modal from '../../HomePage/Modal';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
        authenticationService.updateCurrentUserDetails(data);
        window.location.href = '';
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
    <Modal
      show={showCreateOrg}
      closeModal={() => setShowCreateOrg(false)}
      title={t('header.organization.createWorkspace', 'Create workspace')}
    >
      <div className="row">
        <div className="col modal-main">
          <input
            type="text"
            onChange={(e) => setNewOrgName(e.target.value)}
            className="form-control"
            placeholder={t('header.organization.workspaceName', 'workspace name')}
            disabled={isCreating}
            maxLength={25}
          />
        </div>
      </div>
      <div className="row">
        <div className="col d-flex modal-footer-btn">
          <button className="btn btn-light" onClick={() => setShowCreateOrg(false)}>
            {t('globals.cancel', 'Cancel')}
          </button>
          <button
            disabled={isCreating}
            className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`}
            onClick={createOrganization}
          >
            {t('header.organization.createWorkspace', 'Create workspace')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
