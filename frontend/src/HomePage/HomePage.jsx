import React from 'react';
import { appService, authenticationService } from '@/_services';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';

class HomePage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentUser: authenticationService.currentUserValue,
            users: null,
            isLoading: true
        };
    }

    componentDidMount() {
        appService.getAll().then(data => this.setState({ 
            apps: data.apps, 
            isLoading: false,
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
        const  { currentUser, users, apps, isLoading } = this.state;
        return (
            <div className="wrapper">
                <header className="navbar navbar-expand-md navbar-light d-print-none">
                    <div className="container-xl">
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
                        <a href=".">
                        <img src="/images/logo.svg" width="110" height="32" className="navbar-brand-image"/>
                        </a>
                    </h1>
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <Link to={`/`} className="nav-link">
                                <span class="nav-link-title active">
                                    Apps
                                </span>
                            </Link>
                        </li>
                        <li class="nav-item">
                            <Link to={`/users`} className="nav-link">
                                <span class="nav-link-title">
                                    Users
                                </span>
                            </Link>
                        </li>
                    </ul>
                    <div className="navbar-nav flex-row order-md-last">
                        <div className="nav-item dropdown d-none d-md-flex me-3">
                        
                        <div className="dropdown-menu dropdown-menu-end dropdown-menu-card">
                            <div className="card">
                            <div className="card-body">
                                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus ad amet consectetur exercitationem fugiat in ipsa ipsum, natus odio quidem quod repudiandae sapiente. Amet debitis et magni maxime necessitatibus ullam.
                            </div>
                            </div>
                        </div>
                        </div>
                        <div className="nav-item dropdown">
                            <a href="#" className="nav-link d-flex lh-1 text-reset p-0" data-bs-toggle="dropdown" aria-label="Open user menu">
                                <div className="d-none d-xl-block ps-2">
                                <div>{this.state.currentUser.first_name}</div>
                                </div>
                            </a>
                            <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                                <a href="#" className="dropdown-item">Settings</a>
                                <a href="#" className="dropdown-item">Logout</a>
                            </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="page-wrapper">
                    <div className="container-xl">
                    <div className="page-header d-print-none">
                        <div className="row align-items-center">
                        <div className="col">
                            <div className="page-pretitle">
                            {/* Dashboard */}
                            </div>
                            <h2 className="page-title">
                                Your Applications
                            </h2>
                        </div>
                        <div className="col-auto ms-auto d-print-none">
                            
                        </div>
                        </div>
                    </div>
                </div>
                
                </div>
                <div className="page-body homepage-body">
                    <div className="container-xl">
                        <div className="row row-deck row-cards">

                            {!isLoading &&
                                <div className="col-sm-6 col-lg-3">
                                    <div className="card" role="button" onClick={this.createApp}>
                                        <div className="card-body p-5">
                                            <center>
                                                <img src="https://www.svgrepo.com/show/152121/plus.svg" width="15" height="50" alt=""/>
                                                <br></br>
                                                Create App
                                            </center>
                                        </div>
                                    </div>
                                </div>
                            }

                            {isLoading &&
                                <div className="row mt-3">
                                    {[1,2,3,4].map((key) => 
                                        <div className="col-sm-6 col-lg-3" key={key}>
                                            <div className="card p-5" role="button">
                                                <Skeleton count={3}/> 
                                            </div>
                                        </div>
                                    )}
                                </div>
                            }

                            {apps && 
                                <>
                                    {apps.map((app) => 
                                        <div className="col-sm-6 col-lg-3">
                                            <div className="card">
                                                <Link 
                                                    to={`/apps/${app.id}`} 
                                                    className="">

                                                        <div className="card-body p-5" >
                                                            <div className="row align-items-center">
                                                                <center>{app.name}</center>
                                                                
                                                                <small className="text-muted mt-2">
                                                                    An application to view whatever data whatever action etc etc. 
                                                                </small>
                                                            </div>
                                                        </div>

                                                </Link>
                                                {/* <div className="card-footer">
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
