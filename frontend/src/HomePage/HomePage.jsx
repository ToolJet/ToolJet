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
      isLoading: true
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
      apps, isLoading
    } = this.state;
    return (
      <div className="wrapper">
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
                  <span className="nav-link-title">Apps</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to={'/users'} className="nav-link">
                  <span className="nav-link-title">Users</span>
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

        <div className="page-wrapper">
          <div className="container-xl">
            <div className="page-header d-print-none">
              <div className="row align-items-center">
                <div className="col">
                  <div className="page-pretitle">{/* Dashboard */}</div>
                  <h2 className="page-title">Your Applications</h2>
                </div>
                <div className="col-auto ms-auto d-print-none"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="page-body homepage-body">
          <div className="container-xl">
            <div className="row row-deck row-cards">
              {!isLoading && (
                <div className="col-sm-6 col-lg-3 ">
                  <div className="card create-app" role="button" onClick={this.createApp}>
                    <div className="card-body create-app-body" style={{ maxHeight: '155px', marginTop: '10px' }}>
                      <center>
                        <img src="https://www.svgrepo.com/show/152121/plus.svg" width="15" height="50" alt="" />
                        <br></br>
                        Create App
                      </center>
                    </div>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="row mt-3">
                  {[1, 2, 3, 4].map((key) => (
                    <div className="col-sm-6 col-lg-3" key={key}>
                      <div className="card p-5" role="button">
                        <Skeleton count={3} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {apps && (
                <>
                  {apps.map((app) => (
                    <div className="col-sm-6 col-lg-3" key={app.id}>
                      <div className="card app-card">
                        <div
                          // to={`/apps/${app.id}`}
                          className=""
                        >
                          <div className="card-body p-5">
                            <div className="row align-items-center">
                              <center className="app-name">{app.name}</center>
                              <div className="app-action-buttons row">
                                <div className="col-md-6">
                                  <Link
                                    to={`/applications/${app.id}`}
                                    target="_blank"
                                    className="btn btn-primary text-white mx-2"
                                  >
                                    Launch
                                  </Link>
                                </div>
                                <div className="col-md-6">
                                  <Link to={`/apps/${app.id}`} className="btn btn-primary text-white mx-2">
                                    Edit
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export { HomePage };
