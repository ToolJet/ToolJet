import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

class LoginPage extends React.Component {
  constructor(props) {
    super(props);

    // redirect to home if already logged in
    if (authenticationService.currentUserValue) {
      this.props.history.push('/');
    }

    this.state = {
      isLoading: false
    };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  authUser = (e) => {
    e.preventDefault();

    this.setState({ isLoading: true });

    const { email, password } = this.state;

    authenticationService.login(email, password).then(
      () => {
        const { from } = this.props.location.state || { from: { pathname: '/' } };
        this.props.history.push(from);
        this.setState({ isLoading: false });
      },
      () => {
        toast.error('Invalid username or password', { hideProgressBar: true, position: 'top-center' });
        this.setState({ isLoading: false });
      }
    );
  };

  render() {
    const { isLoading } = this.state;

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
              <h2 className="card-title text-center mb-4">Login to your account</h2>
              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input
                  onChange={this.handleChange}
                  name="email"
                  type="email"
                  className="form-control"
                  placeholder="Enter email"
                />
              </div>
              <div className="mb-2">
                <label className="form-label">
                  Password
                  <span className="form-label-description">
                    <a tabIndex="-1" href="/forgot-password">Forgot password</a>
                  </span>
                </label>
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
              <div className="form-footer">
                <button className={`btn btn-primary w-100 ${isLoading ? 'btn-loading' : ''}`} onClick={this.authUser}>
                  Sign in
                </button>
              </div>
            </div>
          </form>
          <div className="text-center text-muted mt-3">
            Don&apos;t have account yet? &nbsp;
            <Link to={'/signup'} tabIndex="-1">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export { LoginPage };
