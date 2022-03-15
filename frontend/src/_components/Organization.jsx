import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authenticationService, organizationService } from '@/_services';
import Modal from '../HomePage/Modal';
import { toast } from 'react-hot-toast';

export const Organization = function Organization() {
  const { organization, admin } = authenticationService.currentUserValue;
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  const getAvatar = () => {
    if (!organization) return;

    const orgName = organization.split(' ');
    if (orgName.length > 1) {
      return `${orgName[0]?.[0]}${orgName[1]?.[0]}`;
    } else {
      return `${organization[0]}${organization[1]}`;
    }
  };

  const createOrganization = () => {
    if (!(newOrgName && newOrgName.trim())) {
      toast.error("organization name can't be empty.", {
        position: 'top-center',
      });
      return;
    }
    setIsCreating(true);
    organizationService.createOrganization(newOrgName).then(
      (data) => {
        authenticationService.updateCurrentUserDetails(data);
        window.location.href = '/';
      },
      () => {
        toast.error('Error while creating organization', {
          position: 'top-center',
        });
      }
    );
    setIsCreating(false);
  };

  return (
    <div>
      <div className="dropdown organization-list">
        <a href="#" className="btn dropdown-toggle">
          <div>{organization}</div>
        </a>
        <div className="dropdown-menu dropdown-menu-right">
          <div className="org-dd-item">
            <div className="row">
              <div className="col-3">
                <span className="avatar bg-secondary-lt">{getAvatar()}</span>
              </div>
              <div className="col-9">
                <div className="org-name align-middle">{organization}</div>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-between org-actions">
            <div>Switch</div>
            <div onClick={() => setShowCreateOrg(true)}>Create</div>
          </div>
          {admin && (
            <>
              <div className="dropdown-divider"></div>
              <Link data-testid="settingsBtn" to="/users" className="dropdown-item">
                Manage Users
              </Link>
              <Link data-tesid="settingsBtn" to="/groups" className="dropdown-item">
                Manage Groups
              </Link>
              <Link data-tesid="settingsBtn" to="/sso-configs" className="dropdown-item">
                Manage SSO
              </Link>
            </>
          )}
        </div>
      </div>
      <Modal show={showCreateOrg} closeModal={() => setShowCreateOrg(false)} title="Create organization">
        <div className="row">
          <div className="col modal-main">
            <input
              type="text"
              onChange={(e) => setNewOrgName(e.target.value)}
              className="form-control"
              placeholder="organization name"
              disabled={isCreating}
              maxLength={25}
            />
          </div>
        </div>
        <div className="row">
          <div className="col d-flex modal-footer-btn">
            <button className="btn btn-light" onClick={() => setShowCreateOrg(false)}>
              Cancel
            </button>
            <button className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`} onClick={createOrganization}>
              Create organization
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
