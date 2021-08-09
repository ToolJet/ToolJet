import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from 'config';

class ResetPassword extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      token: '',
      email: '',
      password: '',
    };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleClick = (event) => {
    event.preventDefault();
    const { password, password_confirmation } = this.state;
    if (password !== password_confirmation) {
      toast.error("Password don't match");
      this.setState({
        password: '',
        password_confirmation: '',
      });
    } else {
      fetch(`${config.apiUrl}/reset_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.state),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.error) {
            toast.error(res.message);
          } else {
            toast.success(res.message);
            this.props.history.push('/login');
          }
        })
        .catch(console.log);
    }
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
              <h2 className="card-title text-center mb-4">Reset Password</h2>
              <div className="mb-3">
                <label className="form-label">Token</label>
                <input
                  onChange={this.handleChange}
                  name="token"
                  type="token"
                  className="form-control"
                  placeholder="Enter token"
                />
              </div>
              <div className="mb-2">
                <label className="form-label">New Password</label>
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
                <label className="form-label">Password Confirmation</label>
                <div className="input-group input-group-flat">
                  <input
                    onChange={this.handleChange}
                    name="password_confirmation"
                    type="password"
                    className="form-control"
                    placeholder="Password Confirmation"
                    autoComplete="off"
                  />
                  <span className="input-group-text"></span>
                </div>
              </div>
              <div className="form-footer">
                <button
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

export { ResetPassword };
