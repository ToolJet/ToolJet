import React from 'react';
import { authenticationService, organizationService, organizationUserService } from '@/_services';
import { toast } from 'react-hot-toast';
// eslint-disable-next-line import/no-unresolved
import { withTranslation } from 'react-i18next';
import urlJoin from 'url-join';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import UsersTable from '../../ee/components/UsersPage/UsersTable';
import UsersFilter from '../../ee/components/UsersPage/UsersFilter';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import ManageOrgUsersDrawer from './ManageOrgUsersDrawer';
import { USER_DRAWER_MODES } from '@/_helpers/utils';
import { getQueryParams } from '@/_helpers/routes';
import EditRoleErrorModal from '@/ManageGroupPermissionsV2/ErrorModal/ErrorModal';
import HeaderSkeleton from '@/_ui/FolderSkeleton/HeaderSkeleton';
import SolidIcon from '@/_ui/Icon/SolidIcons';

class ManageOrgUsersComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      creatingUser: false,
      uploadingUsers: false,
      newUser: {},
      archivingUser: null,
      unarchivingUser: null,
      fields: {},
      errors: {},
      meta: {
        total_count: 0,
        currentPage: 1,
      },
      currentPage: 1,
      options: {},
      file: null,
      isInviteUsersDrawerOpen: false,
      currentEditingUser: null,
      userDrawerMode: USER_DRAWER_MODES.CREATE,
      newSelectedGroups: [],
      existingGroupsToRemove: [],
      showErrorModal: false,
      errorModalMessage: '',
      errorItemList: [],
      errorTitle: '',
      errorIconName: 'usergear',
      resetSearch: false,
    };
  }

  setQueryParameter = () => {
    const showAdduserDrawer = getQueryParams('adduser');
    this.setState({
      isInviteUsersDrawerOpen: showAdduserDrawer ? showAdduserDrawer : false,
    });
  };

  validateEmail(email) {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  handleValidation() {
    let fields = this.state.fields;
    let errors = {};
    if (!fields['fullName']) {
      errors['fullName'] = 'This field is required';
    }
    if (!fields['email']) {
      errors['email'] = 'This field is required';
    } else if (!this.validateEmail(fields['email'])) {
      errors['email'] = 'Email is not valid';
    }

    this.setState({ errors: errors });
    return Object.keys(errors).length === 0;
  }

  handleFileValidation() {
    let errors = {};
    if (!this.state.file) {
      errors['file'] = 'This field is required';
    }
    this.setState({ errors: errors });
    return Object.keys(errors).length === 0;
  }

  fetchUsers = (page = 1, options = {}) => {
    this.setState({
      options,
      isLoading: true,
      currentPage: page,
    });

    organizationService.getUsers(page, options).then((data) => {
      this.setState({
        users: data.users,
        meta: data.meta,
        isLoading: false,
      });
    });
  };

  changeNewUserOption = (name, e) => {
    let fields = this.state.fields;
    let errors = {};
    fields[name] = e.target.value;

    this.setState({
      fields,
    });

    if (name === 'email') {
      if (!this.validateEmail(fields['email'])) {
        errors['email'] = 'Email is not valid';
        this.setState({ errors });
      } else {
        errors['email'] = '';
        this.setState({ errors });
      }
    }
  };

  archiveOrgUser = (id) => {
    this.setState({ archivingUser: id });

    organizationUserService
      .archive(id)
      .then(() => {
        toast.success('The user has been archived');
        this.setState({ archivingUser: null, resetSearch: !this.state.resetSearch });
        this.fetchUsers(this.state.currentPage, this.state.options);
      })
      .catch(({ error }) => {
        toast.error(error);
        this.setState({ archivingUser: null });
      });
  };

  unarchiveOrgUser = (id) => {
    this.setState({ unarchivingUser: id });

    organizationUserService
      .unarchive(id)
      .then(() => {
        toast.success('The user has been unarchived');
        this.setState({ unarchivingUser: null, resetSearch: !this.state.resetSearch });
        this.fetchUsers(this.state.currentPage, this.state.options);
      })
      .catch(({ error }) => {
        toast.error(error);
        this.setState({ unarchivingUser: null });
      });
  };

  //Need to work on that
  inviteBulkUsers = (event) => {
    event.preventDefault();
    if (this.handleFileValidation()) {
      const formData = new FormData();
      this.setState({
        uploadingUsers: true,
      });

      formData.append('file', this.state.file);
      organizationUserService
        .inviteBulkUsers(formData)
        .then((res) => {
          toast.success(res.message, {
            position: 'top-center',
          });
          this.fetchUsers();
          this.setState({
            uploadingUsers: false,
            isInviteUsersDrawerOpen: false,
            file: null,
          });
        })
        .catch(({ error }) => {
          if (error?.error) {
            this.setState({
              showErrorModal: true,
              errorModalMessage: error.error,
              errorTitle: error?.title || 'Conflicting permissions',
              errorItemList: error?.data,
              errorIconName: 'usergear',
            });
            this.setState({ creatingUser: false, uploadingUsers: false });
            return;
          }
          toast.error(error || 'Please check the format of CSV file', {
            position: 'top-center',
            style: {
              minWidth: '200px',
              whiteSpace: 'nowrap', // Prevent text from wrapping to the next line
              wordBreak: 'keep-all', // Prevent word breaks
            },
          });
          this.setState({ uploadingUsers: false });
        });
    }
  };

  handleFileChange = (file) => {
    this.setState({ file });
  };

  handleNameSplit = (fullName) => {
    const [first, last] = fullName.split(' ');
    let fields = this.state.fields;
    fields['firstName'] = first;
    fields['lastName'] = last;
    this.setState({
      fields,
    });
  };

  manageUser = (currentOrgUserId, selectedGroups, role, groupsToAdd, groupsToRemove) => {
    const isEditing = this.state.userDrawerMode === USER_DRAWER_MODES.EDIT;
    if (this.handleValidation()) {
      if (!this.state.fields.fullName?.trim()) {
        toast.error('Name should not be empty');
        return;
      }
      this.handleNameSplit(this.state.fields['fullName']);
      let fields = {};
      Object.keys(this.state.fields).map((key) => {
        fields[key] = '';
      });

      this.setState({
        creatingUser: true,
      });

      const service = isEditing ? organizationUserService.updateOrgUser : organizationUserService.create;
      const createUserBody = {
        first_name: this.state.fields.firstName,
        last_name: this.state.fields.lastName,
        email: this.state.fields.email,
        groups: selectedGroups,
        role: role,
      };

      const updateUserBody = {
        addGroups: groupsToAdd,
        removeGroups: groupsToRemove,
        ...(role && { role: role }),
      };
      service(currentOrgUserId, isEditing ? updateUserBody : createUserBody)
        .then(() => {
          toast.success(`User has been ${isEditing ? 'updated' : 'created'}`);
          this.fetchUsers();
          this.setState({
            creatingUser: false,
            fields: fields,
            isInviteUsersDrawerOpen: false,
            currentEditingUser: null,
            userDrawerMode: USER_DRAWER_MODES.CREATE,
            resetSearch: !this.state.resetSearch,
          });
        })
        .catch(({ error }) => {
          if (error?.error) {
            this.setState({
              showErrorModal: true,
              errorModalMessage: error.error,
              errorTitle: error?.title || 'Conflicting permissions',
              errorItemList: error?.data,
              errorIconName: 'usergear',
            });
            this.setState({ creatingUser: false });
            return;
          }
          toast.error(error);
        });
    } else {
      this.setState({ creatingUser: false, file: null, isInviteUsersDrawerOpen: true });
    }
  };

  componentDidMount() {
    this.setQueryParameter();
  }

  generateInvitationURL = (user) => {
    if (user.account_setup_token) {
      return urlJoin(
        window.public_config?.TOOLJET_HOST,
        window.public_config?.SUB_PATH ?? '',
        `/invitations/${user.account_setup_token}/workspaces/${user.invitation_token}?oid=${authenticationService?.currentSessionValue.current_organization_id}`
      );
    }
    return urlJoin(
      window.public_config?.TOOLJET_HOST,
      window.public_config?.SUB_PATH ?? '',
      `/organization-invitations/${user.invitation_token}?oid=${authenticationService?.currentSessionValue.current_organization_id}`
    );
  };

  invitationLinkCopyHandler = () => {
    toast.success('Invitation URL copied');
  };

  clearErrorState = () => {
    this.setState({
      showErrorModal: false,
      errorModalMessage: '',
      errorItemList: [],
      errorTitle: '',
      errorIconName: '',
    });
  };

  pageChanged = (page) => {
    this.fetchUsers(page, this.state.options);
  };

  filterList = (options) => {
    this.fetchUsers(1, options);
  };
  setIsInviteUsersDrawerOpen = (val) => {
    this.setState({ isInviteUsersDrawerOpen: val });
  };

  onCancel = () => {
    this.setState({
      errors: {},
      file: null,
      fields: {},
      currentEditingUser: null,
      userDrawerMode: USER_DRAWER_MODES.CREATE,
    });
  };

  toggleEditUserDrawer = (user) => {
    this.setState({ currentEditingUser: user, isInviteUsersDrawerOpen: true, userDrawerMode: USER_DRAWER_MODES.EDIT });
  };

  setUserValues = (user) => {
    this.setState({ fields: user });
  };

  render() {
    const {
      isLoading,
      uploadingUsers,
      users,
      archivingUser,
      unarchivingUser,
      meta,
      currentEditingUser,
      userDrawerMode,
      showErrorModal,
      errorModalMessage,
      errorItemList,
      errorTitle,
      errorIconName,
      resetSearch,
    } = this.state;
    return (
      <ErrorBoundary showFallback={true}>
        <div className="wrapper org-users-page animation-fade">
          <EditRoleErrorModal
            darkMode={this.props.darkMode}
            show={showErrorModal}
            errorMessage={errorModalMessage}
            errorTitle={errorTitle}
            listItems={errorItemList}
            iconName={errorIconName}
            onClose={this.clearErrorState}
          />
          {this.state.isInviteUsersDrawerOpen && (
            <ManageOrgUsersDrawer
              isInviteUsersDrawerOpen={this.state.isInviteUsersDrawerOpen}
              setIsInviteUsersDrawerOpen={this.setIsInviteUsersDrawerOpen}
              manageUser={this.manageUser}
              changeNewUserOption={this.changeNewUserOption}
              errors={this.state.errors}
              fields={this.state.fields}
              handleFileChange={this.handleFileChange}
              uploadingUsers={uploadingUsers}
              onCancel={this.onCancel}
              inviteBulkUsers={this.inviteBulkUsers}
              userDrawerMode={userDrawerMode}
              currentEditingUser={currentEditingUser}
              setUserValues={this.setUserValues}
              creatingUser={this.state.creatingUser}
              darkMode={this.props.darkMode}
            />
          )}

          <div className="page-wrapper">
            <div>
              {isLoading ? (
                <div className="page-header workspace-page-header">
                  <HeaderSkeleton />
                </div>
              ) : (
                <div className="page-header workspace-page-header">
                  <div className="align-items-center d-flex">
                    <div className="tj-text-sm font-weight-500" data-cy="title-users-page">
                      {meta?.total_count} users
                    </div>
                    <div className=" workspace-setting-buttons-wrap">
                      <ButtonSolid
                        data-cy="button-invite-new-user"
                        className="singleuser-btn"
                        onClick={() => this.setState({ isInviteUsersDrawerOpen: true })}
                        leftIcon="usergroup"
                        fill={'#FDFDFE'}
                      >
                        {this.props.t('header.organization.menus.manageUsers.addNewUser', 'Add users')}
                      </ButtonSolid>
                    </div>
                  </div>
                </div>
              )}

              <div className="page-body">
                <UsersFilter
                  filterList={this.filterList}
                  darkMode={this.props.darkMode}
                  clearIconPressed={() => this.fetchUsers()}
                  resetSearch={resetSearch}
                />

                {users?.length === 0 && (
                  <div className="workspace-settings-table-wrap">
                    <div className="d-flex justify-content-center flex-column tj-user-table-wrapper">
                      <div className="d-flex justify-content-center align-items-center mb-2">
                        <div className="user-not-found-svg">
                          <SolidIcon name="warning-user-notfound" fill="var(--icon-strong)" />
                        </div>
                      </div>
                      <span className="text-center font-weight-bold" data-cy="text-no-result-found">
                        No result found
                      </span>
                      <small className="text-center text-secondary" data-cy="text-try-changing-filters">
                        There were no results found for your search. Please
                        <br />
                        try changing the filters and try again.
                      </small>
                    </div>
                  </div>
                )}

                {users?.length !== 0 && (
                  <UsersTable
                    isLoading={isLoading}
                    users={users}
                    unarchivingUser={unarchivingUser}
                    archivingUser={archivingUser}
                    meta={meta}
                    generateInvitationURL={this.generateInvitationURL}
                    invitationLinkCopyHandler={this.invitationLinkCopyHandler}
                    unarchiveOrgUser={this.unarchiveOrgUser}
                    archiveOrgUser={this.archiveOrgUser}
                    pageChanged={this.pageChanged}
                    darkMode={this.props.darkMode}
                    translator={this.props.t}
                    toggleEditUserDrawer={this.toggleEditUserDrawer}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}

export const ManageOrgUsers = withTranslation()(ManageOrgUsersComponent);
