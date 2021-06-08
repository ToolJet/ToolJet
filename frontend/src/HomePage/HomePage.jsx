import React from 'react';
import { appService, folderService, authenticationService } from '@/_services';
import { Link } from 'react-router-dom';
import { Pagination, Header } from '@/_components';
import { Folders } from './Folders';
import { AppMenu } from './AppMenu';
import { BlankPage } from './BlankPage';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { renderTooltip } from '@/_helpers/appUtils';

class HomePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      users: null,
      isLoading: true,
      creatingApp: false,
      currentFolder: {},
      apps: [],
      folders: [],
      meta: {
        count: 1
      }
    };
  }

  componentDidMount() {
    this.fetchApps(0, this.state.currentFolder.id);
    this.fetchFolders();
  }

  fetchApps = (page, folder) => {
    this.setState({
      apps: [],
      isLoading: true
    })

    appService.getAll(page, folder).then((data) => this.setState({
      apps: data.apps,
      meta: data.meta,
      isLoading: false
    }));
  }

  fetchFolders = () => {
    this.setState({
      foldersLoading: true
    })

    folderService.getAll().then((data) => this.setState({
      folders: data.folders,
      foldersLoading: false
    }));
  }

  pageChanged = (page) => {
    this.fetchApps(page, this.state.currentFolder.id);
  }

  folderChanged = (folder) => {
    this.setState({'currentFolder': folder});
    this.fetchApps(0, folder.id);
  }

  foldersChanged = () => {
    this.fetchFolders();
  }

  createApp = () => {
    let _self = this;
    _self.setState({ creatingApp: true });
    appService.createApp().then((data) => {
      console.log(data);
      _self.props.history.push(`/apps/${data.id}`);
    });
  };

  render() {
    const {
      apps, isLoading, creatingApp, meta, currentFolder
    } = this.state;
    return (
      <div className="wrapper home-page">

        <Header

        />
        {!isLoading && meta.total_count === 0 &&
          <BlankPage
            createApp={this.createApp}
          />
        }

        {(isLoading || meta.total_count > 0) &&

        <div className="page-body homepage-body">
          <div className="container-xl">
            <div className="row">
              <div className="col-12 col-lg-3 mb-5">
                <br />
                <Folders
                  foldersLoading={this.state.foldersLoading}
                  totalCount={this.state.meta.total_count}
                  folders={this.state.folders}
                  currentFolder={currentFolder}
                  folderChanged={this.folderChanged}
                  foldersChanged={this.foldersChanged}
                />
              </div>

              <div className="col-md-9">

                    <div className="w-100 mb-5">
                      <div className="row align-items-center">
                        <div className="col">
                          <h2 className="page-title">{currentFolder.id ? `Folder: ${currentFolder.name}` : 'All applications'}</h2>
                        </div>
                      <div className="col-auto ms-auto d-print-none">
                        <button className={`btn btn-primary d-none d-lg-inline ${ creatingApp ? 'btn-loading' : ''}`} onClick={this.createApp}>Create new application</button>
                      </div>
                    </div>

                    <div className={currentFolder.count == 0 ? 'table-responsive bg-white w-100 apps-table mt-3 d-flex align-items-center' : 'table-responsive bg-white w-100 apps-table mt-3'} style={{minHeight: '600px'}}>
                      <table
                        class="table table-vcenter">
                        <tbody>
                          {isLoading && (
                            <>
                              {Array.from(Array(10)).map(() => (
                                 <tr class="row">
                                   <td class="col-3 p-3">
                                      <div class="skeleton-line w-10"></div>
                                      <div class="skeleton-line w-10"></div>
                                    </td>
                                    <td class="col p-3">
                                    </td>
                                    <td class="text-muted col-auto col-1 pt-4">
                                      <div class="skeleton-line"></div>
                                    </td>
                                    <td class="text-muted col-auto col-1 pt-4">
                                      <div class="skeleton-line"></div>
                                    </td>
                                 </tr>
                               ))}

                            </>
                          )}

                          {meta.total_count > 0 && (
                            <>

                            {apps.map((app) => (
                            <tr class="row">
                              <td class="col p-3">
                                <span className="app-title mb-3">{app.name}</span> <br />
                                <small className="pt-2">created {app.created_at} ago by {app.user.first_name} {app.user.last_name} </small>
                              </td>
                              <td class="text-muted col-auto pt-4">
                                <Link
                                  to={`/apps/${app.id}`}
                                  className="d-none d-lg-inline"
                                >
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={(props) => renderTooltip({props, text: 'Open in app builder'})}
                                  >
                                    <span class="badge bg-green-lt">
                                    Edit
                                    </span>
                                  </OverlayTrigger>
                                </Link>
                                <Link
                                  to={`/applications/${app.id}`}
                                  target="_blank"
                                >
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={(props) => renderTooltip({props, text: 'Open in app viewer'})}
                                  >
                                    <span class="badge bg-blue-lt mx-2">launch</span>

                                  </OverlayTrigger>
                                </Link>

                                <AppMenu
                                  app={app}
                                  folders={this.state.folders}
                                  foldersChanged={this.foldersChanged}
                                />
                              </td>
                            </tr>))
                            }
                            </>)
                          }
                          {currentFolder.count == 0  && (
                            <div>
                              <img className = "mx-auto d-block" src ="assets/images/icons/empty-folder-svgrepo-com.svg" height="120px"/>
                              <h3 className= "text-center">This folder is empty</h3>
                              </div>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {meta.total_count > 0 && (
                      <Pagination
                        currentPage={meta.current_page}
                        count={meta.folder_count}
                        totalPages={meta.total_pages}
                        pageChanged={this.pageChanged}
                      />
                    )}
                  </div>
              </div>

            </div>
          </div>
        </div>
        }
      </div>
    );
  }
}

export { HomePage };
