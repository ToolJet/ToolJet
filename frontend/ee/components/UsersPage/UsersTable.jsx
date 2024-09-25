import React, { useEffect, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Avatar from '@/_ui/Avatar';
import cx from 'classnames';
import { Pagination } from '@/_components';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Tooltip } from 'react-tooltip';
import UsersActionMenu from './UsersActionMenu';
import { humanizeifDefaultGroupName, decodeEntities } from '@/_helpers/utils';
import { ToolTip } from '@/_components/ToolTip';

import Spinner from 'react-bootstrap/Spinner';
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
        <div className="card-table fixedHeader table-responsive">
          <table data-testid="usersTable" className="users-table table table-vcenter h-100">
            <thead>
              <tr>
                <th data-cy="users-table-name-column-header">
                  {translator('header.organization.menus.manageUsers.name', 'Name')}
                </th>
                <th data-cy="users-table-roles-column-header" data-name="role-header">
                  User role
                </th>
                <th data-cy="users-table-groups-column-header">Custom groups</th>
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 'calc(100vh - 270px)',
                }}
              >
                <Spinner variant="primary" />
              </div>
            ) : (
              <tbody>
                {Array.isArray(users) &&
                  users.length > 0 &&
                  users.map((user) => (
                    <tr key={user.id} data-cy={`${user.name.toLowerCase().replace(/\s+/g, '-')}-user-row`}>
                      <td>
                        <Avatar
                          avatarId={user.avatar_id}
                          text={`${user.first_name ? user.first_name[0] : ''}${
                            user.last_name ? user.last_name[0] : ''
                          }`}
                        />
                        <div className="user-detail">
                          <span
                            className="mx-3 tj-text tj-text-sm"
                            data-cy={`${user.name.toLowerCase().replace(/\s+/g, '-')}-user-name`}
                          >
                            {decodeEntities(user.name)}
                          </span>
                          <span
                            style={{ color: '#687076' }}
                            className="user-email mx-3  tj-text-xsm"
                            data-cy={`${user.name.toLowerCase().replace(/\s+/g, '-')}-user-email`}
                          >
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <GroupChipTD groups={user.role_group.map((group) => group.name)} isRole={true} />
                      <GroupChipTD groups={user.groups.map((group) => group.name)} />
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

const GroupChipTD = ({ groups = [], isRole = false }) => {
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

  const orderedArray = groups;

  const toggleAllGroupsList = (e) => {
    setShowAllGroups(!showAllGroups);
  };

  const renderGroupChip = (group, index) => (
    <ToolTip message={group}>
      <span className="group-chip" key={index} data-cy="group-chip">
        {humanizeifDefaultGroupName(group)}
      </span>
    </ToolTip>
  );

  return (
    <td
      data-name={isRole ? 'role-header' : ''}
      data-active={showAllGroups}
      ref={groupsListRef}
      onClick={(e) => {
        orderedArray.length > 2 && toggleAllGroupsList(e);
      }}
      className={cx('text-muted groups-name-cell', { 'groups-hover': orderedArray.length > 2 })}
    >
      <div className="groups-name-container tj-text-sm font-weight-500">
        {orderedArray.length === 0 ? (
          <div className="empty-text">-</div>
        ) : (
          orderedArray.slice(0, 2).map((group, index) => {
            if (orderedArray.length <= 2) {
              return renderGroupChip(group, index);
            }

            if (orderedArray.length > 2 && index === 1) {
              return (
                <React.Fragment key={index}>
                  {renderGroupChip(group, index)}
                  <span className="group-chip">+{orderedArray.length - 2} more</span>
                  {showAllGroups && (
                    <div className="all-groups-list">
                      {orderedArray.slice(2).map((group, index) => renderGroupChip(group, index))}
                    </div>
                  )}
                </React.Fragment>
              );
            }

            return renderGroupChip(group, index);
          })
        )}
      </div>
    </td>
  );
};
