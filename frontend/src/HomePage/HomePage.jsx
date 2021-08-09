import React from 'react';
import { appService, folderService, authenticationService } from '@/_services';
import { Link } from 'react-router-dom';
import { Pagination, Header } from '@/_components';
import { Folders } from './Folders';
import { AppMenu } from './AppMenu';
import { BlankPage } from './BlankPage';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { renderTooltip } from '@/_helpers/appUtils';
import { ConfirmDialog } from '@/_components';
import { toast } from 'react-toastify';

class HomePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      users: null,
      isLoading: true,
      creatingApp: false,
      currentFolder: {},
      showAppDeletionConfirmation: false, 
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
    this.setState({ currentPage: page });
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

  deleteApp = (app) => {
    this.setState({ showAppDeletionConfirmation: true, appToBeDeleted: app })
  }

  executeAppDeletion = () => {
    this.setState({ isDeletingApp: true });
    appService.deleteApp(this.state.appToBeDeleted.id).then((data) => {
      toast.info('App deleted successfully.', {
        hideProgressBar: true,
        position: 'top-center'
      });
      this.setState({ 
        isDeletingApp: false, 
        appToBeDeleted: null,
        showAppDeletionConfirmation: false
      });
      this.fetchApps(this.state.currentPage || 0, this.state.currentFolder.id)
    }).catch(({ error }) => {
      toast.error('Could not delete the app.', { hideProgressBar: true, position: 'top-center' });
      this.setState({ 
        isDeletingApp: false, 
        appToBeDeleted: null,
        showAppDeletionConfirmation: false
      });
    });
    ;
  }

  render() {
    const {
      apps, isLoading, creatingApp, meta, currentFolder, showAppDeletionConfirmation, isDeletingApp
    } = this.state;

    return (
      <div className="wrapper home-page">
        <ConfirmDialog
          show={showAppDeletionConfirmation}
          message={'The app and the associated data will be permanently deleted, do you want to continue?'}
          confirmButtonLoading={isDeletingApp}
          onConfirm={() => this.executeAppDeletion()}
          onCancel={() => {}}
        />

        <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} />
        {!isLoading && meta.total_count === 0 && <BlankPage createApp={this.createApp} />}

        {(isLoading || meta.total_count > 0) && (
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
                        <h2 className="page-title">
                          {currentFolder.id ? `Folder: ${currentFolder.name}` : 'All applications'}
                        </h2>
                      </div>
                      <div className="col-auto ms-auto d-print-none">
                        <button
                          className={`btn btn-primary d-none d-lg-inline ${creatingApp ? 'btn-loading' : ''}`}
                          onClick={this.createApp}
                        >
                          Create new application
                        </button>
                      </div>
                    </div>

                    <div
                      className={
                        currentFolder.count == 0
                          ? 'table-responsive w-100 apps-table mt-3 d-flex align-items-center'
                          : 'table-responsive w-100 apps-table mt-3'
                      }
                      style={{ minHeight: '600px' }}
                    >
                      <table
                        data-testid="appsTable"
                        className={`table table-vcenter ${this.props.darkMode ? 'bg-dark' : 'bg-white'}`}
                      >
                        <tbody>
                          {isLoading && (
                            <>
                              {Array.from(Array(10)).map(() => (
                                <tr className="row">
                                  <td className="col-3 p-3">
                                    <div className="skeleton-line w-10"></div>
                                    <div className="skeleton-line w-10"></div>
                                  </td>
                                  <td className="col p-3"></td>
                                  <td className="text-muted col-auto col-1 pt-4">
                                    <div className="skeleton-line"></div>
                                  </td>
                                  <td className="text-muted col-auto col-1 pt-4">
                                    <div className="skeleton-line"></div>
                                  </td>
                                </tr>
                              ))}
                            </>
                          )}

                          {meta.total_count > 0 && (
                            <>
                              {apps.map((app) => (
                                <tr className="row">
                                  <td className="col p-3">
                                    <span className="app-title mb-3">{app.name}</span> <br />
                                    <small className="pt-2 app-description">
                                      created {Date(app.created_at)} ago by {app.user.first_name} {app.user.last_name}{' '}
                                    </small>
                                  </td>
                                  <td className="text-muted col-auto pt-4">
                                    <Link to={`/apps/${app.id}`} className="d-none d-lg-inline">
                                      <OverlayTrigger
                                        placement="top"
                                        overlay={(props) => renderTooltip({ props, text: 'Open in app builder' })}
                                      >
                                        <span className="badge bg-green-lt">Edit</span>
                                      </OverlayTrigger>
                                    </Link>
                                    <Link to={`/applications/${app.slug}`} target="_blank">
                                      <OverlayTrigger
                                        placement="top"
                                        overlay={(props) => renderTooltip({ props, text: 'Open in app viewer' })}
                                      >
                                        <span className="badge bg-blue-lt mx-2">launch</span>
                                      </OverlayTrigger>
                                    </Link>

                                    <AppMenu
                                      app={app}
                                      folders={this.state.folders}
                                      foldersChanged={this.foldersChanged}
                                      deleteApp={() => this.deleteApp(app)}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </>
                          )}
                          {currentFolder.count == 0 && (
                            <div>
                              <img
                                className="mx-auto d-block"
                                src="assets/images/icons/empty-folder-svgrepo-com.svg"
                                height="120px"
                              />
                              <span className="d-block text-center text-body">This folder is empty</span>
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
        )}
      </div>
    );
  }
}

export { HomePage };
