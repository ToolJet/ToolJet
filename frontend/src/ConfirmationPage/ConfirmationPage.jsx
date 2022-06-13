import React from 'react';
import { appService } from '@/_services';
import { toast } from 'react-hot-toast';

class ConfirmationPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
    };
    this.formRef = React.createRef(null);
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  calculateOffset() {
    const elementHeight = this.formRef.current.getBoundingClientRect().top;
    return window.innerHeight - elementHeight;
  }

  setPassword = (e) => {
    e.preventDefault();
    const { token, organizationToken } = this.props.location.state;
    const { password, organization, role, firstName, lastName, password_confirmation } = this.state;
    this.setState({ isLoading: true });

    if (!password || !password_confirmation || !password.trim() || !password_confirmation.trim()) {
      this.setState({ isLoading: false });
      toast.error("Password shouldn't be empty or contain white space(s)", {
        position: 'top-center',
      });
      return;
    }

    if (password !== password_confirmation) {
      this.setState({ isLoading: false });
      toast.error("Passwords don't match", {
        position: 'top-center',
      });
      return;
    }

    appService
      .setPasswordFromToken({
        token,
        organizationToken,
        password,
        organization,
        role,
        firstName,
        lastName,
      })
      .then(() => {
        this.setState({ isLoading: false });
        toast.success('Account has been setup successfully.', {
          position: 'top-center',
        });
        this.props.history.push('/login');
      })
      .catch(({ error }) => {
        this.setState({ isLoading: false });
        toast.error(error, { position: 'top-center' });
      });
  };

  render() {
    const { isLoading } = this.state;
    const roles = [
      'CTO/CIO',
      'Founder/CEO',
      'IT Manager',
      'Developer',
      'Designer',
      'Sales Professional',
      'Marketing Professional',
      'Product Manager',
      'Other',
    ];

    const roleOptions = roles.map((role, index) => (
      <option key={index} value={role}>
        {role}
      </option>
    ));

    return (
      <div className="page page-center" ref={this.formRef} style={{ overflowY: 'scroll' }}>
        <div
          className="container-tight py-2 invitation-page"
          style={{ maxHeight: this.formRef.current && this.calculateOffset() }}
        >
          <div className="text-center mb-4">
            <a href=".">
              <img src="/assets/images/logo-color.svg" height="30" alt="" data-cy="page-logo" />
            </a>
          </div>
          <form className="card card-md" action="." method="get" autoComplete="off" data-cy="confirm-invite-container">
            <div className="card-body">
              <h2 className="card-title text-center mb-4" data-cy="card-title">
                Set up your account
              </h2>
              <div className="mb-3">
                <label className="form-label" data-cy="first-name-label">
                  First name
                </label>
                <div className="input-group input-group-flat">
                  <input
                    onChange={this.handleChange}
                    name="firstName"
                    type="text"
                    className="form-control"
                    autoComplete="off"
                    data-cy="first-name-input"
                  />
                  <span className="input-group-text"></span>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label" data-cy="last-name-label">
                  Last name
                </label>
                <div className="input-group input-group-flat">
                  <input
                    onChange={this.handleChange}
                    name="lastName"
                    type="text"
                    className="form-control"
                    autoComplete="off"
                    data-cy="last-name-input"
                  />
                  <span className="input-group-text"></span>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label" data-cy="company-label">
                  Company
                </label>
                <div className="input-group input-group-flat">
                  <input
                    onChange={this.handleChange}
                    name="organization"
                    type="text"
                    className="form-control"
                    autoComplete="off"
                    data-cy="workspace-input"
                  />
                  <span className="input-group-text"></span>
                </div>
              </div>
              <div className="mb-3">
                <div className="form-label" data-cy="role-label">
                  Role
                </div>
                <select
                  className="form-select"
                  name="role"
                  defaultValue=""
                  onChange={this.handleChange}
                  data-cy="role-options"
                >
                  <option value="" disabled>
                    Please select
                  </option>
                  {roleOptions}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" data-cy="password-label">
                  Password
                </label>
                <div className="input-group input-group-flat">
                  <input
                    onChange={this.handleChange}
                    name="password"
                    type="password"
                    className="form-control"
                    autoComplete="off"
                    data-cy="password-input"
                  />
                  <span className="input-group-text"></span>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label" data-cy="confirm-password-label">
                  Confirm Password
                </label>
                <div className="input-group input-group-flat">
                  <input
                    onChange={this.handleChange}
                    name="password_confirmation"
                    type="password"
                    className="form-control"
                    autoComplete="off"
                    data-cy="confirm-password-input"
                  />
                  <span className="input-group-text"></span>
                </div>
              </div>
              <div className="form-footer">
                <p data-cy="terms-and-condition-info">
                  By clicking the button below, you agree to our{' '}
                  <a href="https://tooljet.io/terms">Terms and Conditions</a>.
                </p>
                <button
                  className={`btn mt-2 btn-primary w-100 ${isLoading ? ' btn-loading' : ''}`}
                  onClick={this.setPassword}
                  disabled={isLoading}
                  data-cy="finish-setup-button"
                >
                  Finish account setup
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export { ConfirmationPage };
