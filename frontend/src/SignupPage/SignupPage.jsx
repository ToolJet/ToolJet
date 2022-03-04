import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { validateEmail } from '../_helpers/utils';

class SignupPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
    };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  signup = (e) => {
    e.preventDefault();

    this.setState({ isLoading: true });

    const { email } = this.state;

    if (!validateEmail(email)) {
      toast.error('Invalid email', {
        id: 'toast-login-auth-error',
        position: 'top-center',
      });
      this.setState({ isLoading: false });
      return;
    }

    authenticationService.signup(email).then(
      () => {
        // eslint-disable-next-line no-unused-vars
        const { from } = this.props.location.state || {
          from: { pathname: '/' },
        };
        this.setState({ isLoading: false, signupSuccess: true });
      },
      (e) => {
        toast.error(e?.error || 'Something went wrong!', {
          position: 'top-center',
        });
        this.setState({ isLoading: false });
      }
    );
  };

  render() {
    const { isLoading, signupSuccess } = this.state;

    return (
      <div className="page page-center">
        <div className="container-tight py-2">
          <div className="text-center mb-4">
            <a href="." className="navbar-brand-autodark">
              <img src="/assets/images/logo-color.svg" height="26" alt="" />
            </a>
          </div>
          <form className="card card-md" action="." method="get" autoComplete="off">
            {!signupSuccess && (
              <div className="card-body">
                <h2 className="card-title text-center mb-4">Create a ToolJet account</h2>
                <div className="mb-3">
                  <label className="form-label">Email address</label>
                  <input
                    onChange={this.handleChange}
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="Enter your business email"
                  />
                </div>
                <div className="form-footer">
                  <button className={`btn btn-primary w-100 ${isLoading ? 'btn-loading' : ''}`} onClick={this.signup}>
                    Sign up
                  </button>
                </div>
              </div>
            )}
            {signupSuccess && <div className="card-body">Please check your email for confirmation link</div>}
          </form>
          {!signupSuccess && (
            <div className="text-center text-muted mt-3">
              Already have an account? &nbsp;
              <Link to={'/login'} tabIndex="-1">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export { SignupPage };
