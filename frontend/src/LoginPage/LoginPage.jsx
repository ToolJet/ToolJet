import React from 'react';
import { authenticationService } from '@/_services';

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
                    alert('Invalid username or password');
                }
            );
    }

    render() {
        return (
            <div class="page page-center">
                  <div class="container-tight py-2">
                    <div class="text-center mb-4">
                    <a href="."><img src="https://www.svgrepo.com/show/210145/egg.svg" height="80" alt=""/></a>
                    </div>
                    <form class="card card-md" action="." method="get" autocomplete="off">
                    <div class="card-body">
                        <h2 class="card-title text-center mb-4">Login to your account</h2>
                        <div class="mb-3">
                        <label class="form-label">Email address</label>
                        <input onChange={this.handleChange} name="email" type="email" class="form-control" placeholder="Enter email"/>
                        </div>
                        <div class="mb-2">
                        <label class="form-label">
                            Password
                            <span class="form-label-description">
                            <a href="/forgot-password">I forgot password</a>
                            </span>
                        </label>
                        <div class="input-group input-group-flat">
                            <input  onChange={this.handleChange} name="password" type="password" class="form-control"  placeholder="Password"  autocomplete="off"/>
                            <span class="input-group-text">
                            </span>
                        </div>
                        </div>
                        <div class="mb-2">
                        <label class="form-check">
                            <input type="checkbox" class="form-check-input"/>
                            <span class="form-check-label">Remember this device</span>
                        </label>
                        </div>
                        <div class="form-footer">
                        <button class="btn btn-primary w-100" onClick={this.authUser}>Sign in</button>
                        </div>
                    </div>
                    </form>
                    <div class="text-center text-muted mt-3">
                    Don't have account yet? <a href="./sign-up.html" tabindex="-1">Sign up</a>
                    </div>
                </div>
            </div>
        )
    }
}

export { LoginPage }; 
