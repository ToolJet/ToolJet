import React from 'react';

import { userService, authenticationService } from '@/_services';

class HomePage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentUser: authenticationService.currentUserValue,
            users: null
        };
    }

    componentDidMount() {
    }

    render() {
        const { currentUser, users } = this.state;
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
                                <span class="avatar avatar-sm" style={{backgroundImage: "url('https://www.svgrepo.com/show/24707/avatar.svg')"}}></span>
                                <div class="d-none d-xl-block ps-2">
                                <div>Paweł Kuna</div>
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
                            Applications
                            </h2>
                        </div>
                        <div class="col-auto ms-auto d-print-none">
                            {/* <div class="btn-list">
                            <a href="#" class="btn btn-primary d-none d-sm-inline-block" data-bs-toggle="modal" data-bs-target="#modal-report">
                                <svg xmlns="http://www.w3.org/2000/svg" class="icon mb-1" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Application
                            </a>
                            <a href="#" class="btn btn-primary d-sm-none btn-icon" data-bs-toggle="modal" data-bs-target="#modal-report" aria-label="Create new report">
                                <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </a>
                            </div> */}
                        </div>
                        </div>
                    </div>
                </div>
                
                </div>
                <div class="page-body">
                    <div class="container-xl">
                        <div class="row row-deck row-cards">
                            <div class="col-sm-6 col-lg-3">
                                <div class="card" role="button">
                                    <div class="card-body p-5">
                                        <center>
                                            <img src="https://www.svgrepo.com/show/152121/plus.svg" width="15" height="50" alt=""/>
                                            <br></br>
                                            Create App
                                        </center>
                                    </div>
                                </div>
                            </div>

                            <div class="col-sm-6 col-lg-3">
                                <div class="card">
                                <div class="card-body">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <center><img src="https://www.svgrepo.com/show/258362/browser-website.svg" width="100" height="100" alt=""/></center>

                                            </div>
                                            <div className="col-md-6">
                                                <a href="#" class="btn btn-ghost-light btn-sm mt-2">
                                                    <img width="20" height="20" src="https://www.svgrepo.com/show/56347/rocket-launch.svg" alt=""/> Launch
                                                </a>
                                                <a href="#" class="btn btn-ghost-light btn-sm mt-2">
                                                    <img width="20" height="14" src="https://www.svgrepo.com/show/13683/edit.svg" alt=""/> Edit
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer">
                                        <div class="row align-items-center">
                                            <center>Sales Data</center>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-sm-6 col-lg-3">
                                <div class="card">
                                <div class="card-body">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <center><img src="https://www.svgrepo.com/show/261928/website.svg" width="100" height="100" alt=""/></center>

                                            </div>
                                            <div className="col-md-6">
                                                <a href="#" class="btn btn-ghost-light btn-sm mt-2">
                                                    <img width="20" height="20" src="https://www.svgrepo.com/show/56347/rocket-launch.svg" alt=""/> Launch
                                                </a>
                                                <a href="#" class="btn btn-ghost-light btn-sm mt-2">
                                                    <img width="20" height="14" src="https://www.svgrepo.com/show/13683/edit.svg" alt=""/> Edit
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer">
                                        <div class="row align-items-center">
                                            <center>Customers</center>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-sm-6 col-lg-3">
                                <div class="card">
                                    <div class="card-body">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <center><img src="https://www.svgrepo.com/show/154015/website.svg" width="100" height="100" alt=""/></center>

                                            </div>
                                            <div className="col-md-6">
                                                <a href="#" class="btn btn-ghost-light btn-sm mt-2">
                                                    <img width="20" height="20" src="https://www.svgrepo.com/show/56347/rocket-launch.svg" alt=""/> Launch
                                                </a>
                                                <a href="#" class="btn btn-ghost-light btn-sm mt-2">
                                                    <img width="20" height="14" src="https://www.svgrepo.com/show/13683/edit.svg" alt=""/> Edit
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer">
                                        <div class="row align-items-center">
                                            <center>Customers</center>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-sm-6 col-lg-3">
                                <div class="card">
                                        <div class="card-body">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <center><img src="https://www.svgrepo.com/show/149185/website.svg" width="100" height="100" alt=""/></center>

                                                </div>
                                                <div className="col-md-6">
                                                    <a href="#" class="btn btn-ghost-light btn-sm mt-2">
                                                        <img width="20" height="20" src="https://www.svgrepo.com/show/56347/rocket-launch.svg" alt=""/> Launch
                                                    </a>
                                                    <a href="#" class="btn btn-ghost-light btn-sm mt-2">
                                                        <img width="20" height="14" src="https://www.svgrepo.com/show/13683/edit.svg" alt=""/> Edit
                                                    </a>
                                                </div>
                                            </div>
                                    </div>
                                    <div class="card-footer">
                                        <div class="row align-items-center">
                                            <center>Customers</center>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export { HomePage };