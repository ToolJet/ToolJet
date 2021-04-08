import React from 'react';
import { useHistory } from "react-router-dom";
import { appService, authenticationService } from '@/_services';
import { Router, Route, Link } from 'react-router-dom';

class HomePage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentUser: authenticationService.currentUserValue,
            users: null
        };
    }

    componentDidMount() {
        appService.getAll().then(data => this.setState({ 
            apps: data.apps, 
            loadingDataSources: false,
        }));
    }

    createApp = () => {
        let _self = this;
        appService.createApp().then((data) => {
            console.log(data)
            _self.props.history.push(`/apps/${data.id}`);
        });
    }

    render() {
        const { currentUser, users, apps } = this.state;
        return (
            <div class="wrapper">
                <header class="navbar navbar-expand-md navbar-light d-print-none">
                    <div class="container-xl">
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <h1 class="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
                        <a href=".">
                        <img src="https://www.svgrepo.com/show/210145/egg.svg" width="110" height="32" alt="StackEgg" class="navbar-brand-image"/>
                        </a>
                    </h1>
                    <div class="navbar-nav flex-row order-md-last">
                        <div class="nav-item dropdown d-none d-md-flex me-3">
                        <a href="#" class="nav-link px-0" data-bs-toggle="dropdown" tabindex="-1" aria-label="Show notifications">
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg>
                            <span class="badge bg-red"></span>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end dropdown-menu-card">
                            <div class="card">
                            <div class="card-body">
                                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus ad amet consectetur exercitationem fugiat in ipsa ipsum, natus odio quidem quod repudiandae sapiente. Amet debitis et magni maxime necessitatibus ullam.
                            </div>
                            </div>
                        </div>
                        </div>
                        <div class="nav-item dropdown">
                            <a href="#" class="nav-link d-flex lh-1 text-reset p-0" data-bs-toggle="dropdown" aria-label="Open user menu">
                                <div class="d-none d-xl-block ps-2">
                                <div>{this.state.currentUser.first_name}</div>
                                <div class="mt-1 small text-muted">Admin</div>
                                </div>
                            </a>
                            <div class="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                                <a href="#" class="dropdown-item">Settings</a>
                                <a href="#" class="dropdown-item">Logout</a>
                            </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div class="page-wrapper">
                    <div class="container-xl">
                    <div class="page-header d-print-none">
                        <div class="row align-items-center">
                        <div class="col">
                            <div class="page-pretitle">
                            {/* Dashboard */}
                            </div>
                            <h2 class="page-title">
                                Your Applications
                            </h2>
                        </div>
                        <div class="col-auto ms-auto d-print-none">
                            
                        </div>
                        </div>
                    </div>
                </div>
                
                </div>
                <div class="page-body homepage-body">
                    <div class="container-xl">
                        <div class="row row-deck row-cards">
                            <div class="col-sm-6 col-lg-3">
                                <div class="card" role="button" onClick={this.createApp}>
                                    <div class="card-body p-5">
                                        <center>
                                            <img src="https://www.svgrepo.com/show/152121/plus.svg" width="15" height="50" alt=""/>
                                            <br></br>
                                            Create App
                                        </center>
                                    </div>
                                </div>
                            </div>

                            {apps && 
                                <>
                                    {apps.map((app) => 
                                        <div class="col-sm-6 col-lg-3">
                                            <div class="card">
                                                <Link 
                                                    to={`/apps/${app.id}`} 
                                                    className="">

                                                        <div class="card-body p-5" >
                                                            <div class="row align-items-center">
                                                                <center>{app.name}</center>
                                                                
                                                                <small className="text-muted mt-2">
                                                                    An application to view whatever data whatever action etc etc. 
                                                                </small>
                                                            </div>
                                                        </div>

                                                </Link>
                                                {/* <div class="card-footer">
                                                    <div className="row">
                                                        <Link 
                                                            to={`/applications/${app.id}`} 
                                                            target="_blank"
                                                            className="btn btn-ghost-primary btn-sm mt-2">
                                                            <img width="20" height="20" src="https://www.svgrepo.com/show/56347/rocket-launch.svg" alt=""/> Launch
                                                        </Link>
                                                    </div>
                                                </div> */}
                                            </div>
                                        </div>
                                    )}
                                </>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export { HomePage };