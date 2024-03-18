import React, { useEffect, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Avatar from '@/_ui/Avatar';
import Skeleton from 'react-loading-skeleton';
import cx from 'classnames';
import { Pagination } from '@/_components';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Tooltip } from 'react-tooltip';
import UsersActionMenu from './UsersActionMenu';
import { humanizeifDefaultGroupName } from '@/_helpers/utils';

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
  toggleEditUserDrawer,
}) => {
  return (
    <div className="workspace-settings-table-wrap mb-4">
      <div className="tj-user-table-wrapper">
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
                <th data-cy="users-table-groups-column-header">Groups</th>
                {users && users[0]?.status ? (
                  <th data-cy="users-table-status-column-header">
                    {translator('header.organization.menus.manageUsers.status', 'Status')}
                  </th>
                ) : (
                  <th className="w-1"></th>
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
                      <td>
                        <Avatar
                          avatarId={user.avatar_id}
                          text={`${user.first_name ? user.first_name[0] : ''}${
                            user.last_name ? user.last_name[0] : ''
                          }`}
                        />
                        <span
                          className="mx-3 tj-text tj-text-sm"
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
                      <GroupChipTD groups={user.groups} />
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
                      <td className="user-actions-button" data-cy="user-actions-button">
                        <UsersActionMenu
                          archivingUser={archivingUser}
                          user={user}
                          unarchivingUser={unarchivingUser}
                          unarchiveOrgUser={unarchiveOrgUser}
                          archiveOrgUser={archiveOrgUser}
                          toggleEditUserDrawer={() => toggleEditUserDrawer(user)}
                        />
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

const GroupChipTD = ({ groups = [] }) => {
  const [showAllGroups, setShowAllGroups] = useState(false);
  const groupsListRef = useRef();

  useEffect(() => {
    const onCloseHandler = (e) => {
      if (groupsListRef.current && !groupsListRef.current.contains(e.target)) {
        setShowAllGroups(false);
      }
    };

    window.addEventListener('click', onCloseHandler);
    return () => {
      window.removeEventListener('click', onCloseHandler);
    };
  }, [showAllGroups]);

  function moveValuesToLast(arr, valuesToMove) {
    const validValuesToMove = valuesToMove.filter((value) => arr.includes(value));

    validValuesToMove.forEach((value) => {
      const index = arr.indexOf(value);
      if (index !== -1) {
        const removedItem = arr.splice(index, 1);
        arr.push(removedItem[0]);
      }
    });

    return arr;
  }

  const orderedArray = moveValuesToLast(groups, ['all_users', 'admin']);

  const toggleAllGroupsList = (e) => {
    setShowAllGroups(!showAllGroups);
  };

  const renderGroupChip = (group, index) => (
    <span className="group-chip" key={index} data-cy="group-chip">
      {humanizeifDefaultGroupName(group)}
    </span>
  );

  return (
    <td
      data-active={showAllGroups}
      ref={groupsListRef}
      onClick={(e) => {
        orderedArray.length > 2 && toggleAllGroupsList(e);
      }}
      className={cx('text-muted groups-name-cell', { 'groups-hover': orderedArray.length > 2 })}
    >
      <div className="groups-name-container tj-text-sm font-weight-500">
        {orderedArray.slice(0, 2).map((group, index) => {
          if (orderedArray.length <= 2) {
            return renderGroupChip(group, index);
          }

          if (orderedArray.length > 2) {
            if (index === 1) {
              return (
                <>
                  <span className="group-chip" key={index}>
                    {' '}
                    +{orderedArray.length - 1} more
                  </span>
                  {showAllGroups && (
                    <div className="all-groups-list">{groups.map((group, index) => renderGroupChip(group, index))}</div>
                  )}
                </>
              );
            }
            return renderGroupChip(group, index);
          }
        })}
      </div>
    </td>
  );
};
