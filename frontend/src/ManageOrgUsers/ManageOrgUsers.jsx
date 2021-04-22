import React from 'react';
import { organizationService } from '@/_services';
import { authenticationService } from '@/_services';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';

class ManageOrgUsers extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentUser: authenticationService.currentUserValue,
            showModal: false,
            isLoading: true,
            addingUser: false
        };
    }

    componentDidMount() {
        organizationService.getUsers(null).then(data => this.setState({ 
            users: data.users, 
            isLoading: false,
        }));    
    }

    hideModal = () => {
        this.setState({ 
            showModal: false
        });
    }
   
    render() {
        const { isLoading, users } = this.state;

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
                    <div className="navbar-nav flex-row order-md-last">
                    <div class="nav-item d-none d-md-flex me-3">
                        <div class="btn-list">
                            <Link to={`/users`}>
                                <button className="btn btn-sm" onClick={() => this.setState({ showModal: true })}> Manage Users</button>
                            </Link>
                        </div>
                        </div>
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
                                <div className="mt-1 small text-muted">Admin</div>
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
                                Users & Permissions
                            </h2>
                        </div>
                        <div className="col-auto ms-auto d-print-none">
                            <div className="btn btn-primary">
                                Add User
                            </div>
                        </div>
                        </div>
                    </div>
                </div>

                <div className="page-body">
                    <div className="container-xl">
                    {isLoading ? 
                        <div style={{width: '100%'}} className="p-5">
                            <Skeleton count={5}/> 
                        </div>
                    :
                        <div className="card">
                            <div class="card-table table-responsive table-bordered">
                                <table
                                        class="table table-vcenter">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th class="w-1"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => 
                                            <tr>
                                                <td >{user.name}</td>
                                                <td class="text-muted" >
                                                    <a href="#" class="text-reset">{user.email}</a>
                                                </td>
                                                <td class="text-muted" >
                                                    {user.role}
                                                </td>
                                                <td>
                                                    <a href="#">Remove</a>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    }
                    </div>
                </div>
            </div>
        </div>
            
        )
    }
}

export { ManageOrgUsers };
