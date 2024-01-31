import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Avatar from '@/_ui/Avatar';
import Skeleton from 'react-loading-skeleton';
import cx from 'classnames';
import { Pagination } from '@/_components';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Tooltip } from 'react-tooltip';

const UsersTable = ({
  isLoading,
  users,
  archivingUser,
  unarchivingUser,
  generateInvitationURL,
  invitationLinkCopyHandler,
  unarchiveOrgUser,
  archiveOrgUser,
  meta,
  pageChanged,
  darkMode,
  translator,
  isLoadingAllUsers,
  openOrganizationModal,
  openEditModal,
  customStyles,
}) => {
  return (
    <div className="workspace-settings-table-wrap mb-4">
      <div style={customStyles} className="tj-user-table-wrapper">
        <div className="card-table fixedHeader table-responsive  ">
          <table data-testid="usersTable" className="users-table table table-vcenter h-100">
            <thead>
              <tr>
                <th data-cy="users-table-name-column-header">
                  {translator('header.organization.menus.manageUsers.name', 'Name')}
                </th>
                <th data-cy="users-table-email-column-header">
                  {translator('header.organization.menus.manageUsers.email', 'Email')}
                </th>
                {isLoadingAllUsers && (
                  <th data-cy="users-table-type-column-header">
                    {translator('header.organization.menus.manageUsers.userType', 'Type')}
                  </th>
                )}
                {users && users[0]?.status ? (
                  <th data-cy="users-table-status-column-header">
                    {translator('header.organization.menus.manageUsers.status', 'Status')}
                  </th>
                ) : (
                  <th className="w-1"></th>
                )}
                {isLoadingAllUsers && (
                  <th data-cy="users-table-workspaces-column-header">
                    {translator('header.organization.menus.manageUsers.workspaces', 'Workspaces')}
                  </th>
                )}
                <th className="w-1"></th>
                <th className="w-1"></th>
                <th className="w-1"></th>
              </tr>
            </thead>
            {isLoading ? (
              <tbody className="w-100 h-auto">
                {Array.from(Array(4)).map((_item, index) => (
                  <tr key={index}>
                    <td className="col-2 p-3">
                      <div className="d-flex align-items-center">
                        <Skeleton circle="15%" className="col-auto" style={{ width: '35px', height: '35px' }} />
                        <Skeleton className="mx-3" width={100} />
                      </div>
                    </td>
                    <td className="col-4 p-3">
                      <Skeleton />
                    </td>
                    {users && users[0]?.status ? (
                      <td className="col-2 p-3">
                        <Skeleton />
                      </td>
                    ) : (
                      <td className="text-muted col-auto col-1 pt-3">
                        <Skeleton />
                      </td>
                    )}

                    {isLoadingAllUsers && (
                      <td className="text-muted col-auto col-1 pt-3">
                        <Skeleton />
                      </td>
                    )}

                    <td className="text-muted col-auto col-1 pt-3">
                      <Skeleton />
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                {Array.isArray(users) &&
                  users.length > 0 &&
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <Avatar
                          avatarId={user.avatar_id}
                          text={`${user.first_name ? user.first_name[0] : ''}${
                            user.last_name ? user.last_name[0] : ''
                          }`}
                        />
                        <span
                          className="mx-3 tj-text-sm"
                          data-cy={`${user.name.toLowerCase().replace(/\s+/g, '-')}-user-name`}
                        >
                          {user.name}
                        </span>
                      </td>
                      <td className="text-muted">
                        <a
                          className="text-reset user-email tj-text-sm"
                          data-cy={`${user.name.toLowerCase().replace(/\s+/g, '-')}-user-email`}
                        >
                          {user.email}
                        </a>
                      </td>
                      {isLoadingAllUsers && (
                        <td className="text-muted">
                          <span
                            className="text-muted user-type"
                            data-cy={`${user.name.toLowerCase().replace(/\s+/g, '-')}-user-type`}
                          >
                            {user.user_type}
                          </span>
                        </td>
                      )}
                      {user.status && (
                        <td className="text-muted">
                          <span
                            className={cx('badge', {
                              'tj-invited': user.status === 'invited',
                              'tj-archive': user.status === 'archived',
                              'tj-active': user.status === 'active',
                            })}
                            data-cy="status-badge"
                          ></span>
                          <small
                            className="workspace-user-status tj-text-sm text-capitalize"
                            data-cy={`${user.name.toLowerCase().replace(/\s+/g, '-')}-user-status`}
                          >
                            {user.status}
                          </small>
                          {user.status === 'invited' && 'invitation_token' in user ? (
                            <div className="workspace-clipboard-wrap">
                              <CopyToClipboard text={generateInvitationURL(user)} onCopy={invitationLinkCopyHandler}>
                                <span>
                                  <SolidIcon
                                    data-tooltip-id="tooltip-for-copy-invitation-link"
                                    data-tooltip-content="Copy invitation link"
                                    width="12"
                                    fill="#889096"
                                    name="copy"
                                  />
                                  <p
                                    className="tj-text-xsm"
                                    data-cy={`${user.name
                                      .toLowerCase()
                                      .replace(/\s+/g, '-')}-user-copy-invitation-link`}
                                  >
                                    Copy link
                                  </p>
                                </span>
                              </CopyToClipboard>
                              <Tooltip id="tooltip-for-copy-invitation-link" className="tooltip" />
                            </div>
                          ) : (
                            ''
                          )}
                        </td>
                      )}
                      {isLoadingAllUsers && (
                        <td className="text-muted">
                          <a
                            className="px-2 text-muted workspaces"
                            onClick={() => openOrganizationModal(user)}
                            data-cy={`${user.name.toLowerCase().replace(/\s+/g, '-')}-user-view-button`}
                          >
                            View ({user.total_organizations})
                          </a>
                        </td>
                      )}
                      {!isLoadingAllUsers ? (
                        <td>
                          <ButtonSolid
                            variant="dangerSecondary"
                            style={{ minWidth: '100px' }}
                            className="workspace-user-archive-btn tj-text-xsm"
                            disabled={unarchivingUser === user.id || archivingUser === user.id}
                            leftIcon="archive"
                            fill="#E54D2E"
                            iconWidth="12"
                            onClick={() => {
                              user.status === 'archived' ? unarchiveOrgUser(user.id) : archiveOrgUser(user.id);
                            }}
                            data-cy="button-user-status-change"
                          >
                            {user.status === 'archived'
                              ? translator('header.organization.menus.manageUsers.unarchive', 'Unarchive')
                              : translator('header.organization.menus.manageUsers.archive', 'Archive')}
                          </ButtonSolid>
                        </td>
                      ) : (
                        <td>
                          <ButtonSolid
                            variant="dangerSecondary"
                            style={{ minWidth: '100px' }}
                            className="workspace-user-archive-btn tj-text-xsm"
                            leftIcon="edit"
                            fill="#E54D2E"
                            iconWidth="12"
                            onClick={() => openEditModal(user)}
                            data-cy={`${user.name.toLowerCase().replace(/\s+/g, '-')}-user-edit-button`}
                          >
                            {translator('header.organization.menus.manageUsers.edit', 'Edit')}
                          </ButtonSolid>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            )}
          </table>
        </div>
        {meta?.total_count > 10 && (
          <Pagination
            currentPage={meta.current_page}
            count={meta.total_count}
            pageChanged={pageChanged}
            itemsPerPage={10}
            darkMode={darkMode}
          />
        )}
      </div>
    </div>
  );
};

export default UsersTable;
