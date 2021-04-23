import React from 'react';
import { authenticationService } from '@/_services';
import { toast } from 'react-toastify';

class LoginPage extends React.Component {
    constructor(props) {
        super(props);

        // redirect to home if already logged in
        if (authenticationService.currentUserValue) { 
            this.props.history.push('/');
        }
    }

    handleChange = (event) => {
        this.setState({ [event.target.name]: event.target.value });
    }

    authUser = (e) => {
        e.preventDefault();

        const { email, password } = this.state;

        authenticationService.login(email, password)
            .then(
                user => {
                    const { from } = this.props.location.state || { from: { pathname: "/" } };
                    this.props.history.push(from);
                },
                error => {
                    toast.error('Invalid username or password', { hideProgressBar: true, position: "top-center" });
                }
            );
    }

    render() {
        return (
            <div className="page page-center">
                  <div className="container-tight py-2">
                    <div className="text-center mb-4">
                    <a href="."><img src="/images/logo-text.svg" height="30" alt=""/></a>
                    </div>
                    <form className="card card-md" action="." method="get" autoComplete="off">
                    <div className="card-body">
                        <h2 className="card-title text-center mb-4">Login to your account</h2>
                        <div className="mb-3">
                        <label className="form-label">Email address</label>
                        <input onChange={this.handleChange} name="email" type="email" className="form-control" placeholder="Enter email"/>
                        </div>
                        <div className="mb-2">
                        <label className="form-label">
                            Password
                            <span className="form-label-description">
                            <a href="/forgot-password">Forgot password</a>
                            </span>
                        </label>
                        <div className="input-group input-group-flat">
                            <input  onChange={this.handleChange} name="password" type="password" className="form-control"  placeholder="Password"  autoComplete="off"/>
                            <span className="input-group-text">
                            </span>
                        </div>
                        </div>
                        <div className="mb-2">
                        <label className="form-check">
                            <input type="checkbox" className="form-check-input"/>
                            <span className="form-check-label">Remember this device</span>
                        </label>
                        </div>
                        <div className="form-footer">
                        <button className="btn btn-primary w-100" onClick={this.authUser}>Sign in</button>
                        </div>
                    </div>
                    </form>
                    <div className="text-center text-muted mt-3">
                    Don't have account yet? <a href="./sign-up.html" tabIndex="-1">Sign up</a>
                    </div>
                </div>
            </div>
        )
    }
}

export { LoginPage }; 
