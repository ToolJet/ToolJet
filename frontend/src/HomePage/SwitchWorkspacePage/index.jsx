import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { getAvatar } from '@/_helpers/utils';
import { appendWorkspaceId } from '@/_helpers/routes';
import cx from 'classnames';
import { organizationService } from '@/_services';

function SwitchWorkspaceModal({ organizations, switchOrganization, ...props }) {
  const { t } = useTranslation();
  const [selectedOrganization, setOrganization] = useState({});

  return (
    <Modal
      {...props}
      className={`organization-switch-modal ${props.darkMode ? 'dark-mode' : ''}`}
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="64" rx="12" fill="#FFF0EE" />
          <g opacity="0.4">
            <path
              d="M32.8331 15.3333H31.1664C30.2459 15.3333 29.4998 16.0795 29.4998 17V47C29.4998 47.9205 30.2459 48.6666 31.1664 48.6666H32.8331C33.7536 48.6666 34.4998 47.9205 34.4998 47V17C34.4998 16.0795 33.7536 15.3333 32.8331 15.3333Z"
              fill="#E54D2E"
            />
          </g>
          <path
            d="M18.4432 31.1669L29.4998 24.7834L34.4998 21.8966L38.0526 19.8454C38.4354 19.6244 38.8904 19.5645 39.3173 19.6789L43.8707 20.8989C44.7599 21.1372 45.2875 22.0511 45.0493 22.9402L43.8292 27.4936C43.7148 27.9206 43.4354 28.2846 43.0526 28.5056L34.4998 33.4436L29.4998 36.3304L23.4432 39.8271C22.6461 40.2873 21.6268 40.0142 21.1665 39.2171L17.8332 33.4436C17.373 32.6464 17.6461 31.6271 18.4432 31.1669Z"
            fill="#E54D2E"
          />
        </svg>
        <span className="header-text">{t('globals.workspace-modal.wrong-link', 'Incorrect workspace link.')}</span>
        <p>
          {t(
            'globals.workspace-modal.wrong-link-desc',
            'You’ve entered an incorrect workspace link. Select an active workspace to continue this session'
          )}
        </p>
      </Modal.Header>
      <Modal.Body>
        <div className="org-list">
          {organizations.map((organization) => (
            <div
              key={organization.id}
              className={cx('org-item', {
                'selected-item': organization.id === selectedOrganization?.id,
              })}
              onClick={() => setOrganization(organization)}
            >
              <input
                type={'radio'}
                value={organization.id}
                name="organization_id"
                checked={organization.id === selectedOrganization?.id}
                onChange={() => {}}
              />
              <span className={'avatar avatar-sm'}>{getAvatar(organization.name)}</span>
              <span>{organization.name}</span>
            </div>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-primary" onClick={() => switchOrganization(selectedOrganization)}>
          {t('globals.workspace-modal.continue-btn', 'Continue on this workspace')}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export default function SwitchWorkspacePage({ darkMode }) {
  const [organizations, setOrganizations] = React.useState([]);

  const fetchOrganizations = () => {
    organizationService.getOrganizations().then((response) => setOrganizations(response.organizations));
  };

  const switchOrganization = ({ id, slug }) => {
    if (slug || id) {
      const newPath = appendWorkspaceId(slug || id, location.pathname, true);
      window.history.replaceState(null, null, newPath);
      window.location.reload();
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <SwitchWorkspaceModal
        show={true}
        darkMode={darkMode}
        organizations={organizations}
        switchOrganization={switchOrganization}
      />
    </div>
  );
}
