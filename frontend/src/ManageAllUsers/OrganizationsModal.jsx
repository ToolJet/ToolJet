import React from 'react';
import Modal from 'react-bootstrap/Modal';
import cx from 'classnames';
import { LicenseBanner } from '@/LicenseBanner';
import ModalBase from '@/_ui/Modal';

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
  showWorkspaceUserArchiveModal,
  updatingUser,
  toggleWorkspaceUserArchiveModal,
}) => {
  const organization_users = selectedUser?.organization_users;
  const isArchived = updatingUser?.status === 'archived';

  const generateWorkspaceUserConfirmModal = () => {
    const isArchived = selectedUser?.status === 'archived';
    const confirmButtonProps = {
      title: !isArchived ? 'Archive' : 'Unarchive',
      isLoading: archivingUser || unarchivingUser,
      disabled: archivingUser || unarchivingUser,
      variant: 'primary',
      leftIcon: 'archive',
    };
    const body = `Unarchiving the user in this workspace will activate them in the instance and include them in the count of users covered by your plan. Are you sure you want to continue?`;

    return (
      <ModalBase
        title={
          <div className="my-3">
            <span className="tj-text-md font-weight-500">{!isArchived ? 'Archive user' : 'Unarchive user'}</span>
            <div className="tj-text-sm text-muted">{selectedUser?.email}</div>
          </div>
        }
        show={showWorkspaceUserArchiveModal}
        handleClose={() => toggleWorkspaceUserArchiveModal(null)}
        handleConfirm={() =>
          !isArchived
            ? archiveOrgUser(updatingUser?.id, updatingUser?.organization_id)
            : unarchiveOrgUser(updatingUser?.id, updatingUser?.organization_id)
        }
        confirmBtnProps={confirmButtonProps}
        body={<div className="tj-text-sm">{body}</div>}
      />
    );
  };

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
                  <th className="w-1"></th>
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
                        {organization_user.status.charAt(0).toUpperCase() + organization_user.status.slice(1)}
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
                          selectedUser.status !== 'archived'
                            ? organization_user.status === 'archived'
                              ? unarchiveOrgUser(organization_user.id, organization_user.organization_id)
                              : archiveOrgUser(organization_user.id, organization_user.organization_id)
                            : toggleWorkspaceUserArchiveModal(organization_user);
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
      {generateWorkspaceUserConfirmModal()}
    </>
  );
};

export default OrganizationsModal;
