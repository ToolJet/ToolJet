import React from 'react';
import { authenticationService, organizationService, organizationUserService } from '@/_services';
import { Header } from '@/_components';
import { toast } from 'react-hot-toast';
import ReactTooltip from 'react-tooltip';
import { withTranslation } from 'react-i18next';
import urlJoin from 'url-join';
import UsersTable from '../../ee/components/UsersPage/UsersTable';
import UsersFilter from '../../ee/components/UsersPage/UsersFilter';

class ManageOrgUsersComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      isLoading: true,
      showNewUserForm: false,
      creatingUser: false,
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
    };
  }

  validateEmail(email) {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  handleValidation() {
    let fields = this.state.fields;
    let errors = {};
    //Name
    if (!fields['firstName']) {
      errors['firstName'] = 'This field is required';
    }
    if (!fields['lastName']) {
      errors['lastName'] = 'This field is required';
    }
    //Email
    if (!fields['email']) {
      errors['email'] = 'This field is required';
    } else if (!this.validateEmail(fields['email'])) {
      errors['email'] = 'Email is not valid';
    }

    this.setState({ errors: errors });
    return Object.keys(errors).length === 0;
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
    fields[name] = e.target.value;

    this.setState({
      fields,
    });
  };

  archiveOrgUser = (id) => {
    this.setState({ archivingUser: id });

    organizationUserService
      .archive(id)
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

  unarchiveOrgUser = (id) => {
    this.setState({ unarchivingUser: id });

    organizationUserService
      .unarchive(id)
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

  createUser = (event) => {
    event.preventDefault();

    if (this.handleValidation()) {
      let fields = {};
      Object.keys(this.state.fields).map((key) => {
        fields[key] = '';
      });

      this.setState({
        creatingUser: true,
      });

      organizationUserService
        .create(
          this.state.fields.firstName,
          this.state.fields.lastName,
          this.state.fields.email,
          this.state.fields.role
        )
        .then(() => {
          toast.success('User has been created', {
            position: 'top-center',
          });
          this.fetchUsers();
          this.setState({
            creatingUser: false,
            showNewUserForm: false,
            fields: fields,
          });
        })
        .catch(({ error }) => {
          toast.error(error, { position: 'top-center' });
          this.setState({ creatingUser: false });
        });
    } else {
      this.setState({ creatingUser: false, showNewUserForm: true });
    }
  };

  generateInvitationURL = (user) => {
    if (user.account_setup_token) {
      return urlJoin(
        window.public_config?.TOOLJET_HOST,
        `/invitations/${user.account_setup_token}/workspaces/${user.invitation_token}?oid=${this.state.currentUser.organization_id}`
      );
    }
    return urlJoin(window.public_config?.TOOLJET_HOST, `/organization-invitations/${user.invitation_token}`);
  };

  invitationLinkCopyHandler = () => {
    toast.success('Invitation URL copied', {
      position: 'top-center',
    });
  };

  pageChanged = (page) => {
    this.fetchUsers(page, this.state.options);
  };

  filterList = (options) => {
    this.fetchUsers(1, options);
  };

  render() {
    const { isLoading, showNewUserForm, creatingUser, users, archivingUser, unarchivingUser, meta } = this.state;
    return (
      <div className="wrapper org-users-page">
        <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} />
        <ReactTooltip type="dark" effect="solid" delayShow={250} />

        <div className="page-wrapper">
          <div className="container-xl">
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <div className="page-pretitle"></div>
                  <h2 className="page-title" data-cy="users-page-title">
                    {this.props.t('header.organization.menus.manageUsers.usersAndPermission', 'Users & Permissions')}
                  </h2>
                </div>
                <div className="col-auto ms-auto d-print-none">
                  {!showNewUserForm && (
                    <div
                      className="btn btn-primary"
                      onClick={() => this.setState({ showNewUserForm: true })}
                      data-cy="invite-new-user"
                    >
                      {this.props.t('header.organization.menus.manageUsers.inviteNewUser', 'Invite new user')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="page-body">
            {showNewUserForm && (
              <div className="container-xl">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title" data-cy="add-new-user">
                      {this.props.t('header.organization.menus.manageUsers.addNewUser', 'Add new user')}
                    </h3>
                  </div>
                  <div className="card-body">
                    <form onSubmit={this.createUser} noValidate>
                      <div className="form-group mb-3 ">
                        <div className="row">
                          <div className="col">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={this.props.t(
                                'header.organization.menus.manageUsers.enterFirstName',
                                'Enter First Name'
                              )}
                              name="firstName"
                              onChange={this.changeNewUserOption.bind(this, 'firstName')}
                              value={this.state.fields['firstName']}
                              data-cy="first-name-input"
                            />
                            <span className="text-danger" data-cy="first-name-error">
                              {this.state.errors['firstName']}
                            </span>
                          </div>
                          <div className="col">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={this.props.t(
                                'header.organization.menus.manageUsers.enterLastName',
                                'Enter Last Name'
                              )}
                              name="lastName"
                              onChange={this.changeNewUserOption.bind(this, 'lastName')}
                              value={this.state.fields['lastName']}
                              data-cy="last-name-input"
                            />
                            <span className="text-danger" data-cy="last-name-error">
                              {this.state.errors['lastName']}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="form-group mb-3 ">
                        <label className="form-label" data-cy="email-label">
                          {this.props.t('header.organization.menus.manageUsers.emailAddress', 'Email Address')}
                        </label>
                        <div>
                          <input
                            type="text"
                            className="form-control"
                            aria-describedby="emailHelp"
                            placeholder={this.props.t(
                              'header.organization.menus.manageUsers.enterEmail',
                              'Enter Email'
                            )}
                            name="email"
                            onChange={this.changeNewUserOption.bind(this, 'email')}
                            value={this.state.fields['email']}
                            data-cy="email-input"
                          />
                          <span className="text-danger" data-cy="email-error">
                            {this.state.errors['email']}
                          </span>
                        </div>
                      </div>
                      <div className="form-footer">
                        <button
                          type="button"
                          className="btn btn-light mr-2"
                          onClick={() =>
                            this.setState({
                              showNewUserForm: false,
                              newUser: {},
                              errors: {},
                              fields: {},
                            })
                          }
                          data-cy="cancel-button"
                        >
                          {this.props.t('globals.cancel', 'Cancel')}
                        </button>
                        <button
                          type="submit"
                          className={`btn mx-2 btn-primary ${creatingUser ? 'btn-loading' : ''}`}
                          disabled={creatingUser}
                          data-cy="create-user-button"
                        >
                          {this.props.t('header.organization.menus.manageUsers.createUser', 'Create User')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {!showNewUserForm && (
              <UsersFilter
                filterList={this.filterList}
                darkMode={this.props.darkMode}
                clearIconPressed={() => this.fetchUsers()}
              />
            )}

            {users?.length === 0 && (
              <div className="d-flex justify-content-center flex-column">
                <span className="text-center pt-5 font-weight-bold">No result found</span>
                <small className="text-center text-muted">Try changing the filters</small>
              </div>
            )}

            {!showNewUserForm && users?.length !== 0 && (
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
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export const ManageOrgUsers = withTranslation()(ManageOrgUsersComponent);
