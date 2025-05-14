import React, { useEffect, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Avatar from '@/_ui/Avatar';
import cx from 'classnames';
import { Pagination } from '@/_components';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Tooltip } from 'react-tooltip';
import UsersActionMenu from './components/UsersActionMenu';
import { humanizeifDefaultGroupName, decodeEntities } from '@/_helpers/utils';
import { ResetPasswordModal } from '@/_components/ResetPasswordModal';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { NoActiveWorkspaceModal } from './components/NoActiveWorkspaceModal';
import Spinner from 'react-bootstrap/Spinner';
import { ToolTip } from '@/_components/ToolTip';
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
  toggleEditUserDrawer,
  resetPassword = false,
  wsSettings = false,
}) => {
  const [isResetPasswordModalVisible, setIsResetPasswordModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showNoActiveWorkspaceModal, setShowNoActiveWorkspaceModal] = useState(false);
  const hideAccountSetupLink = window.public_config?.HIDE_ACCOUNT_SETUP_LINK == 'true';

  // Check if user has metadata
  const shouldShowMetadataColumn = wsSettings && Array.isArray(users) && users.some((user) => user.user_metadata);

  function showMetadataIcon(metadata) {
    if (!metadata) return false;
    for (const [key, value] of Object.entries(metadata)) {
      // Check if both key and value are not empty
      if (key.trim() !== '' && value.trim() !== '') {
        return true;
      }
    }
    return false;
  }

  const handleResetPasswordClick = (user) => {
    setSelectedUser(user);
    setIsResetPasswordModalVisible(true);
  };

  return (
    <div className="workspace-settings-table-wrap mb-4">
      <NoActiveWorkspaceModal
        show={showNoActiveWorkspaceModal}
        handleClose={() => {
          setShowNoActiveWorkspaceModal(false);
        }}
        darkMode={darkMode}
      />
      <div style={customStyles} className="tj-user-table-wrapper">
        <div className="card-table fixedHeader table-responsive">
          <table data-testid="usersTable" className="users-table table table-vcenter h-100">
            <thead>
              <tr>
                <th data-cy="users-table-name-column-header" data-name="name-header">
                  {translator('header.organization.menus.manageUsers.name', 'Name')}
                </th>
                {shouldShowMetadataColumn && (
                  <th data-cy="users-table-metadata-column-header" data-name="meta-header">
                    Metadata
                  </th>
                )}
                {!isLoadingAllUsers && (
                  <th data-cy="users-table-roles-column-header" data-name="role-header">
                    User role
                  </th>
                )}
                {isLoadingAllUsers && (
                  <th data-cy="users-table-type-column-header">
                    {translator('header.organization.menus.manageUsers.userType', 'Type')}
                  </th>
                )}
                {!isLoadingAllUsers && (
                  <th data-cy="users-table-groups-column-header" data-name="custom-header">
                    Custom groups
                  </th>
                )}
                {users && users[0]?.status ? (
                  <th data-cy="users-table-status-column-header" data-name={wsSettings ? 'status-header' : ''}>
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
                            <OverflowTooltip>{decodeEntities(user.name)}</OverflowTooltip>
                          </span>
                          <span
                            style={{ color: '#687076' }}
                            className="user-email mx-3  tj-text-xsm"
                            data-cy={`${user.name.toLowerCase().replace(/\s+/g, '-')}-user-email`}
                          >
                            <OverflowTooltip>{user.email}</OverflowTooltip>
                          </span>
                        </div>
                      </td>
                      {shouldShowMetadataColumn && (
                        <td data-name="meta-header">
                          <span className="text-muted user-type">
                            <div className={`metadata ${showMetadataIcon(user?.user_metadata) ? '' : 'empty'}`}>
                              {showMetadataIcon(user?.user_metadata) ? '{..}' : '-'}
                            </div>
                          </span>
                        </td>
                      )}
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
                      {!isLoadingAllUsers && (
                        <GroupChipTD groups={user.role_group.map((group) => group.name)} isRole={true} />
                      )}
                      {!isLoadingAllUsers && <GroupChipTD groups={user.groups.map((group) => group.name)} />}
                      {user.status && (
                        <td
                          className="text-muted"
                          data-name={wsSettings ? 'status-header' : ''}
                          style={{ marginRight: wsSettings ? '6px' : '0px' }}
                        >
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
                          {user.status === 'invited' && !hideAccountSetupLink && user?.invitation_token ? (
                            <div className="workspace-clipboard-wrap">
                              <CopyToClipboard text={generateInvitationURL(user)} onCopy={invitationLinkCopyHandler}>
                                <span>
                                  <SolidIcon
                                    data-tooltip-id="tooltip-for-copy-invitation-link"
                                    data-tooltip-content="Copy invitation link"
                                    width="10"
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
                            onClick={
                              user.total_organizations > 0
                                ? () => openOrganizationModal(user)
                                : () => {
                                    setShowNoActiveWorkspaceModal(true);
                                  }
                            }
                            data-cy={`${user.name.toLowerCase().replace(/\s+/g, '-')}-user-view-button`}
                          >
                            View ({user.total_organizations})
                          </a>
                        </td>
                      )}
                      <td className="user-actions-button">
                        <UsersActionMenu
                          archivingUser={archivingUser}
                          user={user}
                          unarchivingUser={unarchivingUser}
                          unarchiveOrgUser={unarchiveOrgUser}
                          archiveOrgUser={archiveOrgUser}
                          toggleEditUserDrawer={() => toggleEditUserDrawer(user)}
                          onResetPasswordClick={() => handleResetPasswordClick(user)}
                          resetPassword={resetPassword}
                        />
                      </td>
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
      {isResetPasswordModalVisible && (
        <ResetPasswordModal
          show={isResetPasswordModalVisible}
          closeModal={() => {
            setIsResetPasswordModalVisible(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}
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
