import React from 'react';
import { userService } from '@/_services';
import { toast } from 'react-toastify';

class InvitationPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
    };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  setPassword = (e) => {
    e.preventDefault();

    const token = this.props.match.params.token;
    const password = this.state.password;

    this.setState({ isLoading: true });

    userService
      .setPasswordFromToken(token, password)
      .then((data) => {
        this.setState({ isLoading: false });
        toast.success('Password has been set successfully.', { hideProgressBar: true, position: 'top-center' });
        this.props.history.push('/login');
      })
      .catch((error) => {
        this.setState({ isLoading: false });
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
      });
  };

  render() {
    const { isLoading } = this.state;

    return (
      <div className="page page-center">
        <div className="container-tight py-2">
          <div className="text-center mb-4">
            <a href=".">
              <img src="/images/logo-text.svg" height="30" alt="" />
            </a>
          </div>
          <form className="card card-md" action="." method="get" autoComplete="off">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Set up your account</h2>
              <div className="mb-2">
                <label className="form-label">Password</label>
                <div className="input-group input-group-flat">
                  <input
                    onChange={this.handleChange}
                    name="password"
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    autoComplete="off"
                  />
                  <span className="input-group-text"></span>
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label">Confirm Password</label>
                <div className="input-group input-group-flat">
                  <input
                    onChange={this.handleChange}
                    name="password_confirmation"
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    autoComplete="off"
                  />
                  <span className="input-group-text"></span>
                </div>
              </div>
              <div className="form-footer">
                <button
                  className={`btn btn-primary w-100 ${isLoading ? ' btn-loading' : ''}`}
                  onClick={this.setPassword}
                  disabled={isLoading}
                >
                  Set Password
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
