import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authenticationService, organizationService } from '@/_services';
import Modal from '../HomePage/Modal';
import { toast } from 'react-hot-toast';
import { SearchBox } from './SearchBox';

export const Organization = function Organization() {
  const isSingleOrganization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  const { admin, organization_id } = authenticationService.currentUserValue;
  const [organization, setOrganization] = useState(authenticationService.currentUserValue?.organization);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [organizationList, setOrganizationList] = useState([]);
  const [getOrgStatus, setGetOrgStatus] = useState('loading');
  const [isListOrganizations, setIsListOrganizations] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  const getAvatar = (organization) => {
    if (!organization) return;

    const orgName = organization.split(' ').filter((e) => e && !!e.trim());
    if (orgName.length > 1) {
      return `${orgName[0]?.[0]}${orgName[1]?.[0]}`;
    } else if (organization.length >= 2) {
      return `${organization[0]}${organization[1]}`;
    } else {
      return `${organization[0]}${organization[0]}`;
    }
  };

  useEffect(() => {
    !isSingleOrganization && getOrganizations();
  }, [isSingleOrganization]);

  const getOrganizations = () => {
    setGetOrgStatus('loading');
    organizationService.getOrganizations().then(
      (data) => {
        setOrganizationList(data.organizations);
        setGetOrgStatus('success');
      },
      () => {
        setGetOrgStatus('failure');
      }
    );
  };

  const showEditModal = () => {
    setNewOrgName(organization);
    setShowEditOrg(true);
  };

  const showCreateModal = () => {
    setNewOrgName('');
    setShowCreateOrg(true);
  };

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
        window.location.href = '/';
      },
      () => {
        setIsCreating(false);
        toast.error('Error while creating workspace', {
          position: 'top-center',
        });
      }
    );
  };

  const editOrganization = () => {
    if (!(newOrgName && newOrgName.trim())) {
      toast.error('Workspace name can not be empty.', {
        position: 'top-center',
      });
      return;
    }
    setIsCreating(true);
    organizationService.editOrganization({ name: newOrgName }).then(
      () => {
        authenticationService.updateCurrentUserDetails({ organization: newOrgName });
        toast.success('Workspace updated', {
          position: 'top-center',
        });
        setOrganization(newOrgName);
        getOrganizations();
      },
      () => {
        toast.error('Error while editing workspace', {
          position: 'top-center',
        });
      }
    );
    setIsCreating(false);
    setShowEditOrg(false);
  };

  const switchOrganization = (orgId) => {
    organizationService.switchOrganization(orgId).then((response) => {
      if (!response.ok) {
        return (window.location.href = `/login/${orgId}`);
      }
      response.json().then((data) => {
        authenticationService.updateCurrentUserDetails(data);
        window.location.href = '/';
      });
    });
  };

  const listOrganization = () => {
    return (
      organizationList &&
      organizationList
        .filter((org) => org.name?.toLowerCase().includes(searchText ? searchText.toLowerCase() : ''))
        .map((org) => {
          return (
            <div
              key={org.id}
              onClick={organization_id === org.id ? undefined : () => switchOrganization(org.id)}
              className="dropdown-item org-list-item"
            >
              <div className="col-3">
                <span className="avatar bg-secondary-lt">{getAvatar(org.name)}</span>
              </div>
              <div className="col-8">
                <div className="org-name">{org.name}</div>
              </div>
              <div className="col-1">
                {organization_id === org.id && (
                  <div className="tick-ico">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="icon icon-tabler icon-tabler-check"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M5 12l5 5l10 -10"></path>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })
    );
  };

  const searchOrganizations = (text) => {
    setSearchText(text);
  };

  const getListOrganizations = () => {
    return (
      <div className="organization-switchlist">
        <div className="dd-item-padding">
          <div className="d-flex">
            <div className="back-ico" onClick={() => setIsListOrganizations(false)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-chevron-left"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <polyline points="15 6 9 12 15 18"></polyline>
              </svg>
            </div>
            <div className="back-btn" onClick={() => setIsListOrganizations(false)}>
              Back
            </div>
          </div>
          <div className="search-box">
            <SearchBox onSubmit={searchOrganizations} debounceDelay={100} width="14rem" />
          </div>
        </div>
        <div className="org-list">
          {getOrgStatus === 'success' ? (
            listOrganization()
          ) : (
            <div className="text-center">
              <a
                onClick={getOrganizations}
                href="#"
                className={`btn btn-primary mb-2 ${getOrgStatus === 'loading' ? 'btn-loading' : ''}`}
              >
                Load Organizations
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getOrganizationMenu = () => {
    return (
      <div>
        <div className="dropdown-item org-avatar">
          <div className="row">
            <div className="col-3">
              <span className="avatar bg-secondary-lt">{getAvatar(organization)}</span>
            </div>
            <div className={`col-${isSingleOrganization ? '9' : '7'}`}>
              <div className="org-name" style={{ padding: `${admin ? '0px' : '0.6rem'} 0px` }}>
                {organization}
              </div>
              {admin && (
                <div className="org-edit">
                  <span onClick={showEditModal} data-cy="edit-workspace-name">
                    Edit
                  </span>
                </div>
              )}
            </div>
            {!isSingleOrganization && (
              <div className="col-2">
                <div className="arrow-container" onClick={() => setIsListOrganizations(true)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon icon-tabler icon-tabler-chevron-right"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    data-cy="workspace-arrow-icon"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <polyline points="9 6 15 12 9 18"></polyline>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
        {!isSingleOrganization && (
          <div className="dropdown-item org-actions">
            <div onClick={showCreateModal}>Add workspace</div>
          </div>
        )}
        {admin && (
          <>
            <div className="dropdown-divider"></div>
            <Link data-testid="settingsBtn" to="/users" className="dropdown-item" data-cy="manage-users">
              Manage Users
            </Link>
            <Link data-tesid="settingsBtn" to="/groups" className="dropdown-item" data-cy="manage-groups">
              Manage Groups
            </Link>
            <Link data-tesid="settingsBtn" to="/manage-sso" className="dropdown-item" data-cy="manage-sso">
              Manage SSO
            </Link>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="dropdown organization-list" data-cy="dropdown-organization-list">
        <a
          href="#"
          className={`btn ${!isSingleOrganization || admin ? 'dropdown-toggle' : ''}`}
          onMouseOver={() => setIsListOrganizations(false)}
        >
          <div>{organization}</div>
        </a>
        {(!isSingleOrganization || admin) && (
          <div className="dropdown-menu end-0" data-cy="workspace-dropdown">
            {isListOrganizations ? getListOrganizations() : getOrganizationMenu()}
          </div>
        )}
      </div>
      <Modal show={showCreateOrg} closeModal={() => setShowCreateOrg(false)} title="Create workspace">
        <div className="row">
          <div className="col modal-main">
            <input
              type="text"
              onChange={(e) => setNewOrgName(e.target.value)}
              className="form-control"
              placeholder="workspace name"
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
            <button
              disabled={isCreating}
              className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`}
              onClick={createOrganization}
            >
              Create workspace
            </button>
          </div>
        </div>
      </Modal>
      <Modal show={showEditOrg} closeModal={() => setShowEditOrg(false)} title="Edit workspace">
        <div className="row">
          <div className="col modal-main">
            <input
              type="text"
              onChange={(e) => setNewOrgName(e.target.value)}
              className="form-control"
              placeholder="workspace name"
              disabled={isCreating}
              value={newOrgName}
              maxLength={25}
            />
          </div>
        </div>
        <div className="row">
          <div className="col d-flex modal-footer-btn">
            <button className="btn btn-light" onClick={() => setShowEditOrg(false)}>
              Cancel
            </button>
            <button className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`} onClick={editOrganization}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
