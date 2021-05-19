import React from 'react';
import { appService, folderService, authenticationService } from '@/_services';
import { Link } from 'react-router-dom';
import { Pagination, Header } from '@/_components';
import { Folders } from './Folders';
import { AppMenu } from './AppMenu';

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
          <div class="page-wrapper">
            <div class="container-xl">
            </div>
            <div class="page-body">
              <div class="container-xl d-flex flex-column justify-content-center">
                <div class="empty">
                  <div class="empty-img"><img src="/assets/images/blank.svg" height="128"  alt=""/>
                  </div>
                  <p class="empty-title">You haven't created any apps yet.</p>
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

        {(isLoading || meta.total_count > 0) && 

        <div className="page-body homepage-body">
          <div className="container-xl">
            <div className="row">              
              <div className="col-3">
                <br />
                <Folders
                  foldersLoading={this.state.foldersLoading}
                  totalCount={this.state.meta.total_count}
                  folders={this.state.folders}
                  currentFolder={currentFolder}
                  folderChanged={this.folderChanged}
                />
              </div>

              <div className="col-md-9">
                
                    <div className="w-100 mb-5">
                      <div className="row align-items-center">
                        <div className="col">
                          <h2 className="page-title">{currentFolder.id ? `Folder: ${currentFolder.name}` : 'All applications'}</h2>
                        </div>
                      <div className="col-auto ms-auto d-print-none">
                        <button className={`btn btn-primary ${ creatingApp ? 'btn-loading' : ''}`} onClick={this.createApp}>+ App</button>
                      </div>
                    </div>

                    <div class="table-responsive bg-white w-100 apps-table mt-3">
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
