import React from 'react';
import Modal from 'react-bootstrap/Modal';
import cx from 'classnames';
import { LicenseBanner } from '@/LicenseBanner';

const OrganizationsModal = ({
  showModal,
  darkMode,
  hideModal,
  translator,
  selectedUser,
  archivingUser,
  unarchivingUser,
  archiveOrgUser,
  unarchiveOrgUser,
  archiveAll,
  archivingFromAllOrgs,
  disabled = false,
}) => {
  const organization_users = selectedUser?.organization_users;
  return (
    <>
      <Modal
        show={showModal}
        size="md"
        backdrop="static"
        centered={true}
        keyboard={true}
        onEscapeKeyDown={hideModal}
        className={`${darkMode && 'dark-mode'} organizations-modal`}
      >
        <Modal.Header>
          <Modal.Title className="text-center " data-cy="modal-title">
            {translator('header.organization.menus.manageAllUsers.workspaces', 'Workspaces')} of {selectedUser?.name}
          </Modal.Title>
          <div className="close-button cursor-pointer" onClick={hideModal} data-cy="modal-close-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-x"
              width="44"
              height="44"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke={darkMode ? '#fff' : '#2c3e50'}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </Modal.Header>

        <Modal.Body>
          <div className="">
            <table data-testid="usersTable" className="table table-vcenter h-100">
              <thead className="user-table-header">
                <tr>
                  <th data-cy="number-column-header">NO</th>
                  <th data-cy="name-column-header">
                    {translator('header.organization.menus.manageAllUsers.organizationsTable.name', 'Name')}
                  </th>
                  <th data-cy="status-column-header">
                    {translator('header.organization.menus.manageAllUsers.organizationsTable.status', 'Status')}
                  </th>
                  <th className="w-1">
                    <button
                      className={cx('btn btn-sm btn-outline-danger', {
                        'btn-loading': archivingFromAllOrgs,
                      })}
                      onClick={archiveAll}
                      style={{ minWidth: '100px' }}
                      disabled={disabled}
                      data-cy="archive-all-button"
                    >
                      Archive All
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {organization_users?.map((organization_user, index) => (
                  <tr
                    key={index}
                    data-cy={`${organization_user.organization.name.toLowerCase().replace(/\s+/g, '-')}-workspace-row`}
                  >
                    <td>{index + 1}</td>
                    <td
                      data-cy={`${organization_user.organization.name
                        .toLowerCase()
                        .replace(/\s+/g, '-')}-workspace-name`}
                    >
                      {organization_user.organization.name}
                    </td>
                    <td className={`${darkMode ? 'text-light' : 'text-muted'}`}>
                      <span
                        className={cx('badge me-1 m-1', {
                          'bg-warning': organization_user.status === 'invited',
                          'bg-danger': organization_user.status === 'archived',
                          'bg-success': organization_user.status === 'active',
                        })}
                        data-cy="status-badge"
                      ></span>
                      <small className={darkMode ? 'dark-mode-status' : ''} data-cy="user-status">
                        {organization_user.status}
                      </small>
                    </td>
                    <td>
                      <button
                        type="button"
                        style={{ minWidth: '100px' }}
                        className={cx('btn btn-sm', {
                          'btn-outline-success': organization_user.status === 'archived',
                          'btn-outline-danger':
                            organization_user.status === 'active' || organization_user.status === 'invited',
                          'btn-loading':
                            unarchivingUser === organization_user.id || archivingUser === organization_user.id,
                        })}
                        disabled={
                          unarchivingUser === organization_user.id || archivingUser === organization_user.id || disabled
                        }
                        onClick={() => {
                          organization_user.status === 'archived'
                            ? unarchiveOrgUser(organization_user.id, organization_user.organization_id)
                            : archiveOrgUser(organization_user.id, organization_user.organization_id);
                        }}
                        data-cy="user-state-change-button"
                      >
                        {organization_user.status === 'archived'
                          ? translator('header.organization.menus.manageUsers.unarchive', 'Unarchive')
                          : translator('header.organization.menus.manageUsers.archive', 'Archive')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {disabled && (
              <LicenseBanner
                classes="mt-3"
                customMessage="You can only access this setting in our paid plans. For more,"
                size="xsmall"
              ></LicenseBanner>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default OrganizationsModal;
