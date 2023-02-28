import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Avatar from '../../../src/_ui/Avatar';
import Skeleton from 'react-loading-skeleton';
import cx from 'classnames';
import { Pagination } from '@/_components';
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
}) => {
  return (
    <div className="container-xl mb-4">
      <div className="card">
        <div className="card-table fixedHeader table-responsive table-bordered">
          <table data-testid="usersTable" className="table table-vcenter h-100">
            <thead>
              <tr>
                <th data-cy="name-title">{translator('header.organization.menus.manageUsers.name', 'Name')}</th>
                <th data-cy="email-title">{translator('header.organization.menus.manageUsers.email', 'Email')}</th>
                {users && users[0]?.status ? (
                  <th data-cy="status-title">{translator('header.organization.menus.manageUsers.status', 'Status')}</th>
                ) : (
                  <th className="w-1"></th>
                )}
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
                    {users && users[0]?.status && (
                      <td className="col-2 p-3">
                        <Skeleton />
                      </td>
                    )}
                    <td className="text-muted col-auto col-1 pt-3">
                      <Skeleton />
                    </td>
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
                      <td className="d-flex align-items-center">
                        <Avatar
                          avatarId={user.avatar_id}
                          text={`${user.first_name ? user.first_name[0] : ''}${
                            user.last_name ? user.last_name[0] : ''
                          }`}
                        />
                        <span className="mx-3" data-cy="user-name">
                          {user.name}
                        </span>
                      </td>
                      <td className="text-muted">
                        <a className="text-reset user-email" data-cy="user-email">
                          {user.email}
                        </a>
                      </td>
                      {user.status && (
                        <td className="text-muted">
                          <span
                            className={cx('badge me-1 m-1', {
                              'bg-warning': user.status === 'invited',
                              'bg-danger': user.status === 'archived',
                              'bg-success': user.status === 'active',
                            })}
                            data-cy="status-badge"
                          ></span>
                          <small className="user-status" data-cy="user-status">
                            {user.status}
                          </small>
                          {user.status === 'invited' && 'invitation_token' in user ? (
                            <>
                              <CopyToClipboard text={generateInvitationURL(user)} onCopy={invitationLinkCopyHandler}>
                                <img
                                  data-tooltip-id="tooltip-for-copy-invitation-link"
                                  data-tooltip-content="Copy invitation link"
                                  className="svg-icon cursor-pointer"
                                  src="assets/images/icons/copy.svg"
                                  width="15"
                                  height="15"
                                  data-cy="copy-invitation-link"
                                ></img>
                              </CopyToClipboard>
                              <Tooltip id="tooltip-for-copy-invitation-link" className="tooltip" />
                            </>
                          ) : (
                            ''
                          )}
                        </td>
                      )}
                      <td>
                        <button
                          type="button"
                          style={{ minWidth: '100px' }}
                          className={cx('btn btn-sm', {
                            'btn-outline-success': user.status === 'archived',
                            'btn-outline-danger': user.status === 'active' || user.status === 'invited',
                            'btn-loading': unarchivingUser === user.id || archivingUser === user.id,
                          })}
                          disabled={unarchivingUser === user.id || archivingUser === user.id}
                          onClick={() => {
                            user.status === 'archived' ? unarchiveOrgUser(user.id) : archiveOrgUser(user.id);
                          }}
                          data-cy="user-state"
                        >
                          {user.status === 'archived'
                            ? translator('header.organization.menus.manageUsers.unarchive', 'Unarchive')
                            : translator('header.organization.menus.manageUsers.archive', 'Archive')}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            )}
          </table>
        </div>
        {meta.total_count > 10 && (
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
