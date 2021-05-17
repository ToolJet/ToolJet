import React from 'react';
import { appService, authenticationService } from '@/_services';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import { history } from '@/_helpers';

class HomePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      users: null,
      isLoading: true,
      creatingApp: false,
      apps: []
    };
  }

  componentDidMount() {
    appService.getAll().then((data) => this.setState({
      apps: data.apps,
      isLoading: false
    }));
  }

  createApp = () => {
    let _self = this;
    _self.setState({ creatingApp: true });
    appService.createApp().then((data) => {
      console.log(data);
      _self.props.history.push(`/apps/${data.id}`);
    });
  };

  logout = () => {
    authenticationService.logout();
    history.push('/login');
  }

  render() {
    const {
      apps, isLoading, creatingApp
    } = this.state;
    return (
      <div className="wrapper home-page">
        <header className="navbar navbar-expand-md navbar-light d-print-none">
          <div className="container-xl">
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
              <span className="navbar-toggler-icon"></span>
            </button>
            <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
              <a href=".">
                <img src="/images/logo.svg" width="110" height="32" className="navbar-brand-image" />
              </a>
            </h1>
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link to={'/'} className="nav-link active">
                  <span className="nav-link-title">
                    <img src="https://www.svgrepo.com/show/309806/office-apps.svg" className="mx-2" width="12" height="12" /> Apps
                  </span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to={'/users'} className="nav-link">
                  <span className="nav-link-title">
                    <img src="https://www.svgrepo.com/show/154834/users.svg" className="mx-2" width="12" height="12" />Users
                    </span>
                </Link>
              </li>
            </ul>
            <div className="navbar-nav flex-row order-md-last">
              <div className="nav-item dropdown d-none d-md-flex me-3">
                <div className="dropdown-menu dropdown-menu-end dropdown-menu-card">
                  <div className="card">
                    <div className="card-body">
                      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus ad amet consectetur
                      exercitationem fugiat in ipsa ipsum, natus odio quidem quod repudiandae sapiente. Amet debitis et
                      magni maxime necessitatibus ullam.
                    </div>
                  </div>
                </div>
              </div>
              <div className="nav-item dropdown">
                <a
                  href="#"
                  className="nav-link d-flex lh-1 text-reset p-0"
                  data-bs-toggle="dropdown"
                  aria-label="Open user menu"
                >
                  <div className="d-none d-xl-block ps-2">
                    {/* <div>{this.state.currentUser.first_name}</div> */}
                    <span onClick={this.logout}>Logout</span>
                  </div>
                </a>
                <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                  <a href="#" className="dropdown-item">
                    Settings
                  </a>
                  <a href="#" className="dropdown-item">
                    Logout
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        {!isLoading && apps.length === 0 && 
          <div class="page-wrapper">
            <div class="container-xl">
            </div>
            <div class="page-body">
              <div class="container-xl d-flex flex-column justify-content-center">
                <div class="empty">
                  <div class="empty-img"><img src="/assets/images/blank.svg" height="128"  alt=""/>
                  </div>
                  <p class="empty-title">You haven't created any apps yet.</p>
                  <p class="empty-subtitle text-muted">
                    Try adjusting your search or filter to find what you're looking for.
                  </p>
                  <div class="empty-action">
                    <a onClick={this.createApp} class="btn btn-primary text-light">
                      <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Create your first app
                    </a>
                    <a href="https://docs.tooljet.io" target="_blank" class="btn btn-primary text-light mx-2">
                      Read documentation
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <div className="page-body homepage-body">
          <div className="container-xl">
            <div className="row row-deck row-cards">              
              <div className="col-md-2">

              </div>

              <div className="col-md-8">
                {isLoading && (
                  <div className="row mt-3 w-100">
                    <Skeleton count={3} />
                  </div>
                )}
                {apps.length > 0 && (
                    <div className="w-100 mb-5">
                      <div className="row align-items-center">
                        <div className="col">
                          <h2 className="page-title">Your Applications</h2>
                        </div>
                      <div className="col-auto ms-auto d-print-none">
                        <button className={`btn btn-primary ${ creatingApp ? 'btn-loading' : ''}`} onClick={this.createApp}>+ App</button>
                      </div>
                    </div>

                    <div class="table-responsive bg-white w-100 apps-table mt-3">
                      <table
                        class="table table-vcenter">
                        <tbody>
                          {apps.map((app) => (
                          <tr class="row">
                            <td class="col p-3">
                              <span className="app-title mb-3">{app.name}</span> <br />
                              <small className="pt-2">created {app.created_at} ago by {app.user.first_name} {app.user.last_name} </small>
                            </td>
                            <td class="text-muted col-auto pt-4">
                              <Link
                                to={`/applications/${app.id}`}
                                target="_blank"
                              >
                                <span class="badge bg-blue-lt mx-2">launch</span>

                              </Link>
                          
                              <Link
                                to={`/apps/${app.id}`}
                              >
                                <span class="badge bg-green-lt">Edit</span>

                              </Link>
                          
                              <span class="badge bg-red-lt mx-2">archive</span>
                            </td>
                          </tr>))
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }
}

export { HomePage };
