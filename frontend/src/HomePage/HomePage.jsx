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

        {apps.length > 0 && (
          <div className="page-wrapper">
            <div className="container-xl">
              <div className="page-header d-print-none">
                <div className="row align-items-center">
                  <div className="col">
                    <h2 className="page-title">Your Applications</h2>
                  </div>
                  <div className="col-auto ms-auto d-print-none"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="page-body homepage-body">
          <div className="container-xl">
            <div className="row row-deck row-cards">
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
                          <a href="https://docs.tooljet.io" class="btn btn-primary text-light mx-2">
                           Read documentation
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }

              {apps.length > 0 && (
                <>
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
                  {apps.map((app) => (
                    <div className="col-sm-6 col-lg-3" key={app.id}>
                      <div className="card app-card">
                        <div
                          // to={`/apps/${app.id}`}
                          className=""
                        >
                          <div className="card-body p-5">
                            <div className="row align-items-center">
                              <center className="app-name text-muted">{app.name}</center>
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
