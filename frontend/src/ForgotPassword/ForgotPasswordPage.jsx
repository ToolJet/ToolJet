import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from 'config';

class ForgotPassword extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      email: '',
    };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleClick = (event) => {
    event.preventDefault();
    fetch(`${config.apiUrl}/forgot_password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: this.state.email }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.error) {
          toast.error(res.error, { toastId: 'toast-forgot-password-email-error' });
        } else {
          toast.success(res.message, { toastId: 'toast-forgot-password-confirmation-code' });
          this.props.history.push('/reset-password');
        }
      })
      .catch(console.log);
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
              <h2 className="card-title text-center mb-4">Forgot Password</h2>
              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input
                  onChange={this.handleChange}
                  name="email"
                  type="email"
                  className="form-control"
                  placeholder="Enter email"
                  data-testid="emailField"
                />
              </div>
              <div className="form-footer">
                <button
                  data-testid="submitButton"
                  className={`btn btn-primary w-100 ${isLoading ? 'btn-loading' : ''}`}
                  onClick={this.handleClick}
                >
                  Submit
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

export { ForgotPassword };
