import React from 'react';
import cx from 'classnames';
import { groupPermissionV2Service, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import ErrorBoundary from '@/_ui/ErrorBoundary';
import SolidIcon from '@/_ui/Icon/solidIcons/index';
import BulkIcon from '@/_ui/Icon/bulkIcons/index';
import { FilterPreview, MultiSelectUser } from '@/_components';

import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import ModalBase from '@/_ui/Modal';
import Select from '@/_ui/Select';
import ManageGranularAccess from '../ManageGranularAccess';
import './resources/styles/group-permission-resources.styles.scss';
import { EDIT_ROLE_MESSAGE } from '@/modules/common/constants';
import { SearchBox } from '@/_components/SearchBox';
import { EditRoleErrorModal, Loader } from '@/modules/common/components';
import ChangeRoleModal from '../ChangeRoleModal';
import { ToolTip } from '@/_components/ToolTip';
import Avatar from '@/_ui/Avatar';
import DataSourcePermissionsUI from '../DataSourcePermissionsUI';
import WorkflowPermissionsUI from '../WorkflowPermissionsUI';
import AppPromoteReleasePermissionsUI from '../AppPromoteReleasePermissionsUI';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import VirtualizedUserList from './VirtualizedUserList';
import { fetchEdition } from '@/modules/common/helpers/utils';

class BaseManageGroupPermissionResources extends React.Component {
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
      hasEndUserMembers: false, // Whether this custom group contains any end-users
      endUserIds: null, // Cache of end-user IDs to avoid repeated API calls
      groupAdmins: [],
      addableAdmins: [],
      isLoadingAdmins: false,
      selectedAdminUsers: [],
      showAdminSearchBox: false,
      adminSearchString: '',
    };
    this.userListRef = React.createRef();
    this.searchDebounceTimer = null;
    this.adminSearchDebounceTimer = null;
  }

  componentDidMount() {
    if (this.props.groupPermissionId) this.fetchGroupAndResources(this.props.groupPermissionId);
  }

  componentWillUnmount() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    if (this.adminSearchDebounceTimer) {
      clearTimeout(this.adminSearchDebounceTimer);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.groupPermissionId && this.props.groupPermissionId !== prevProps.groupPermissionId) {
      this.fetchGroupAndResources(this.props.groupPermissionId);
      this.setState({
        showUserSearchBox: false,
        showAdminSearchBox: false,
        adminSearchString: '',
        currentTab: 'users',
        hasEndUserMembers: false, // Reset when switching groups
        endUserIds: null, // Reset cache
      });
    }
  }

  fetchGroupPermission = (groupPermissionId) => {
    return groupPermissionV2Service.getGroup(groupPermissionId).then(({ group, isBuilderLevel }) => {
      return new Promise((resolve) => {
        this.setState(
          (prevState) => {
            return {
              isRoleGroup: group.type === 'default',
              groupPermission: group,
              currentTab: prevState.currentTab,
              isLoadingGroup: false,
              isBuilderLevel: isBuilderLevel,
            };
          },
          () => {
            this.setSelectedUsers([]);
            resolve(group);
          }
        );
      });
    });
  };

  fetchGroupAndResources = (groupPermissionId) => {
    this.setState({ isLoadingGroup: true });
    // Fetch group first to ensure groupPermission is in state before checking for end-users
    this.fetchGroupPermission(groupPermissionId).then(() => {
      this.fetchUsersInGroup(groupPermissionId);
    });
  };

  userFullName = (user) => {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  };

  searchUsersNotInGroup = async (query, groupPermissionId) => {
    return new Promise((resolve, reject) => {
      groupPermissionV2Service
        .getUsersNotInGroup(query, groupPermissionId)
        .then((users) => {
          resolve(
            users.map((user) => {
              const fullName = `${user.firstName || ''}   ${user.lastName || ''}`.trim();
              return {
                name: `${fullName} (${user.email})`,
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
    groupPermissionV2Service.getUsersInGroup(groupPermissionId, searchString).then((data) => {
      this.setState(
        {
          usersInGroup: data,
          isLoadingUsers: false,
        },
        () => {
          // After users are loaded, check if this custom group has end-users
          this.checkForEndUsersInGroup();
        }
      );
    });
  };

  // Check if the current group (must be custom) contains any end-user role members
  checkForEndUsersInGroup = async () => {
    const { groupPermission, usersInGroup, endUserIds } = this.state;

    // Only check for custom groups
    if (groupPermission?.type !== 'custom') {
      return;
    }

    // If group has no users, there are no end-users
    if (usersInGroup.length === 0) {
      this.setState({ hasEndUserMembers: false });
      return;
    }

    // Get end-user IDs (use cache if available)
    let endUsers = endUserIds;
    if (!endUsers) {
      const groupsResponse = await groupPermissionV2Service.getGroups();
      const groups = groupsResponse.groupPermissions || [];
      const endUserGroup = groups.find((g) => g.name === 'end-user' && g.type === 'default');

      if (endUserGroup) {
        const endUserMembers = await groupPermissionV2Service.getUsersInGroup(endUserGroup.id);
        endUsers = new Set(endUserMembers.map((eu) => eu.userId));
        this.setState({ endUserIds: endUsers });
      } else {
        return;
      }
    }

    // Check if any user in this group is also in the end-user group
    const hasEndUserMembers = usersInGroup.some((ug) => endUsers.has(ug.userId));
    this.setState({ hasEndUserMembers });
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
    groupPermissionV2Service
      .update(groupPermissionId, { ...params, allowRoleChange })
      .then(() => {
        toast.success('Group permissions updated');
        this.fetchGroupPermission(groupPermissionId);
      })
      .catch((e) => {
        const error = e.error;
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
      .addUsersInGroups(groupPermissionId, body)
      .then(() => {
        this.setState({
          selectedUsers: [],
          isLoadingUsers: true,
          isAddingUsers: false,
        });
        toast.success('Users added to the group');
        this.fetchUsersInGroup(groupPermissionId);
        posthogHelper.captureEvent('click_add_user_button', {
          workspace_id:
            authenticationService?.currentUserValue?.organization_id ||
            authenticationService?.currentSessionValue?.current_organization_id,
          group_id: groupPermissionId,
        });
      })
      .catch(({ error, statusCode }) => {
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
        if (statusCode !== 451) {
          this.setState({
            showEditRoleErrorModal: true,
            errorTitle: error?.title || error,
            errorMessage:
              error === 'User archived in this workspace'
                ? 'You cannot add archived users to a custom group. Unarchive the user in this workspace to perform this action.'
                : error?.error || error,
            errorIconName: 'usergear',
            isAddingUsers: false,
          });
        }
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
        ? 'Admin has all permissions. This is not editable'
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
    this.setState({ isLoadingUsers: true });

    const proceedWithRoleChange = () => {
      const body = {
        newRole: selectedNewRole,
        userId: updatingUserRole.id,
      };
      groupPermissionV2Service
        .updateUserRole(body)
        .then(() => {
          this.fetchUsersInGroup(groupPermission.id);
          toast.success('Role updated successfully');
          if (currentUser.id === updatingUserRole.id) window.location.reload(true);
        })
        .catch(({ error, statusCode }) => {
          if (statusCode !== 451) {
            this.setState({
              showEditRoleErrorModal: true,
              errorTitle: error?.title ? error?.title : 'Cannot update the user role',
              errorMessage: error.error,
              errorIconName: 'usergear',
              errorListItems: error.data,
            });
          }
        })
        .finally(() => {
          this.closeChangeRoleModal();
        });
    };

    if (selectedNewRole === 'end-user') {
      groupPermissionV2Service
        .getUserAdminGroups(updatingUserRole.id)
        .then(({ groups }) => {
          if (groups.length > 0) {
            this.closeChangeRoleModal();
            this.setState({
              showAutoRoleChangeModal: true,
              autoRoleChangeMessageType: 'DOWNGRADE_BLOCKED_BY_GROUP_ADMIN',
              autoRoleChangeModalList: groups.map((g) => g.name),
            });
          } else {
            proceedWithRoleChange();
          }
        })
        .catch(() => {
          proceedWithRoleChange();
        });
    } else {
      proceedWithRoleChange();
    }
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
    const searchValue = e?.target?.value;
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.fetchUsersInGroup(this.props.groupPermissionId, searchValue);
    }, 300);
  };

  toggleUserTabSearchBox = () => {
    this.fetchUsersInGroup(this.props.groupPermissionId);
    this.setState((prevState) => ({
      showUserSearchBox: !prevState.showUserSearchBox,
    }));
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

  updateParamState = (updateParam) => {
    this.setState({ updateParam });
  };

  fetchGroupAdmins = () => {
    this.setState({ isLoadingAdmins: true });
    groupPermissionV2Service
      .getGroupAdmins(this.props.groupPermissionId)
      .then((data) => {
        this.setState({ groupAdmins: Array.isArray(data) ? data : [], isLoadingAdmins: false });
      })
      .catch(({ error }) => {
        toast.error(error);
        this.setState({ isLoadingAdmins: false });
      });
  };

  fetchAddableAdmins = () => {
    const isBuilder = authenticationService.currentSessionValue?.user_permissions?.is_builder;

    console.log('isBuilder', isBuilder);

    // if the user is a builder, don't fetch addable admins as they won't have permissions to add any admins to the group
    if (isBuilder === true) {
      return;
    }

    groupPermissionV2Service
      .getAddableAdmins(this.props.groupPermissionId)
      .then((data) => {
        this.setState({ addableAdmins: Array.isArray(data) ? data : [] });
      })
      .catch(({ error }) => {
        toast.error(error);
      });
  };

  searchAddableAdmins = (query) => {
    const q = (query || '').toLowerCase();
    const filtered = this.state.addableAdmins.filter((u) => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      return name.includes(q) || (u.email || '').toLowerCase().includes(q);
    });
    return Promise.resolve(
      filtered.map((u) => ({
        name: `${u.firstName || ''} ${u.lastName || ''} (${u.email})`.trim(),
        value: u.id,
        email: u.email,
        first_name: u.firstName,
        last_name: u.lastName,
      }))
    );
  };

  addSelectedAdminsToGroup = () => {
    const { selectedAdminUsers } = this.state;
    const { groupPermissionId } = this.props;
    Promise.all(selectedAdminUsers.map((u) => groupPermissionV2Service.assignGroupAdmin(groupPermissionId, u.value)))
      .then(() => {
        toast.success('Group admin(s) assigned');
      })
      .catch(({ error }) => {
        toast.error(error);
      })
      .finally(() => {
        this.setState({ selectedAdminUsers: [] });
        this.fetchGroupAdmins();
        this.fetchAddableAdmins();
      });
  };

  removeAdminSelection = (selected, value) => {
    this.setState({ selectedAdminUsers: selected.filter((d) => d.value !== value) });
  };

  generateAdminSelection = (selected) => {
    return selected?.map((d) => (
      <div className="selected-item tj-ms tj-ms-usergroup" key={d.value}>
        <FilterPreview text={`${d?.email}`} onClose={() => this.removeAdminSelection(selected, d.value)} />
      </div>
    ));
  };

  handleAdminSearchInGroup = (e) => {
    const searchValue = e?.target?.value;
    if (this.adminSearchDebounceTimer) {
      clearTimeout(this.adminSearchDebounceTimer);
    }
    this.adminSearchDebounceTimer = setTimeout(() => {
      this.setState({ adminSearchString: searchValue || '' });
    }, 300);
  };

  toggleAdminTabSearchBox = () => {
    this.setState((prevState) => ({
      showAdminSearchBox: !prevState.showAdminSearchBox,
      adminSearchString: '',
    }));
  };

  revokeAdmin = (adminId) => {
    groupPermissionV2Service
      .revokeGroupAdmin(this.props.groupPermissionId, adminId)
      .then(() => {
        toast.success('Group admin removed');
        this.fetchGroupAdmins();
        this.fetchAddableAdmins();
      })
      .catch(({ error }) => {
        toast.error(error);
      });
  };

  renderFolderPermissions = ({ groupPermission, isCE, isBasicPlan, disableNonPromoteReleasePermissions }) => {
    const showConsolidated = isCE;
    const folderCRUD = groupPermission.folderCreate || groupPermission.folderDelete;

    if (showConsolidated) {
      return (
        <label className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="checkbox"
            checked={folderCRUD}
            disabled={disableNonPromoteReleasePermissions}
            onChange={() => {
              const newValue = !folderCRUD;
              this.updateGroupPermission(groupPermission.id, { folderCreate: newValue, folderDelete: newValue });
              this.setState({ updateParam: { folderCreate: newValue, folderDelete: newValue } });
            }}
            data-cy="folder-crud-checkbox"
          />
          <span className="form-check-label" data-cy="folder-crud-label">
            {this.props.t(
              'header.organization.menus.manageGroups.permissionResources.createUpdateDelete',
              'Create/Update/Delete'
            )}
          </span>
          <span
            class={`tj-text-xxsm ${disableNonPromoteReleasePermissions && 'check-label-disable'}`}
            data-cy="folder-crud-helper-text"
          >
            All operations on folders
          </span>
        </label>
      );
    }

    return (
      <>
        <label className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="checkbox"
            checked={groupPermission.folderCreate}
            disabled={disableNonPromoteReleasePermissions}
            onChange={() => {
              this.updateGroupPermission(groupPermission.id, { folderCreate: !groupPermission.folderCreate });
              this.setState({ updateParam: { folderCreate: !groupPermission.folderCreate } });
            }}
            data-cy="folder-create-checkbox"
          />
          <span className="form-check-label" data-cy="folder-create-label">
            {this.props.t('header.organization.menus.manageGroups.permissionResources.create', 'Create')}
          </span>
          <span
            class={`tj-text-xxsm ${disableNonPromoteReleasePermissions && 'check-label-disable'}`}
            data-cy="folder-create-helper-text"
          >
            Create new folders in this workspace
          </span>
        </label>
        <label className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="checkbox"
            checked={groupPermission.folderDelete}
            disabled={disableNonPromoteReleasePermissions}
            onChange={() => {
              this.updateGroupPermission(groupPermission.id, { folderDelete: !groupPermission.folderDelete });
              this.setState({ updateParam: { folderDelete: !groupPermission.folderDelete } });
            }}
            data-cy="folder-delete-checkbox"
          />
          <span className="form-check-label" data-cy="folder-delete-label">
            {this.props.t('header.organization.menus.manageGroups.permissionResources.delete', 'Delete')}
          </span>
          <span
            class={`tj-text-xxsm ${disableNonPromoteReleasePermissions && 'check-label-disable'}`}
            data-cy="folder-delete-helper-text"
          >
            Delete any folders in this workspace
          </span>
        </label>
      </>
    );
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
    } = this.state;

    const { featureAccess } = this.props;

    const { licenseStatus: { isExpired, isLicenseValid } = {}, plan } = featureAccess || {};
    // Treat both basic and starter plans as restricted plans
    const isCE = fetchEdition() === 'ce';
    const isBasicPlan = featureAccess === undefined ? false : isExpired || !isLicenseValid || plan === 'starter';
    const isPaidPlan = featureAccess === undefined ? false : !isExpired && isLicenseValid && plan !== 'starter';
    const { customGroups: isFeatureEnabled } = featureAccess || {};

    // Workspace admin has full edit access; group-admin builders are read-only on permissions/granular tabs
    // and cannot change user roles (but can still add/remove users).
    const isAdmin = !!authenticationService.currentSessionValue?.admin;

    const searchSelectClass = this.props.darkMode ? 'select-search-dark' : 'select-search';
    const showPermissionInfo =
      isRoleGroup && (groupPermission?.name === 'admin' || groupPermission?.name === 'end-user');
    const disablePermissionUpdate =
      !isAdmin || isBasicPlan || groupPermission?.name === 'admin' || groupPermission?.name === 'end-user';

    const disableNonPromoteReleasePermissions =
      disablePermissionUpdate ||
      (groupPermission?.type === 'default' && groupPermission?.name === 'builder' && !featureAccess?.customGroups);

    // Check if this group contains any end-user role members
    // For default end-user group: always true
    // For custom groups: check hasEndUserMembers from state
    const { hasEndUserMembers } = this.state;
    const hasEndUsers =
      (groupPermission?.name === 'end-user' && groupPermission?.type === 'default') ||
      (groupPermission?.type === 'custom' && hasEndUserMembers);

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
                {groupPermission.type === 'custom' && isAdmin && (
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
                {groupPermission?.type === 'custom' && !isCE && (
                  <a
                    onClick={() => {
                      this.setState({ currentTab: 'groupAdmins', showUserSearchBox: false }, () => {
                        this.fetchGroupAdmins();
                        this.fetchAddableAdmins();
                      });
                      this.setSelectedUsers([]);
                    }}
                    className={cx('nav-item nav-link', { active: currentTab === 'groupAdmins' })}
                    data-cy="group-admins-link"
                  >
                    <SolidIcon
                      name="userstar"
                      fill={currentTab === 'groupAdmins' ? '#3E63DD' : '#C1C8CD'}
                      className="manage-group-tab-icons"
                      width="16"
                    />
                    Group admins
                  </a>
                )}
                <a
                  onClick={() => {
                    this.setState({ currentTab: 'permissions', showUserSearchBox: false });
                    this.setSelectedUsers([]);
                  }}
                  className={cx('nav-item nav-link', {
                    active: currentTab === 'permissions' && !isBasicPlan,
                    'expired-gradient-border': currentTab === 'permissions' && isBasicPlan,
                  })}
                  data-cy="permissions-link"
                >
                  {isBasicPlan && currentTab === 'permissions' ? (
                    <SolidIcon className="manage-group-tab-icons" name="lockGradient" />
                  ) : (
                    <SolidIcon
                      className="manage-group-tab-icons"
                      fill={currentTab === 'permissions' ? '#3E63DD' : '#C1C8CD'}
                      name="lock"
                      width="16"
                    />
                  )}
                  <span className={isBasicPlan && currentTab === 'permissions' ? 'paid-feature' : ''}>
                    {this.props.t(
                      'header.organization.menus.manageGroups.permissionResources.permissions',
                      'Permissions'
                    )}
                  </span>
                </a>
                <a
                  onClick={() => {
                    this.setState({ currentTab: 'granularAccess', showUserSearchBox: false });
                    this.setSelectedUsers([]);
                  }}
                  className={cx('nav-item nav-link', {
                    active: currentTab === 'granularAccess' && !isBasicPlan,
                    'expired-gradient-border': currentTab === 'granularAccess' && isBasicPlan,
                  })}
                  data-cy="granular-access-link"
                >
                  {isBasicPlan && currentTab === 'granularAccess' ? (
                    <SolidIcon className="manage-group-tab-icons" name="granularaccessgrad" />
                  ) : (
                    <SolidIcon
                      className="manage-group-tab-icons"
                      fill={currentTab === 'granularAccess' ? '#3E63DD' : '#C1C8CD'}
                      name="granularaccess"
                      width="16"
                    />
                  )}
                  <span className={isBasicPlan && currentTab === 'granularAccess' ? 'paid-feature' : ''}>
                    Granular access
                  </span>
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
                            data-cy="user-group-search-btn"
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

                      {isLoadingGroup || isLoadingUsers ? (
                        <section className="group-users-list-container">
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
                        </section>
                      ) : usersInGroup.length > 0 ? (
                        <VirtualizedUserList
                          users={usersInGroup}
                          isRoleGroup={isRoleGroup}
                          removeUserFromGroup={this.removeUserFromGroup}
                          openChangeRoleModal={this.openChangeRoleModal}
                          canChangeRole={isAdmin}
                          t={this.props.t}
                        />
                      ) : !showUserSearchBox ? (
                        <section className="group-users-list-container">
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
                        </section>
                      ) : (
                        <section className="group-users-list-container">
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
                        </section>
                      )}
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
                          <div className={`${showPermissionInfo ? 'permissions-body-one' : 'permissions-body-two'}`}>
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
                                          disabled={disableNonPromoteReleasePermissions}
                                          data-cy="app-create-checkbox"
                                        />
                                        <span className="form-check-label" data-cy="app-create-label">
                                          {this.props.t('globals.create', 'Create')}
                                        </span>
                                        <span
                                          class={`tj-text-xxsm ${
                                            disableNonPromoteReleasePermissions && 'check-label-disable'
                                          }`}
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
                                          disabled={disableNonPromoteReleasePermissions}
                                          data-cy="app-delete-checkbox"
                                        />
                                        <span className="form-check-label" data-cy="app-delete-label">
                                          {this.props.t('globals.delete', 'Delete')}
                                        </span>
                                        <span
                                          class={`tj-text-xxsm ${
                                            disableNonPromoteReleasePermissions && 'check-label-disable'
                                          }`}
                                          data-cy="app-delete-helper-text"
                                        >
                                          Delete any app in this workspace
                                        </span>
                                      </label>

                                      {/* Promote and release app permissions */}
                                      <AppPromoteReleasePermissionsUI
                                        groupPermission={groupPermission}
                                        disablePermissionUpdate={disablePermissionUpdate}
                                        updateGroupPermission={this.updateGroupPermission}
                                        updateState={this.updateParamState}
                                        featureAccess={featureAccess}
                                        isBasicPlan={isBasicPlan}
                                      />
                                    </div>
                                  </div>
                                  {/* //App till here */}
                                </div>
                                {/* Workflow Permission */}
                                <WorkflowPermissionsUI
                                  groupPermission={groupPermission}
                                  disablePermissionUpdate={disableNonPromoteReleasePermissions}
                                  updateGroupPermission={this.updateGroupPermission}
                                  updateState={this.updateParamState}
                                />

                                {/* Data source */}
                                <DataSourcePermissionsUI
                                  groupPermission={groupPermission}
                                  disablePermissionUpdate={disableNonPromoteReleasePermissions}
                                  updateGroupPermission={this.updateGroupPermission}
                                  updateState={this.updateParamState}
                                />
                                <div className="manage-groups-permission-apps">
                                  <div data-cy="resource-folders">
                                    {this.props.t(
                                      'header.organization.menus.manageGroups.permissionResources.folder',
                                      'Folder'
                                    )}
                                  </div>
                                  <div className="text-muted">
                                    <div className="d-flex apps-permission-wrap flex-column">
                                      {this.renderFolderPermissions({
                                        groupPermission,
                                        isCE,
                                        isBasicPlan,
                                        disableNonPromoteReleasePermissions,
                                      })}
                                    </div>
                                  </div>
                                </div>
                                <div className="manage-groups-permission-apps">
                                  <div data-cy="resource-workspace-variable">
                                    {this.props.t('globals.environmentVar', 'Workspace constant/variable')}
                                  </div>
                                  <div className="text-muted">
                                    <div className="d-flex apps-permission-wrap flex-column">
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
                                          disabled={disableNonPromoteReleasePermissions}
                                          data-cy="env-variable-checkbox"
                                        />
                                        <span className="form-check-label" data-cy="workspace-variable-create-label">
                                          {this.props.t(
                                            'header.organization.menus.manageGroups.permissionResources.createUpdateDelete',
                                            'Create/Update/Delete'
                                          )}
                                        </span>
                                        <span
                                          class={`tj-text-xxsm ${
                                            disableNonPromoteReleasePermissions && 'check-label-disable'
                                          }`}
                                          data-cy="workspace-constants-helper-text"
                                        >
                                          All operations on workspace constants
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                                <div className="manage-groups-permission-apps">
                                  <div data-cy="resource-tjdb">
                                    {this.props.t(
                                      'header.organization.menus.manageGroups.permissionResources.tooljetDatabase',
                                      'ToolJet Database'
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
                                              tjdbCRUD: !groupPermission.tjdbCRUD,
                                            });
                                            this.setState({
                                              updateParam: { tjdbCRUD: !groupPermission.tjdbCRUD },
                                            });
                                          }}
                                          checked={groupPermission.tjdbCRUD}
                                          disabled={disableNonPromoteReleasePermissions}
                                          data-cy="tjdb-create-checkbox"
                                        />
                                        <span className="form-check-label" data-cy="tjdb-create-label">
                                          {this.props.t(
                                            'header.organization.menus.manageGroups.permissionResources.createUpdateDelete',
                                            'Create/Update/Delete'
                                          )}
                                        </span>
                                        <span
                                          className={`tj-text-xxsm ${
                                            disableNonPromoteReleasePermissions && 'check-label-disable'
                                          }`}
                                          data-cy="tjdb-helper-text"
                                        >
                                          All operations on ToolJet Database
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
                      isBasicPlan={isBasicPlan}
                      isFeatureEnabled={isFeatureEnabled}
                      hasEndUsers={hasEndUsers}
                      isAdmin={isAdmin}
                    />
                  </aside>

                  {/* Group Admins Tab */}
                  {currentTab === 'groupAdmins' &&
                    (() => {
                      const {
                        groupAdmins,
                        isLoadingAdmins,
                        selectedAdminUsers,
                        showAdminSearchBox,
                        adminSearchString,
                      } = this.state;

                      const filteredAdmins = adminSearchString
                        ? groupAdmins.filter((ga) => {
                            const name = `${ga.user?.firstName || ''} ${ga.user?.lastName || ''}`.toLowerCase();
                            return (
                              name.includes(adminSearchString.toLowerCase()) ||
                              (ga.user?.email || '').toLowerCase().includes(adminSearchString.toLowerCase())
                            );
                          })
                        : groupAdmins;

                      return (
                        <div className="tab-pane active show group-admins-tab">
                          {/* Add admin row — only visible to workspace admins */}
                          {isAdmin && (
                            <div className="row">
                              <div className="col" data-cy="admin-multi-select-search">
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
                                  onSelect={(val) => this.setState({ selectedAdminUsers: val })}
                                  onSearch={this.searchAddableAdmins}
                                  selectedValues={selectedAdminUsers}
                                  onReset={() => this.setState({ selectedAdminUsers: [] })}
                                  placeholder="Select users to assign as group admins"
                                  searchLabel="Enter name or email"
                                />
                              </div>
                              <div className="col-auto">
                                <ButtonSolid
                                  onClick={this.addSelectedAdminsToGroup}
                                  disabled={selectedAdminUsers.length === 0}
                                  leftIcon="plus"
                                  fill={
                                    selectedAdminUsers.length !== 0
                                      ? '#ffffff'
                                      : this.props.darkMode
                                      ? '#131620'
                                      : '#C1C8CD'
                                  }
                                  iconWidth="16"
                                  className="add-users-button"
                                  data-cy="group-admin-add-button"
                                  style={{
                                    width: 'fit-content',
                                  }}
                                >
                                  Assign group admin
                                </ButtonSolid>
                              </div>
                              {selectedAdminUsers.length > 0 && (
                                <div className="row mt-2">
                                  <div className="selected-section">
                                    <div className="selected-text">Selected Users :</div>
                                    {this.generateAdminSelection(selectedAdminUsers)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <br />

                          {/* Search toggle + list */}
                          <div>
                            {showAdminSearchBox ? (
                              <div className="searchbox-custom">
                                <SearchBox
                                  dataCy="group-admin"
                                  width="600px !important"
                                  callBack={this.handleAdminSearchInGroup}
                                  placeholder="Search"
                                  customClass="tj-common-search-input-user"
                                  onClearCallback={this.toggleAdminTabSearchBox}
                                  autoFocus={true}
                                />
                              </div>
                            ) : (
                              <div className="manage-group-table-head">
                                <ButtonSolid
                                  onClick={(e) => {
                                    e.preventDefault();
                                    this.toggleAdminTabSearchBox();
                                  }}
                                  size="xsm"
                                  rightIcon="search"
                                  iconWidth="15"
                                  fill="#889096"
                                  className="search-user-group-btn"
                                  data-cy="group-admin-search-btn"
                                />
                                <p className="tj-text-xsm" data-cy="name-header" style={{ padding: '10px' }}>
                                  User name
                                </p>
                                <p className="tj-text-xsm" data-cy="email-header">
                                  Email id
                                </p>
                                <p className="tj-text-xsm"></p> {/* DO NOT REMOVE FOR TABLE ALIGNMENT */}
                              </div>
                            )}

                            {isLoadingAdmins ? (
                              <section className="group-users-list-container">
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
                              </section>
                            ) : filteredAdmins.length > 0 ? (
                              <VirtualizedUserList
                                users={filteredAdmins}
                                isRoleGroup={!isAdmin}
                                removeUserFromGroup={this.revokeAdmin}
                                openChangeRoleModal={() => {}}
                                canChangeRole={false}
                                t={this.props.t}
                              />
                            ) : !showAdminSearchBox ? (
                              <section className="group-users-list-container">
                                <div className="manage-groups-no-apps-wrap">
                                  <div className="manage-groups-no-apps-icon" data-cy="admin-empty-page-icon">
                                    <BulkIcon name="users" fill="#3E63DD" width="48" />
                                  </div>
                                  <p className="tj-text-md font-weight-500" data-cy="admin-empty-page">
                                    No group admins assigned
                                  </p>
                                  <span className="tj-text-sm text-center" data-cy="admin-empty-page-info-text">
                                    Assign a group admin to delegate <br />
                                    membership management for this group.
                                  </span>
                                </div>
                              </section>
                            ) : (
                              <section className="group-users-list-container">
                                <div className="manage-groups-no-apps-wrap">
                                  <div className="manage-groups-no-apps-icon" data-cy="admin-empty-page-icon">
                                    <SolidIcon name="warning-user-notfound" width="48" />
                                  </div>
                                  <p className="tj-text-md font-weight-500" data-cy="admin-empty-page">
                                    No results found
                                  </p>
                                  <span className="tj-text-sm text-center" data-cy="admin-empty-page-info-text">
                                    There were no results found for your search. Please <br />
                                    try changing the filters and try again.
                                  </span>
                                </div>
                              </section>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    );
  }
}

export default withTranslation()(BaseManageGroupPermissionResources);
