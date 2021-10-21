import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import queryString from 'query-string';

class LoginPage extends React.Component {
  constructor(props) {
    super(props);

    // redirect to home if already logged in
    if (authenticationService.currentUserValue) {
      this.props.history.push('/');
    }

    this.state = {
      isLoading: false,
      showPassword: false,
    };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleOnCheck = () => {
    this.setState({ showPassword: !showPassword });
  };

  authUser = (e) => {
    e.preventDefault();

    this.setState({ isLoading: true });

    const { email, password } = this.state;

    authenticationService.login(email, password).then(
      () => {
        const params = queryString.parse(this.props.location.search);
        const { from } = params.redirectTo ? { from: { pathname: params.redirectTo } } : { from: { pathname: '/' } };
        this.props.history.push(from);
        this.setState({ isLoading: false });
      },
      () => {
        toast.error('Invalid email or password', {
          toastId: 'toast-login-auth-error',
          hideProgressBar: true,
          position: 'top-center',
        });
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
            <a href="." className="navbar-brand-autodark">
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
                  placeholder="Email"
                  data-testid="emailField"
                />
              </div>
              <div className="mb-2">
                <label className="form-label">
                  Password
                  <span className="form-label-description">
                    <Link to={'/forgot-password'} tabIndex="-1">
                      Forgot password
                    </Link>
                  </span>
                </label>
                <div className="input-group input-group-flat">
                  <input
                    onChange={this.handleChange}
                    name="password"
                    type={this.state.showPassword ?"text" : "password"}
                    className="form-control"
                    placeholder="Password"
                    autoComplete="off"
                    data-testid="passwordField"
                  />
                  <span className="input-group-text"></span>
                </div>
              </div>
              <div class="form-check">
                <input 
                  type="checkbox" 
                  class="form-check-input" 
                  id="check-input"
                  name="check-input"
                  onChange = {this.handleOnCheck}
                />
                <label
                  class="form-check-label" 
                  for="check-input"
                >
                  show password
                </label>
              </div>
              <div className="form-footer">
                <button
                  data-testid="loginButton"
                  className={`btn btn-primary w-100 ${isLoading ? 'btn-loading' : ''}`}
                  onClick={this.authUser}
                >
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
