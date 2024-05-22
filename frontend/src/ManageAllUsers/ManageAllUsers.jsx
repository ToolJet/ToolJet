import React from 'react';
import { authenticationService, userService, organizationUserService, licenseService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { withTranslation } from 'react-i18next';
import UsersTable from '../../ee/components/UsersPage/UsersTable';
import UsersFilter from '../../ee/components/UsersPage/UsersFilter';
import OrganizationsModal from './OrganizationsModal';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import { LicenseBanner } from '@/LicenseBanner';
import UserEditDrawer from './UserEditDrawer';
import ModalBase from '@/_ui/Modal';

class ManageAllUsersComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      isLoading: true,
      archivingFromAllOrgs: false,
      unarchivingFromAllOrgs: false,
      newUser: {},
      archivingUser: null,
      unarchivingUser: null,
      fields: {},
      errors: {},
      meta: {
        total_count: 0,
      },
      currentPage: 1,
      options: {},
      showOrganizationsModal: false,
      selectedUser: null,
      isUpdatingUser: false,
      updatingUser: null,
      userLimits: {},
      disabled: false,
      showArchiveModal: false,
      showWorkspaceUserArchiveModal: false,
    };
  }
  componentDidMount() {
    this.fetchFeatureAccess();
    this.fetchAllUserLimits();
  }

  setDisabledStatus = (licenseStatus) => {
    const disabled = licenseStatus?.isExpired || !licenseStatus?.isLicenseValid;
    this.setState({ disabled });
  };

  fetchFeatureAccess = () => {
    this.setState({ isLoading: true });
    licenseService.getFeatureAccess().then((data) => {
      this.setDisabledStatus(data?.licenseStatus);
      this.setState({ isLoading: false });
    });
  };

  fetchUsers = (page = 1, options = {}) => {
    this.setState({
      options,
      isLoading: true,
      currentPage: page,
    });

    userService.getInstanceUsers(page, options).then((data) => {
      this.setState({
        users: data.users,
        meta: data.meta,
        isLoading: false,
      });
      this.updateSelectedUser();
    });
  };

  fetchAllUserLimits = () => {
    userService.getUserLimits('all').then((data) => {
      this.setState({
        userLimits: data,
      });
    });
  };

  updateSelectedUser() {
    const selectedUser = this.state.selectedUser;
    if (selectedUser) {
      const updatedUser = this.state.users.find((user) => user.id === selectedUser.id);
      this.setState({ selectedUser: updatedUser });
    }
  }

  archiveOrgUser = (id, organizationId) => {
    this.setState({ archivingUser: id });

    organizationUserService
      .archive(id, organizationId)
      .then(() => {
        toast.success('The user has been archived', {
          position: 'top-center',
        });
        this.setState({ showWorkspaceUserArchiveModal: false, archivingUser: null });
        this.fetchUsers(this.state.currentPage, this.state.options);
        this.fetchAllUserLimits();
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        this.setState({ showWorkspaceUserArchiveModal: false, archivingUser: null });
      });
  };

  unarchiveOrgUser = (id, organizationId) => {
    this.setState({ unarchivingUser: id });

    organizationUserService
      .unarchive(id, organizationId)
      .then(() => {
        toast.success('The user has been unarchived', {
          position: 'top-center',
        });
        this.setState({ showWorkspaceUserArchiveModal: false, unarchivingUser: null });
        this.fetchUsers(this.state.currentPage, this.state.options);
        this.fetchAllUserLimits();
      })
      .catch(({ error, data }) => {
        const { statusCode } = data;
        if ([451].indexOf(statusCode) === -1) {
          toast.error(error);
        }
        this.setState({ showWorkspaceUserArchiveModal: false, unarchivingUser: null });
      });
  };

  archiveAll = (user) => {
    this.setState({ archivingFromAllOrgs: true });
    organizationUserService
      .archiveAll(user.id)
      .then(() => {
        toast.success('User has been archived from this instance successfully!', {
          position: 'top-center',
          style: {
            minWidth: '430px',
          },
        });
        this.fetchUsers(this.state.currentPage, this.state.options);
        this.fetchAllUserLimits();
        this.setState({ archivingFromAllOrgs: false });
        this.toggleArchiveModal();
      })
      .catch(() => {
        toast.error('Could not archive user. Please try again!');
        this.setState({ archivingFromAllOrgs: false });
        this.toggleArchiveModal();
      });
  };

  unarchiveAll = (user) => {
    this.setState({ unarchivingFromAllOrgs: true });
    organizationUserService
      .unarchiveAll(user.id)
      .then(() => {
        toast.success('User has been unarchived from this instance successfully!', {
          position: 'top-center',
          style: {
            maxWidth: 'unset',
          },
        });
        this.fetchUsers(this.state.currentPage, this.state.options);
        this.fetchAllUserLimits();
        this.setState({ unarchivingFromAllOrgs: false });
        this.toggleArchiveModal();
      })
      .catch(({ error }) => {
        toast.error('Could not unarchive user. Please try again!');
        this.setState({ unarchivingFromAllOrgs: false });
        this.toggleArchiveModal();
      });
  };

  handleValidation() {
    let fields = this.state.fields;
    let errors = {};
    if (!fields['fullName']) {
      errors['fullName'] = 'This field is required';
    }

    this.setState({ errors: errors });
    return Object.keys(errors).length === 0;
  }

  handleNameSplit = (fullName) => {
    const words = fullName.split(' ');
    const firstName = words.length > 0 ? words.slice(0, -1).join(' ') : '';
    const lastName = words.length > 0 ? words[words.length - 1] : '';
    let fields = this.state.fields;
    fields['firstName'] = firstName;
    fields['lastName'] = lastName;
    this.setState({
      fields,
    });
  };

  updateUser = () => {
    if (this.handleValidation()) {
      this.handleNameSplit(this.state.fields['fullName']);
      let fields = {};
      Object.keys(this.state.fields).map((key) => {
        fields[key] = '';
      });

      this.setState({ isUpdatingUser: true });
      const { userType, firstName, lastName } = this.state.fields;
      userService
        .updateUserType({
          userId: this.state.updatingUser.id,
          userType,
          firstName,
          lastName,
        })
        .then(() => {
          toast.success('Changes updated successfully!', {
            position: 'top-center',
          });
          this.fetchUsers(this.state.currentPage, this.state.options);
          this.fetchAllUserLimits();
          this.setState({ isUpdatingUser: false, updatingUser: null });
          this.hideEditUserDrawer();
        })
        .catch(({ error, data }) => {
          const { statusCode } = data;
          if ([451].indexOf(statusCode) === -1) {
            toast.error(error);
          }
          this.hideEditUserDrawer();
          this.setState({ isUpdatingUser: false });
        });
    } else {
      this.setState({ isUpdatingUser: false, isEditUserDrawerOpen: true });
    }
  };

  pageChanged = (page) => this.fetchUsers(page, this.state.options);

  filterList = (options) => this.fetchUsers(1, options);

  openOrganizationModal = (selectedUser) => this.setState({ showOrganizationsModal: true, selectedUser });

  openEditModal = (updatingUser) => this.setState({ isEditUserDrawerOpen: true, updatingUser });

  hideModal = () => this.setState({ showOrganizationsModal: false });

  hideEditUserDrawer = () => this.setState({ isEditUserDrawerOpen: false, updatingUser: null, errors: {} });

  changeNewUserOption = (name, value) => {
    this.setState({
      fields: {
        ...this.state.fields,
        [name]: name === 'userType' ? (value ? 'instance' : 'workspace') : value,
      },
    });
  };

  setUserValues = (user) => {
    this.setState({ fields: user });
  };

  toggleArchiveModal = (user) => this.setState({ showArchiveModal: !this.state.showArchiveModal, updatingUser: user });

  toggleWorkspaceUserArchiveModal = (user) =>
    this.setState({ showWorkspaceUserArchiveModal: !this.state.showWorkspaceUserArchiveModal, updatingUser: user });

  generateInstanceArchiveConfirmModal = () => {
    const { archivingFromAllOrgs, unarchivingFromAllOrgs, updatingUser, showArchiveModal } = this.state;
    const isArchived = updatingUser?.status === 'archived';
    const confirmButtonProps = {
      title: !isArchived ? 'Archive' : 'Unarchive',
      isLoading: archivingFromAllOrgs || unarchivingFromAllOrgs,
      disabled: archivingFromAllOrgs || unarchivingFromAllOrgs,
      variant: !isArchived ? 'dangerPrimary' : 'primary',
      leftIcon: 'archive',
    };
    const body =
      updatingUser?.status === 'active' || updatingUser?.status === 'invited'
        ? 'Archiving the user will restrict their access to all their workspaces and exclude them from the count of users covered by your plan. Are you sure you want to continue?'
        : `Unarchiving the user will activate them in the instance and include them in the count of users covered by your plan. Are you sure you want to continue?`;

    return (
      <ModalBase
        title={
          <div className="my-3" data-cy="modal-title">
            <span className="tj-text-md font-weight-500">{!isArchived ? 'Archive user' : 'Unarchive user'}</span>
            <div className="tj-text-sm text-muted" data-cy="user-email">
              {updatingUser?.email}
            </div>
          </div>
        }
        show={showArchiveModal}
        handleClose={this.toggleArchiveModal}
        handleConfirm={() => (!isArchived ? this.archiveAll(updatingUser) : this.unarchiveAll(updatingUser))}
        confirmBtnProps={confirmButtonProps}
        body={
          <div className="tj-text-sm" data-cy="modal-message">
            {body}
          </div>
        }
        darkMode={this.props.darkMode}
      />
    );
  };

  generateBanner() {
    const { usersCount, editorsCount, viewersCount } = this.state.userLimits;

    if (usersCount?.percentage >= 100) {
      return <LicenseBanner classes="my-3" limits={usersCount} type="users" />;
    } else if (editorsCount?.percentage >= 100) {
      return <LicenseBanner classes="my-3" limits={editorsCount} type="builders" />;
    } else if (viewersCount?.percentage >= 100) {
      return <LicenseBanner classes="my-3" limits={viewersCount} type="end users" />;
    } else if (
      usersCount?.percentage >= 90 ||
      (usersCount?.total <= 10 && usersCount.current === usersCount?.total - 1)
    ) {
      return <LicenseBanner classes="my-3" limits={usersCount} type="users" />;
    } else if (
      editorsCount?.percentage >= 90 ||
      (editorsCount?.total <= 10 && editorsCount.current === editorsCount?.total - 1)
    ) {
      return <LicenseBanner classes="my-3" limits={editorsCount} type="builders" />;
    } else if (
      viewersCount?.percentage >= 90 ||
      (viewersCount?.total <= 10 && viewersCount.current === viewersCount?.total - 1)
    ) {
      return <LicenseBanner classes="my-3" limits={viewersCount} type="end users" />;
    }
  }

  render() {
    const {
      isLoading,
      users,
      archivingUser,
      unarchivingUser,
      meta,
      isEditUserDrawerOpen,
      updatingUser,
      isUpdatingUser,
      userLimits,
      archivingFromAllOrgs,
      unarchivingFromAllOrgs,
      showArchiveModal,
    } = this.state;

    const { superadminsCount } = this.state.userLimits;

    const { isLicenseExpired, isLicenseValid } = this.props;

    const usersTableCustomStyle = { height: 'calc(100vh - 400px)' };

    return (
      <ErrorBoundary showFallback={true}>
        <div className="org-wrapper org-users-page animation-fade instance-all-users">
          <ReactTooltip type="dark" effect="solid" delayShow={250} />
          {this.generateInstanceArchiveConfirmModal()}
          <OrganizationsModal
            showModal={this.state.showOrganizationsModal}
            darkMode={this.props.darkMode}
            hideModal={this.hideModal}
            translator={this.props.t}
            selectedUser={this.state.selectedUser}
            archiveOrgUser={this.archiveOrgUser}
            unarchiveOrgUser={this.unarchiveOrgUser}
            archivingUser={this.state.archivingUser}
            unarchivingUser={this.state.unarchivingUser}
            archiveAll={this.archiveAll}
            archivingFromAllOrgs={this.state.archivingFromAllOrgs}
            openEditModal={this.openEditModal}
            disabled={this.state.disabled}
            showWorkspaceUserArchiveModal={this.state.showWorkspaceUserArchiveModal}
            toggleWorkspaceUserArchiveModal={this.toggleWorkspaceUserArchiveModal}
            updatingUser={this.state.updatingUser}
          />
          {isEditUserDrawerOpen && (
            <UserEditDrawer
              isEditUserDrawerOpen={isEditUserDrawerOpen}
              onClose={this.hideEditUserDrawer}
              changeOptions={this.changeNewUserOption}
              fields={this.state.fields}
              errors={this.state.errors}
              disabled={this.state.disabled}
              superadminsCount={superadminsCount}
              updatingUser={updatingUser}
              isUpdatingUser={isUpdatingUser}
              t={this.props.t}
              setUserValues={this.setUserValues}
              updateUser={this.updateUser}
            />
          )}

          <div className="page-wrapper header-table-flex mt-1">
            <div className="page-header workspace-page-header">
              <div className="align-items-center d-flex">
                <div className="tj-text-sm font-weight-500" data-cy="title-users-page">
                  Manage All Users
                </div>
                <div className="user-limits d-flex">
                  {!userLimits?.usersCount?.canAddUnlimited && userLimits?.usersCount && (
                    <div className="limit">
                      <div data-cy="total-user-limit-label">TOTAL USERS</div>
                      <div className="count" data-cy="total-user-limit-count">
                        {userLimits?.usersCount?.current}/{userLimits?.usersCount?.total}
                      </div>
                    </div>
                  )}
                  {!userLimits?.editorsCount?.canAddUnlimited && userLimits?.editorsCount && (
                    <div className="limit">
                      <div data-cy="total-builder-limit-label">BUILDERS</div>
                      <div className="count" data-cy="total-user-limit-count">
                        {userLimits?.editorsCount?.current}/{userLimits?.editorsCount?.total}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {this.generateBanner()}
            <div>
              <UsersFilter
                filterList={this.filterList}
                darkMode={this.props.darkMode}
                clearIconPressed={() => this.fetchUsers()}
              />

              {users?.length === 0 && (
                <div className="d-flex justify-content-center flex-column">
                  <span className="text-center pt-5 font-weight-bold">No result found</span>
                  <small className="text-center text-muted">Try changing the filters</small>
                </div>
              )}

              {users?.length !== 0 && (
                <UsersTable
                  customStyles={usersTableCustomStyle}
                  isLoading={isLoading}
                  users={users}
                  unarchivingUser={unarchivingFromAllOrgs}
                  archivingUser={archivingFromAllOrgs}
                  meta={meta}
                  generateInvitationURL={this.generateInvitationURL}
                  invitationLinkCopyHandler={this.invitationLinkCopyHandler}
                  unarchiveOrgUser={this.toggleArchiveModal}
                  archiveOrgUser={this.toggleArchiveModal}
                  pageChanged={this.pageChanged}
                  darkMode={this.props.darkMode}
                  translator={this.props.t}
                  isLoadingAllUsers={true}
                  openOrganizationModal={this.openOrganizationModal}
                  toggleEditUserDrawer={this.openEditModal}
                  resetPassword={true}
                />
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}

export const ManageAllUsers = withTranslation()(ManageAllUsersComponent);
