import React from 'react';
import { authenticationService, organizationService, organizationUserService } from '@/_services';
import { Header } from '@/_components';
import { toast } from 'react-hot-toast';
import { history } from '@/_helpers';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactTooltip from 'react-tooltip';

export function ManageSSO() {
  const creatingUser = true;
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
                <h2 className="page-title">Manage SSO</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="page-body">
          {true && (
            <div className="container-xl">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Add new user</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={this.createUser} noValidate>
                    <div className="form-group mb-3 ">
                      <div className="row">
                        <div className="col">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter First Name"
                            name="firstName"
                            onChange={this.changeNewUserOption.bind(this, 'firstName')}
                            value={this.state.fields['firstName']}
                          />
                          <span className="text-danger">{this.state.errors['firstName']}</span>
                        </div>
                        <div className="col">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Last Name"
                            name="lastName"
                            onChange={this.changeNewUserOption.bind(this, 'lastName')}
                            value={this.state.fields['lastName']}
                          />
                          <span className="text-danger">{this.state.errors['lastName']}</span>
                        </div>
                      </div>
                    </div>
                    <div className="form-group mb-3 ">
                      <label className="form-label">Email address</label>
                      <div>
                        <input
                          type="text"
                          className="form-control"
                          aria-describedby="emailHelp"
                          placeholder="Enter email"
                          name="email"
                          onChange={this.changeNewUserOption.bind(this, 'email')}
                          value={this.state.fields['email']}
                        />
                        <span className="text-danger">{this.state.errors['email']}</span>
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
                          })
                        }
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`btn mx-2 btn-primary ${creatingUser ? 'btn-loading' : ''}`}
                        disabled={true}
                      >
                        Create User
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
