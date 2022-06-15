import React from 'react';
import { appService } from '@/_services';
import { toast } from 'react-hot-toast';

class OrganizationInvitationPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
    };
    this.formRef = React.createRef(null);
    this.single_organization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  acceptInvite = (e, isSetPassword) => {
    e.preventDefault();

    const token = this.props.location.state.token;
    const { password, password_confirmation } = this.state;
    this.setState({ isLoading: true });

    if (isSetPassword) {
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
    }

    appService
      .acceptInvite({
        token,
        password,
      })
      .then((response) => {
        this.setState({ isLoading: false });
        response.json().then((data) => {
          if (!response.ok) {
            return toast.error(data?.message || 'Error while setting up your account.', { position: 'top-center' });
          }
          toast.success(`Added to the workspace${isSetPassword ? ' and password has been set ' : ' '}successfully.`, {
            position: 'top-center',
          });
          this.props.history.push('/login');
        });
      });
  };

  render() {
    const { isLoading } = this.state;

    return (
      <div className="page page-center" ref={this.formRef}>
        <div className="container-tight py-2 invitation-page" data-cy="confirm-invite-container">
          <div className="text-center mb-4">
            <a href=".">
              <img src="/assets/images/logo-color.svg" height="30" alt="" data-cy="page-logo" />
            </a>
          </div>
          <form className="card card-md" action="." method="get" autoComplete="off">
            <div className="card-body">
              {!this.single_organization ? (
                <>
                  <h2 className="card-title text-center mb-2" data-cy="card-title">
                    Already have an account?
                  </h2>
                  <div className="mb-3">
                    <button
                      className={`btn mt-2 btn-primary w-100 ${isLoading ? ' btn-loading' : ''}`}
                      onClick={(e) => this.acceptInvite(e)}
                      disabled={isLoading}
                      data-cy="accept-invite-button"
                    >
                      Accept invite
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="card-title text-center mb-4" data-cy="card-title">
                    Set up your account
                  </h2>
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
                      onClick={(e) => this.acceptInvite(e, true)}
                      disabled={isLoading}
                      data-cy="finish-setup-button"
                    >
                      Finish account setup and accept invite
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export { OrganizationInvitationPage };
