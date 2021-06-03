import React from 'react';
import { userService } from '@/_services';
import { toast } from 'react-toastify';
import queryString from 'query-string';

class InvitationPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      newSignup: queryString.parse(props.location.search).signup
    };

  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  setPassword = (e) => {
    e.preventDefault();

    const token = this.props.match.params.token;
    const { password, organization, newSignup, firstName, lastName } = this.state;

    this.setState({ isLoading: true });

    userService
      .setPasswordFromToken({ token, password, organization, newSignup, firstName, lastName })
      .then(() => {
        this.setState({ isLoading: false });
        toast.success('Password has been set successfully.', { hideProgressBar: true, position: 'top-center' });
        this.props.history.push('/login');
      })
      .catch(( { error }) => {
        this.setState({ isLoading: false });
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
      });
  };

  render() {
    const { isLoading, newSignup } = this.state;

    return (
      <div className="page page-center">
        <div className="container-tight py-2">
          <div className="text-center mb-4">
            <a href=".">
              <img src="/assets/images/logo-text.svg" height="30" alt="" />
            </a>
          </div>
          <form className="card card-md" action="." method="get" autoComplete="off">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Set up your account</h2>
              {newSignup === "true" && 
                <>  
                  <div className="mb-3">
                    <label className="form-label">First name</label>
                    <div className="input-group input-group-flat">
                      <input
                        onChange={this.handleChange}
                        name="firstName"
                        type="text"
                        className="form-control"
                        autoComplete="off"
                      />
                      <span className="input-group-text"></span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Last name</label>
                    <div className="input-group input-group-flat">
                      <input
                        onChange={this.handleChange}
                        name="lastName"
                        type="text"
                        className="form-control"
                        autoComplete="off"
                      />
                      <span className="input-group-text"></span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Organization</label>
                    <div className="input-group input-group-flat">
                      <input
                        onChange={this.handleChange}
                        name="organization"
                        type="text"
                        className="form-control"
                        autoComplete="off"
                      />
                      <span className="input-group-text"></span>
                    </div>
                  </div>
                </>  
              }
              
              <div className="mb-3">
                <label className="form-label">Password</label>
                <div className="input-group input-group-flat">
                  <input
                    onChange={this.handleChange}
                    name="password"
                    type="password"
                    className="form-control"
                    autoComplete="off"
                  />
                  <span className="input-group-text"></span>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm Password</label>
                <div className="input-group input-group-flat">
                  <input
                    onChange={this.handleChange}
                    name="password_confirmation"
                    type="password"
                    className="form-control"
                    autoComplete="off"
                  />
                  <span className="input-group-text"></span>
                </div>
              </div>
              <div className="form-footer">
                <p>
                By clicking the button below, you agree to our <a href="https://tooljet.io/terms">Terms and Conditions</a>.
                </p>
                <button
                  className={`btn mt-2 btn-primary w-100 ${isLoading ? ' btn-loading' : ''}`}
                  onClick={this.setPassword}
                  disabled={isLoading}
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

export { InvitationPage };
