import React from 'react';
import cx from 'classnames';
import { groupPermissionV2Service, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import { Loader } from '../ManageSSO/Loader';
import SolidIcon from '@/_ui/Icon/solidIcons/index';
import BulkIcon from '@/_ui/Icon/bulkIcons/index';
import { FilterPreview, MultiSelectUser } from '@/_components';

import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import ModalBase from '@/_ui/Modal';
import Select from '@/_ui/Select';
import { ManageGranularAccess } from '@/ManageGranularAccess';
import './grpPermissionResc.theme.scss';
import { EDIT_ROLE_MESSAGE } from './constant';
import { SearchBox } from '@/_components/SearchBox';
import EditRoleErrorModal from '@/ManageGroupPermissionsV2/ErrorModal/ErrorModal';
import ChangeRoleModal from '@/ManageGroupPermissionResourcesV2/ChangeRoleModal';
import { ToolTip } from '@/_components/ToolTip';
import Avatar from '@/_ui/Avatar';

class ManageGroupPermissionResourcesComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoadingGroup: true,
      isLoadingApps: true,
      isAddingApps: false,
      isLoadingUsers: true,
      isAddingUsers: false,
      groupPermission: null,
      usersInGroup: [],
      appsInGroup: [],
      addableApps: [],
      usersNotInGroup: [],
      appsNotInGroup: [],
      selectedAppIds: [],
      removeAppIds: [],
      currentTab: 'users',
      selectedUsers: [],
      isChangeRoleModalOpen: false,
      updatingUserRole: null,
      isAddUsersToRoleModalOpen: false,
      isRoleGroup: false,
      selectedNewRole: '',
      showRoleEditMessage: false,
      showUserSearchBox: false,
      errorListItems: [],
      errorMessage: '',
      errorTitle: '',
      showEditRoleErrorModal: false,
      errorIconName: '',
      showAutoRoleChangeModal: false,
      autoRoleChangeModalMessage: '',
      autoRoleChangeModalList: [],
      autoRoleChangeMessageType: '',
      updateParam: {},
      isSearchLoading: false,
    };
  }

  componentDidMount() {
    if (this.props.groupPermissionId) this.fetchGroupAndResources(this.props.groupPermissionId);
  }

  componentDidUpdate(prevProps) {
    if (this.props.groupPermissionId && this.props.groupPermissionId !== prevProps.groupPermissionId) {
      this.fetchGroupAndResources(this.props.groupPermissionId);
      this.setState({
        showUserSearchBox: false,
      });
    }
  }

  fetchGroupPermission = (groupPermissionId) => {
    groupPermissionV2Service.getGroup(groupPermissionId).then(({ group, isBuilderLevel }) => {
      this.setState((prevState) => {
        return {
          isRoleGroup: group.type === 'default',
          groupPermission: group,
          currentTab: prevState.currentTab,
          isLoadingGroup: false,
          isBuilderLevel: isBuilderLevel,
        };
      });
      this.setSelectedUsers([]);
    });
  };

  fetchGroupAndResources = (groupPermissionId) => {
    this.setState({ isLoadingGroup: true });
    this.fetchGroupPermission(groupPermissionId);
    this.fetchUsersInGroup(groupPermissionId);
  };

  userFullName = (user) => {
    return `${user?.first_name} ${user?.last_name ?? ''}`;
  };

  searchUsersNotInGroup = async (query, groupPermissionId) => {
    return new Promise((resolve, reject) => {
      groupPermissionV2Service
        .getUsersNotInGroup(query, groupPermissionId)
        .then((users) => {
          resolve(
            users.map((user) => {
              return {
                name: `${this.userFullName(user)} (${user.email})`,
                value: user.id,
                first_name: user.firstName,
                last_name: user.lastName,
                email: user.email,
                role: user?.userGroups?.group?.name,
              };
            })
          );
        })
        .catch(reject);
    });
  };

  fetchUsersInGroup = (groupPermissionId, searchString = '') => {
    return groupPermissionV2Service.getUsersInGroup(groupPermissionId, searchString)
      .then((data) => {
        this.setState({
          usersInGroup: data,
          isLoadingUsers: false,
        });
      });
  };

  clearErrorState = () => {
    this.setState({
      errorMessage: '',
      showEditRoleErrorModal: false,
      errorListItems: [],
      errorTitle: '',
      errorIconName: '',
      selectedUsers: [],
      isLoadingUsers: false,
      isAddingUsers: false,
    });
  };

  updateGroupPermission = (groupPermissionId, params, allowRoleChange) => {
    const currentSession = authenticationService.currentSessionValue;
    groupPermissionV2Service
      .update(groupPermissionId, { ...params, allowRoleChange })
      .then(() => {
        toast.success('Group permissions updated');
        this.fetchGroupPermission(groupPermissionId);
      })
      .catch((e) => {
        const error = e?.error;
        if (error?.type) {
          this.setState({
            showAutoRoleChangeModal: true,
            autoRoleChangeModalMessage: error?.error,
            autoRoleChangeModalList: error?.data,
            autoRoleChangeMessageType: error?.type,
          });
          return;
        }
        // status code 451 - license error handled on separate modal
        if (e?.statusCode !== 451) {
          this.setState({
            errorMessage: error?.error,
            showEditRoleErrorModal: true,
            errorListItems: error?.data,
            errorTitle: error?.title ? error?.title : 'Cannot add this permission to the group',
            errorIconName: 'lock',
          });
        }
      });
  };

  setSelectedUsers = (value) => {
    this.setState({
      selectedUsers: value,
    });
  };

  setSelectedApps = (value) => {
    this.setState({
      selectedAppIds: value,
    });
  };

  addSelectedUsersToGroup = (groupPermissionId, selectedUsers, allowRoleChange) => {
    this.setState({ isAddingUsers: true });
    const body = {
      userIds: selectedUsers.map((user) => user.value),
      groupId: groupPermissionId,
      allowRoleChange,
    };
    groupPermissionV2Service
      .addUsersInGroups(body)
      .then(() => {
        this.setState({
          selectedUsers: [],
          isLoadingUsers: true,
          isAddingUsers: false,
        });
        toast.success('Users added to the group');
        this.fetchUsersInGroup(groupPermissionId);
      })
      .catch(({ error }) => {
        if (error?.type) {
          this.setState({
            isLoadingUsers: false,
            showAutoRoleChangeModal: true,
            autoRoleChangeModalMessage: error?.error,
            autoRoleChangeModalList: error?.data,
            autoRoleChangeMessageType: error?.type,
          });
          return;
        }
        this.setState({
          showEditRoleErrorModal: true,
          errorTitle: error?.title,
          errorMessage: error?.error,
          errorIconName: 'usergear',
          isAddingUsers: false,
        });
      });
  };

  removeUserFromGroup = (groupUserId) => {
    const { groupPermission } = this.state;
    groupPermissionV2Service
      .deleteUserFromGroup(groupUserId)
      .then(() => {
        this.setState({ removeUserIds: [], isLoadingUsers: true });
        this.fetchUsersInGroup(groupPermission.id);
      })
      .then(() => {
        toast.success('User removed from the group');
      })
      .catch(({ error }) => {
        toast.error(error);
      });
  };

  showPermissionText = () => {
    const { groupPermission } = this.state;
    const text =
      groupPermission.name === 'admin'
        ? 'Admin has edit access to all apps. These are not editable'
        : 'End-user can only have permission to view apps';
    return (
      <div className="manage-group-users-info">
        <p
          className="tj-text-xsm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          data-cy="helper-text-admin-app-access"
        >
          <SolidIcon name="informationcircle" fill="#3E63DD" /> {text}
          <a
            style={{ margin: '0', padding: '0', textDecoration: 'underline', color: '#3E63DD' }}
            href="https://docs.tooljet.com/docs/tutorial/manage-users-groups/"
            target="_blank"
            rel="noopener noreferrer"
          >
            read documentation
          </a>{' '}
          to know more !
        </p>
      </div>
    );
  };

  removeSelection = (selected, value) => {
    const updatedData = selected.filter((d) => d.value !== value);
    this.setSelectedUsers([...updatedData]);
  };

  setErrorState = (state = {}) => {
    this.setState({
      ...state,
    });
  };

  updateUserRole = () => {
    const { updatingUserRole, groupPermission, selectedNewRole } = this.state;
    const currentSession = authenticationService.currentSessionValue;
    const currentUser = currentSession?.current_user;
    this.setState({
      isLoadingUsers: true,
    });
    const body = {
      newRole: selectedNewRole,
      userId: updatingUserRole.id,
    };
    groupPermissionV2Service
      .updateUserRole(body)
      .then(() => {
        this.fetchUsersInGroup(groupPermission.id);
        toast.success('Role updated successfully');
        if (groupPermission?.name === 'admin') window.location.reload();
        if (currentUser.id === updatingUserRole.id) window.location.reload(true);
      })
      .catch(({ error }) => {
        this.setState({
          showEditRoleErrorModal: true,
          errorTitle: error?.title ? error?.title : 'Cannot update the user role',
          errorMessage: error.error,
          errorIconName: 'usergear',
          errorListItems: error.data,
        });
      })
      .finally(() => {
        this.closeChangeRoleModal();
      });
  };
  closeChangeRoleModal = () =>
    this.setState({
      isChangeRoleModalOpen: false,
      showRoleEditMessage: false,
      updatingUserRole: null,
      selectedNewRole: null,
      isLoadingUsers: false,
    });

  changeThisComponentState = (state = {}) => {
    this.setState(state);
  };

  generateSelection = (selected) => {
    return selected?.map((d) => {
      return (
        <div className="selected-item tj-ms tj-ms-usergroup" key={d.value}>
          <FilterPreview text={`${d?.email}`} onClose={() => this.removeSelection(selected, d.value)} />
        </div>
      );
    });
  };

  openChangeRoleModal = (updatingUser) =>
    this.setState({ isChangeRoleModalOpen: true, updatingUserRole: updatingUser });

  showChangeRoleModalMessage = () => {
    this.setState({ showRoleEditMessage: true });
  };

  handleUserSearchInGroup = (e) => {
    this.setState({ isSearchLoading: true });
    this.fetchUsersInGroup(this.props.groupPermissionId, e?.target?.value)
      .finally(() => {
        this.setState({ isSearchLoading: false });
      });
  };

  toggleUserTabSearchBox = () => {
    this.setState({ 
      showUserSearchBox: !this.state.showUserSearchBox 
    });

    if (this.state.showUserSearchBox) {
      this.setState({ isSearchLoading: true });
      this.fetchUsersInGroup(this.props.groupPermissionId)
        .finally(() => {
          this.setState({ isSearchLoading: false });
        });
    }
  };

  toggleAutoRoleChangeModal = () => {
    this.setState((prevState) => ({
      showAutoRoleChangeModal: !prevState.showAutoRoleChangeModal,
    }));
  };
  handleAutoRoleChangeModalClose = () => {
    this.setState({
      showAutoRoleChangeModal: false,
      autoRoleChangeModalMessage: '',
      autoRoleChangeModalList: [],
      autoRoleChangeMessageType: '',
      updateParam: {},
      isLoadingGroup: false,
      isLoadingUsers: false,
      isAddingUsers: false,
    });
  };

  renderUserChangeMessage = (type) => {
    const changePermissionMessage = (
      <p className="tj-text-sm">
        Granting this permission to the user group will result in a role change for the following user(s) from{' '}
        <b>end-users</b> to <b>builders</b>. Are you sure you want to continue?
      </p>
    );
    const addUserMessage = (
      <p className="tj-text-sm">
        Adding the following user(s) to this group will change their default group from <b>end-users</b> to{' '}
        <b>builders</b>. Are you sure you want to continue?
      </p>
    );
    const message = type === 'USER_ROLE_CHANGE_ADD_USERS' ? addUserMessage : changePermissionMessage;
    return message;
  };

  toggleAddUsersToRoleModal = () => this.setState({ isAddUsersToRoleModalOpen: !this.state.isAddUsersToRoleModalOpen });

  handleConfirmAutoRoleChangeGroupUpdate = () => {
    const { updateParam, groupPermission } = this.state;
    this.updateGroupPermission(groupPermission.id, updateParam, true);
    this.setState({
      updateParam: {},
    });
    this.handleAutoRoleChangeModalClose();
  };

  handleConfirmAutoRoleChangeAddUser = () => {
    const { groupPermission, selectedUsers } = this.state;
    this.addSelectedUsersToGroup(groupPermission?.id, selectedUsers, true);
    this.handleAutoRoleChangeModalClose();
  };

  render() {
    if (!this.props.groupPermissionId) return null;

    const {
      isLoadingGroup,
      isLoadingUsers,
      isAddingUsers,
      appsNotInGroup,
      usersInGroup,
      groupPermission,
      currentTab,
      selectedUsers,
      isChangeRoleModalOpen,
      isAddUsersToRoleModalOpen,
      updatingUserRole,
      isRoleGroup,
      selectedNewRole,
      showRoleEditMessage,
      showUserSearchBox,
      errorListItems,
      errorMessage,
      errorTitle,
      showEditRoleErrorModal,
      errorIconName,
      showAutoRoleChangeModal,
      autoRoleChangeModalMessage,
      autoRoleChangeModalList,
      autoRoleChangeMessageType,
      isSearchLoading,
    } = this.state;
    const isBasicPlan = false;
    const isPaidPlan = false;

    const searchSelectClass = this.props.darkMode ? 'select-search-dark' : 'select-search';
    const showPermissionInfo =
      isRoleGroup && (groupPermission?.name === 'admin' || groupPermission?.name === 'end-user');
    const disablePermissionUpdate =
      isBasicPlan || groupPermission?.name === 'admin' || groupPermission?.name === 'end-user';

    return (
      <ErrorBoundary showFallback={false}>
        <EditRoleErrorModal
          darkMode={this.props.darkMode}
          show={showEditRoleErrorModal}
          errorMessage={errorMessage}
          errorTitle={errorTitle}
          listItems={errorListItems}
          iconName={errorIconName}
          onClose={this.clearErrorState}
        />
        <ModalBase
          title={
            <div className="my-3" data-cy="modal-title">
              <span className="tj-text-md font-weight-500">Edit user role</span>
              <div className="tj-text-sm text-muted" data-cy="user-email">
                {updatingUserRole?.email}
              </div>
            </div>
          }
          handleConfirm={
            EDIT_ROLE_MESSAGE?.[groupPermission?.name]?.[selectedNewRole] && !showRoleEditMessage
              ? this.showChangeRoleModalMessage
              : this.updateUserRole
          }
          show={isChangeRoleModalOpen}
          isLoading={isLoadingUsers}
          handleClose={this.closeChangeRoleModal}
          confirmBtnProps={{ title: 'Continue', disabled: !selectedNewRole, tooltipMessage: false }}
          darkMode={this.props.darkMode}
          className="edit-role-confirm"
        >
          {selectedNewRole && showRoleEditMessage ? (
            <div>{EDIT_ROLE_MESSAGE?.[groupPermission?.name]?.[selectedNewRole](isPaidPlan)}</div>
          ) : (
            <div>
              <label className="form-label" data-cy="user-role-label">
                User role
              </label>
              <Select
                options={this.props.roleOptions.filter((group) => group.value !== groupPermission?.name)}
                value={selectedNewRole}
                width={'100%'}
                useMenuPortal={false}
                onChange={(selectedOption) => {
                  this.setState({
                    selectedNewRole: selectedOption,
                  });
                }}
                placeholder="Select new role of user"
              />
              <div className="info-container">
                <div className="col-md-1 info-btn">
                  <SolidIcon name="informationcircle" fill="#3E63DD" />
                </div>
                <div className="col-md-11">
                  <div className="message" data-cy="warning-text">
                    <p style={{ lineHeight: '18px' }}>
                      Users must be always be part of one default group. This will define the user count in your plan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModalBase>
        <ChangeRoleModal
          showAutoRoleChangeModal={showAutoRoleChangeModal}
          autoRoleChangeModalList={autoRoleChangeModalList}
          autoRoleChangeMessageType={autoRoleChangeMessageType}
          handleAutoRoleChangeModalClose={this.handleAutoRoleChangeModalClose}
          handleConfirmation={
            autoRoleChangeMessageType === 'USER_ROLE_CHANGE_ADD_USERS'
              ? this.handleConfirmAutoRoleChangeAddUser
              : this.handleConfirmAutoRoleChangeGroupUpdate
          }
          darkMode={this.props.darkMode}
          isLoading={isLoadingGroup || isLoadingUsers}
        />
        <div className="org-users-page animation-fade">
          {isLoadingGroup || isLoadingUsers ? (
            <Loader />
          ) : (
            <div>
              <div className="justify-content-between d-flex groups-main-header-wrap">
                <p
                  className="font-weight-500 tj-text-md"
                  data-cy={`${this.props.selectedGroup.toLowerCase().replace(/\s+/g, '-')}-title`}
                >
                  {`${this.props.selectedGroup} (${usersInGroup.length})`}
                </p>
                {groupPermission.type === 'default' && (
                  <ToolTip message={'Every user must be part of one default group'}>
                    <div className="default-group-wrap">
                      <SolidIcon name="information" fill="#46A758" width="15" />
                      <p className="font-weight-500 tj-text-sm" data-cy="text-default-group">
                        Default group
                      </p>
                    </div>
                  </ToolTip>
                )}
                {groupPermission.type === 'custom' && (
                  <div className="user-group-actions">
                    <Link
                      onClick={() => this.props.updateGroupName(groupPermission)}
                      data-cy="group-name-update-link"
                      className="tj-text-xsm font-weight-500 edit-group"
                    >
                      <SolidIcon name="editrectangle" width="14" />
                      Rename
                    </Link>
                  </div>
                )}
              </div>

              <nav className="nav nav-tabs groups-sub-header-wrap">
                <a
                  onClick={() => {
                    this.setState({ currentTab: 'users', showUserSearchBox: false });
                    this.setSelectedUsers([]);
                  }}
                  className={cx('nav-item nav-link', { active: currentTab === 'users' })}
                  data-cy="users-link"
                >
                  <SolidIcon
                    name="usergroup"
                    fill={currentTab === 'users' ? '#3E63DD' : '#C1C8CD'}
                    className="manage-group-tab-icons"
                    width="16"
                  ></SolidIcon>

                  {this.props.t('header.organization.menus.manageGroups.permissionResources.users', 'Users')}
                </a>

                <a
                  onClick={() => {
                    this.setState({ currentTab: 'permissions', showUserSearchBox: false });
                    this.setSelectedUsers([]);
                  }}
                  className={cx('nav-item nav-link', { active: currentTab === 'permissions' })}
                  data-cy="permissions-link"
                >
                  <SolidIcon
                    className="manage-group-tab-icons"
                    fill={currentTab === 'permissions' ? '#3E63DD' : '#C1C8CD'}
                    name="lock"
                    width="16"
                  ></SolidIcon>

                  {this.props.t(
                    'header.organization.menus.manageGroups.permissionResources.permissions',
                    'Permissions'
                  )}
                </a>
                <a
                  onClick={() => {
                    this.setState({ currentTab: 'granularAccess', showUserSearchBox: false });
                    this.setSelectedUsers([]);
                  }}
                  className={cx('nav-item nav-link', { active: currentTab === 'granularAccess' })}
                  data-cy="granular-access-link"
                >
                  <SolidIcon
                    className="manage-group-tab-icons"
                    fill={currentTab === 'granularAccess' ? '#3E63DD' : '#C1C8CD'}
                    name="granularaccess"
                    width="16"
                  ></SolidIcon>
                  Granular access
                </a>
              </nav>

              <div className="manage-groups-body">
                <div className="tab-content">
                  {/* Users Tab */}
                  <div className={`tab-pane ${currentTab === 'users' ? 'active show' : ''}`}>
                    {!isRoleGroup && (
                      <div className="row">
                        <div className="col" data-cy="multi-select-search">
                          <MultiSelectUser
                            className={{
                              container: searchSelectClass,
                              value: `${searchSelectClass}__value`,
                              input: `${searchSelectClass}__input`,
                              select: `${searchSelectClass}__select`,
                              options: `${searchSelectClass}__options`,
                              row: `${searchSelectClass}__row`,
                              option: `${searchSelectClass}__option`,
                              group: `${searchSelectClass}__group`,
                              'group-header': `${searchSelectClass}__group-header`,
                              'is-selected': 'is-selected',
                              'is-highlighted': 'is-highlighted',
                              'is-loading': 'is-loading',
                              'is-multiple': 'is-multiple',
                              'has-focus': 'has-focus',
                              'not-found': `${searchSelectClass}__not-found`,
                            }}
                            onSelect={this.setSelectedUsers}
                            onSearch={(query) => this.searchUsersNotInGroup(query, groupPermission.id)}
                            selectedValues={selectedUsers}
                            onReset={() => this.setSelectedUsers([])}
                            placeholder="Select users to add to the group"
                            searchLabel="Enter name or email"
                          />
                        </div>
                        <div className="col-auto">
                          <ButtonSolid
                            onClick={() => this.addSelectedUsersToGroup(groupPermission?.id, selectedUsers)}
                            disabled={selectedUsers.length === 0}
                            leftIcon="plus"
                            fill={selectedUsers.length !== 0 ? '#ffffff' : this.props.darkMode ? '#131620' : '#C1C8CD'}
                            iconWidth="16"
                            className="add-users-button"
                            isLoading={isAddingUsers}
                            data-cy={`${String(groupPermission.group)
                              .toLowerCase()
                              .replace(/\s+/g, '-')}-group-add-button`}
                          >
                            Add users
                          </ButtonSolid>
                        </div>
                        {selectedUsers.length > 0 && (
                          <div className="row mt-2">
                            <div className="selected-section">
                              <div className="selected-text">Selected Users :</div>
                              {this.generateSelection(selectedUsers)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <br />
                    <div>
                      {showUserSearchBox ? (
                        <div className="searchbox-custom">
                          <SearchBox
                            dataCy={`user-group`}
                            width="600px !important"
                            callBack={this.handleUserSearchInGroup}
                            placeholder={'Search'}
                            customClass="tj-common-search-input-user"
                            onClearCallback={this.toggleUserTabSearchBox}
                            autoFocus={true}
                          />
                        </div>
                      ) : (
                        <div className="manage-group-table-head">
                          <ButtonSolid
                            onClick={(e) => {
                              e.preventDefault();
                              this.toggleUserTabSearchBox();
                            }}
                            size="xsm"
                            rightIcon="search"
                            iconWidth="15"
                            fill="#889096"
                            className="search-user-group-btn"
                          />
                          <p className="tj-text-xsm" data-cy="name-header" style={{ padding: '10px' }}>
                            User name
                          </p>
                          <p className="tj-text-xsm" data-cy="email-header">
                            Email id
                          </p>
                          <p className="tj-text-xsm"></p> {/* DO NOT REMOVE FOR TABLE ALIGNMENT  */}
                        </div>
                      )}

                      <section className="group-users-list-container">
                        {(isLoadingGroup || isLoadingUsers || this.state.isSearchLoading) ? (
                          <tr>
                            <td className="col-auto">
                              <div className="row">
                                <div className="skeleton-line w-10 col mx-3"></div>
                              </div>
                            </td>
                            <td className="col-auto">
                              <div className="skeleton-line w-10"></div>
                            </td>
                            <td className="col-auto">
                              <div className="skeleton-line w-10"></div>
                            </td>
                          </tr>
                        ) : usersInGroup.length > 0 ? (
                          usersInGroup.map((item) => {
                            const user = item.user;
                            const groupUserId = item.id;
                            return (
                              <div
                                key={user.id}
                                className="manage-group-users-row"
                                data-cy={`${String(user.email).toLowerCase().replace(/\s+/g, '-')}-user-row`}
                                style={{ alignItems: 'center' }}
                              >
                                <p className="tj-text-sm d-flex align-items-center">
                                  <Avatar
                                    className="name-avatar"
                                    avatarId={user?.avatarId}
                                    text={`${user.firstName ? user.firstName[0] : ''}${
                                      user.lastName ? user.lastName[0] : ''
                                    }`}
                                  />
                                  <span>{`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}</span>
                                </p>
                                <p className="tj-text-sm d-flex align-items-center" style={{ paddingLeft: '12px' }}>
                                  <span> {user.email}</span>
                                </p>
                                <p className="tj-text-sm d-flex align-items-center">
                                  <div className="d-flex align-items-center edit-role-btn">
                                    {!isRoleGroup && (
                                      <Link to="#" className="remove-decoration">
                                        <ButtonSolid
                                          variant="dangerSecondary"
                                          className="apps-remove-btn remove-decoration tj-text-xsm font-weight-600"
                                          onClick={() => {
                                            this.removeUserFromGroup(groupUserId);
                                          }}
                                          leftIcon="remove"
                                          fill="#F3B0A2"
                                          iconWidth="18"
                                          data-cy="remove-button"
                                        >
                                          {this.props.t('globals.remove', 'Remove')}
                                        </ButtonSolid>
                                      </Link>
                                    )}
                                  </div>
                                  {isRoleGroup && (
                                    <div className="edit-role-btn">
                                      <ButtonSolid
                                        variant="tertiary"
                                        iconWidth="17"
                                        fill="var(--slate9)"
                                        className="apps-remove-btn remove-decoration tj-text-xsm font-weight-600"
                                        leftIcon="editable"
                                        onClick={() => {
                                          this.openChangeRoleModal(user);
                                        }}
                                        data-cy="edit-role-button"
                                      >
                                        Edit role
                                      </ButtonSolid>
                                    </div>
                                  )}
                                </p>
                              </div>
                            );
                          })
                        ) : !showUserSearchBox ? (
                          <div className="manage-groups-no-apps-wrap">
                            <div className="manage-groups-no-apps-icon" data-cy="user-empty-page-icon">
                              <BulkIcon name="users" fill="#3E63DD" width="48" />
                            </div>
                            <p className="tj-text-md font-weight-500" data-cy="user-empty-page">
                              No users added yet
                            </p>
                            <span className="tj-text-sm text-center" data-cy="user-empty-page-info-text">
                              Add users to this group to configure
                              <br /> permissions for them!
                            </span>
                          </div>
                        ) : (
                          <div className="manage-groups-no-apps-wrap">
                            <div className="manage-groups-no-apps-icon" data-cy="user-empty-page-icon">
                              <SolidIcon name="warning-user-notfound" width="48" />
                            </div>
                            <p className="tj-text-md font-weight-500" data-cy="user-empty-page">
                              No results found
                            </p>
                            <span className="tj-text-sm text-center" data-cy="user-empty-page-info-text">
                              There were no results found for your search. Please <br />
                              try changing the filters and try again.
                            </span>
                          </div>
                        )}
                      </section>
                    </div>
                  </div>

                  {/* Permissions Tab */}

                  <aside className={`tab-pane ${currentTab === 'permissions' ? 'active show' : ''}`}>
                    <div>
                      <div>
                        <div>
                          {showPermissionInfo && this.showPermissionText()}
                          <div className="manage-group-permision-header">
                            <p data-cy="resource-header" className="tj-text-xsm">
                              {this.props.t(
                                'header.organization.menus.manageGroups.permissionResources.resource',
                                'Resource'
                              )}
                            </p>
                            <p data-cy="permissions-header" className="tj-text-xsm">
                              {this.props.t(
                                'header.organization.menus.manageGroups.permissionResources.permissions',
                                'Permissions'
                              )}
                            </p>
                          </div>
                          <div className="permission-body">
                            {isLoadingGroup ? (
                              <tr>
                                <td className="col-auto">
                                  <div className="row">
                                    <div className="skeleton-line w-10 col mx-3"></div>
                                  </div>
                                </td>
                                <td className="col-auto">
                                  <div className="skeleton-line w-10"></div>
                                </td>
                                <td className="col-auto">
                                  <div className="skeleton-line w-10"></div>
                                </td>
                              </tr>
                            ) : (
                              <>
                                <div className="manage-groups-permission-apps">
                                  <div data-cy="resource-apps">
                                    {this.props.t(
                                      'header.organization.menus.manageGroups.permissionResources.apps',
                                      'Apps'
                                    )}
                                  </div>
                                  <div className="text-muted">
                                    <div className="d-flex apps-permission-wrap flex-column">
                                      <label className="form-check form-check-inline">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          onChange={() => {
                                            this.updateGroupPermission(groupPermission.id, {
                                              appCreate: !groupPermission.appCreate,
                                            });
                                            this.setState({
                                              updateParam: { appCreate: !groupPermission.appCreate },
                                            });
                                          }}
                                          checked={groupPermission.appCreate}
                                          disabled={disablePermissionUpdate}
                                          data-cy="app-create-checkbox"
                                        />
                                        <span className="form-check-label" data-cy="app-create-label">
                                          {this.props.t('globals.create', 'Create')}
                                        </span>
                                        <span
                                          class={`tj-text-xxsm ${disablePermissionUpdate && 'check-label-disable'}`}
                                          data-cy="app-create-helper-text"
                                        >
                                          Create apps in this workspace
                                        </span>
                                      </label>
                                      <label className="form-check form-check-inline">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          onChange={() => {
                                            this.updateGroupPermission(groupPermission.id, {
                                              appDelete: !groupPermission.appDelete,
                                            });
                                            this.setState({
                                              updateParam: { appDelete: !groupPermission.appDelete },
                                            });
                                          }}
                                          checked={groupPermission.appDelete}
                                          disabled={disablePermissionUpdate}
                                          data-cy="app-delete-checkbox"
                                        />
                                        <span className="form-check-label" data-cy="app-delete-label">
                                          {this.props.t('globals.delete', 'Delete')}
                                        </span>
                                        <span
                                          class={`tj-text-xxsm ${disablePermissionUpdate && 'check-label-disable'}`}
                                          data-cy="app-delete-helper-text"
                                        >
                                          Delete any app in this workspace
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                <div className="apps-folder-permission-wrap">
                                  <div data-cy="resource-folders">
                                    {this.props.t(
                                      'header.organization.menus.manageGroups.permissionResources.folder',
                                      'Folder'
                                    )}
                                  </div>
                                  <div className="text-muted">
                                    <div>
                                      <label className="form-check form-check-inline">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          onChange={() => {
                                            this.updateGroupPermission(groupPermission.id, {
                                              folderCRUD: !groupPermission.folderCRUD,
                                            });
                                            this.setState({
                                              updateParam: { folderCRUD: !groupPermission.folderCRUD },
                                            });
                                          }}
                                          checked={groupPermission.folderCRUD}
                                          disabled={disablePermissionUpdate}
                                          data-cy="folder-create-checkbox"
                                        />
                                        <span className="form-check-label" data-cy="folder-create-label">
                                          {this.props.t(
                                            'header.organization.menus.manageGroups.permissionResources.createUpdateDelete',
                                            'Create/Update/Delete'
                                          )}
                                        </span>
                                        <span
                                          class={`tj-text-xxsm ${disablePermissionUpdate && 'check-label-disable'}`}
                                          data-cy="folder-helper-text"
                                        >
                                          All operations on folders
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                                <div className="apps-variable-permission-wrap">
                                  <div data-cy="resource-workspace-variable">
                                    {this.props.t('globals.environmentVar', 'Workspace constant/variable')}
                                  </div>
                                  <div className="text-muted">
                                    <div>
                                      <label className="form-check form-check-inline">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          onChange={() => {
                                            this.updateGroupPermission(groupPermission.id, {
                                              orgConstantCRUD: !groupPermission.orgConstantCRUD,
                                            });
                                            this.setState({
                                              updateParam: { orgConstantCRUD: !groupPermission.orgConstantCRUD },
                                            });
                                          }}
                                          checked={groupPermission.orgConstantCRUD}
                                          disabled={disablePermissionUpdate}
                                          data-cy="env-variable-checkbox"
                                        />
                                        <span className="form-check-label" data-cy="workspace-variable-create-label">
                                          {this.props.t(
                                            'header.organization.menus.manageGroups.permissionResources.createUpdateDelete',
                                            'Create/Update/Delete'
                                          )}
                                        </span>
                                        <span
                                          class={`tj-text-xxsm ${disablePermissionUpdate && 'check-label-disable'}`}
                                          data-cy="workspace-constants-helper-text"
                                        >
                                          All operations on workspace constants
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>

                  {/* Granular Access */}
                  <aside className={`tab-pane ${currentTab === 'granularAccess' ? 'active show' : ''}`}>
                    <ManageGranularAccess
                      groupPermissionId={groupPermission.id}
                      groupPermission={groupPermission}
                      setErrorState={this.setErrorState}
                      updateParentState={this.changeThisComponentState}
                      fetchGroup={this.fetchGroupPermission}
                      darkMode={this.props.darkMode}
                    />
                  </aside>
                </div>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    );
  }
}

export const ManageGroupPermissionResourcesV2 = withTranslation()(ManageGroupPermissionResourcesComponent);
