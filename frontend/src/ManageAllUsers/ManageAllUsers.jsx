import React from 'react';
import { authenticationService, userService, organizationUserService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { withTranslation } from 'react-i18next';
import UsersTable from '../../ee/components/UsersPage/UsersTable';
import UsersFilter from '../../ee/components/UsersPage/UsersFilter';
import OrganizationsModal from './OrganizationsModal';
import UserEditModal from './UserEditModal';
import ErrorBoundary from '@/Editor/ErrorBoundary';

class ManageAllUsersComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      isLoading: true,
      archivingFromAllOrgs: false,
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
    };
  }

  componentDidMount() {
    this.fetchUsers(1);
  }

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
        this.setState({ archivingUser: null });
        this.fetchUsers(this.state.currentPage, this.state.options);
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        this.setState({ archivingUser: null });
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
        this.setState({ unarchivingUser: null });
        this.fetchUsers(this.state.currentPage, this.state.options);
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        this.setState({ unarchivingUser: null });
      });
  };

  archiveAll = () => {
    this.setState({ archivingFromAllOrgs: true });
    organizationUserService
      .archiveAll(this.state.selectedUser.id)
      .then(() => {
        toast.success('All users have been archived', {
          position: 'top-center',
        });
        this.fetchUsers(this.state.currentPage, this.state.options);
        this.setState({ archivingFromAllOrgs: false });
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        this.setState({ archivingFromAllOrgs: false });
      });
  };

  updateUser = (options) => {
    const { userType } = options;
    this.setState({ isUpdatingUser: true });
    userService
      .updateUserType(this.state.updatingUser.id, userType)
      .then(() => {
        toast.success('User has been updated', {
          position: 'top-center',
        });
        this.fetchUsers(this.state.currentPage, this.state.options);
        this.setState({ isUpdatingUser: false, updatingUser: null });
        this.hideEditModal();
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        this.setState({ isUpdatingUser: false });
      });
  };

  pageChanged = (page) => this.fetchUsers(page, this.state.options);

  filterList = (options) => this.fetchUsers(1, options);

  openOrganizationModal = (selectedUser) => this.setState({ showOrganizationsModal: true, selectedUser });

  openEditModal = (updatingUser) => this.setState({ showEditModal: true, updatingUser });

  hideModal = () => this.setState({ showOrganizationsModal: false, selectedUser: null });

  hideEditModal = () => this.setState({ showEditModal: false, updatingUser: null });

  render() {
    const { isLoading, users, archivingUser, unarchivingUser, meta, showEditModal, updatingUser, isUpdatingUser } =
      this.state;
    return (
      <ErrorBoundary showFallback={true}>
        <div className="wrapper org-users-page animation-fade">
          <ReactTooltip type="dark" effect="solid" delayShow={250} />

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
          />

          <UserEditModal
            showModal={showEditModal}
            hideModal={this.hideEditModal}
            updatingUser={updatingUser}
            translator={this.props.t}
            darkMode={this.props.darkMode}
            isUpdatingUser={isUpdatingUser}
            updateUser={this.updateUser}
          />

          <div className="page-wrapper">
            <div className="container-xl">
              <div className="page-header d-print-none">
                <div className="row align-items-center">
                  <div className="col">
                    <div className="page-pretitle"></div>
                    <h2 className="page-title" data-cy="users-page-title">
                      {this.props.t('header.organization.menus.manageAllUsers.manageAllUsers', 'Manage All Users')}
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-body">
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
                  isLoadingAllUsers={true}
                  openOrganizationModal={this.openOrganizationModal}
                  openEditModal={this.openEditModal}
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
