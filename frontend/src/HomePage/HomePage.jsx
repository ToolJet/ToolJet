import React from 'react';
import { appService, folderService, authenticationService } from '@/_services';
import { Link } from 'react-router-dom';
import { Pagination, Header, ConfirmDialog } from '@/_components';
import { Folders } from './Folders';
import { AppMenu } from './AppMenu';
import { BlankPage } from './BlankPage';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { renderTooltip } from '@/_helpers/appUtils';
import { toast } from 'react-toastify';
import moment from 'moment';
class HomePage extends React.Component {
  constructor(props) {
    super(props);

    this.fileInput = React.createRef();
    this.state = {
      currentUser: authenticationService.currentUserValue,
      users: null,
      isLoading: true,
      creatingApp: false,
      isDeletingApp: false,
      isCloningApp: false,
      isExportingApp: false,
      isImportingApp: false,
      currentFolder: {},
      currentPage: 1,
      showAppDeletionConfirmation: false,
      apps: [],
      folders: [],
      meta: {
        count: 1,
        folders: [],
      },
    };
  }

  componentDidMount() {
    this.fetchApps(1, this.state.currentFolder.id);
    this.fetchFolders();
  }

  fetchApps = (page, folder) => {
    this.setState({
      apps: [],
      isLoading: true,
    });

    appService.getAll(page, folder).then((data) =>
      this.setState({
        apps: data.apps,
        meta: { ...this.state.meta, ...data.meta },
        isLoading: false,
      })
    );
  };

  fetchFolders = () => {
    this.setState({
      foldersLoading: true,
    });

    folderService.getAll().then((data) =>
      this.setState({
        folders: data.folders,
        foldersLoading: false,
      })
    );
  };

  pageChanged = (page) => {
    this.setState({ currentPage: page });
    this.fetchApps(page, this.state.currentFolder.id);
  };

  folderChanged = (folder) => {
    this.setState({ currentFolder: folder });
    this.fetchApps(1, folder.id);
  };

  foldersChanged = () => {
    this.fetchFolders();
  };

  createApp = () => {
    let _self = this;
    _self.setState({ creatingApp: true });
    appService
      .createApp()
      .then((data) => {
        console.log(data);
        _self.props.history.push(`/apps/${data.id}`);
      })
      .catch(({ error }) => {
        toast.error(error, { hideProgressBar: true, position: 'top-center' });
      });
  };

  deleteApp = (app) => {
    this.setState({ showAppDeletionConfirmation: true, appToBeDeleted: app });
  };

  cloneApp = (app) => {
    this.setState({ isCloningApp: true });
    appService
      .cloneApp(app.id)
      .then((data) => {
        toast.info('App cloned successfully.', {
          hideProgressBar: true,
          position: 'top-center',
        });
        this.setState({ isCloningApp: false });
        this.props.history.push(`/apps/${data.id}`);
      })
      .catch(({ _error }) => {
        toast.error('Could not clone the app.', {
          hideProgressBar: true,
          position: 'top-center',
        });
        this.setState({ isCloningApp: false });
        console.log(_error);
      });
  };

  exportApp = (app) => {
    this.setState({ isExportingApp: true });
    appService
      .exportApp(app.id)
      .then((data) => {
        const appName = app.name.replace(/\s+/g, '-').toLowerCase();
        const fileName = `${appName}-export-${new Date().getTime()}`;
        // simulate link click download
        const json = JSON.stringify(data);
        const blob = new Blob([json], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.setState({ isExportingApp: false });
      })
      .catch((error) => {
        toast.error('Could not export the app.', {
          hideProgressBar: true,
          position: 'top-center',
        });

        this.setState({ isExportingApp: false });
        console.log(error);
      });
  };

  handleImportApp = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], 'UTF-8');
    fileReader.onload = (event) => {
      const fileContent = event.target.result;
      this.setState({ isImportingApp: true });
      try {
        const requestBody = JSON.parse(fileContent);
        appService
          .importApp(requestBody)
          .then(() => {
            toast.info('App imported successfully.', {
              hideProgressBar: true,
              position: 'top-center',
            });
            this.setState({
              isImportingApp: false,
            });
            this.fetchApps(this.state.currentPage, this.state.currentFolder.id);
          })
          .catch(({ error }) => {
            toast.error(`Could not import the app: ${error}`, {
              hideProgressBar: true,
              position: 'top-center',
            });
            this.setState({
              isImportingApp: false,
            });
          });
      } catch (error) {
        toast.error(`Could not import the app: ${error}`, {
          hideProgressBar: true,
          position: 'top-center',
        });
        this.setState({
          isImportingApp: false,
        });
      }
      // set file input as null to handle same file upload
      event.target.value = null;
    };
  };

  isAppEditable = (app) => {
    return app.app_group_permissions.some((p) => p.update);
  };

  isAppDeletable = (app) => {
    return app.app_group_permissions.some((p) => p.delete);
  };

  executeAppDeletion = () => {
    this.setState({ isDeletingApp: true });
    appService
      .deleteApp(this.state.appToBeDeleted.id)
      // eslint-disable-next-line no-unused-vars
      .then((data) => {
        toast.info('App deleted successfully.', {
          hideProgressBar: true,
          position: 'top-center',
        });
        this.setState({
          isDeletingApp: false,
          appToBeDeleted: null,
          showAppDeletionConfirmation: false,
        });
        this.fetchApps(this.state.currentPage || 1, this.state.currentFolder.id);
        this.fetchFolders();
      })
      .catch(({ error }) => {
        toast.error('Could not delete the app.', {
          hideProgressBar: true,
          position: 'top-center',
        });
        this.setState({
          isDeletingApp: false,
          appToBeDeleted: null,
          showAppDeletionConfirmation: false,
        });
        console.log(error);
      });
  };

  pageCount = () => {
    return this.state.currentFolder.id ? this.state.meta.folder_count : this.state.meta.total_count;
  };

  render() {
    const {
      apps,
      isLoading,
      creatingApp,
      meta,
      currentFolder,
      showAppDeletionConfirmation,
      isDeletingApp,
      isImportingApp,
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
        {!isLoading && meta.total_count === 0 && !currentFolder.id && <BlankPage createApp={this.createApp} />}

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
                        <div className="w-100 ">
                          <button
                            className={`btn btn-default d-none d-lg-inline mb-3 ${isImportingApp ? 'btn-loading' : ''}`}
                            onChange={this.handleImportApp}
                          >
                            <label>
                              Import
                              <input type="file" ref={this.fileInput} style={{ display: 'none' }} />
                            </label>
                          </button>
                        </div>
                      </div>

                      <div className="col-auto ms-auto d-print-none">
                        <div className="w-100 ">
                          <button
                            className={`btn btn-primary d-none d-lg-inline mb-3 ${creatingApp ? 'btn-loading' : ''}`}
                            onClick={this.createApp}
                          >
                            Create new application
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      className={
                        currentFolder.count === 0
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
                              {Array.from(Array(10)).map((index) => (
                                <tr className="row" key={index}>
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
                              {apps.map((app, index) => (
                                <tr className="row" key={index}>
                                  <td className="col p-3">
                                    <span className="app-title mb-3">{app.name}</span> <br />
                                    <small className="pt-2 app-description">
                                      created {moment(app.created_at).fromNow(true)} ago by {app.user?.first_name}{' '}
                                      {app.user?.last_name}{' '}
                                    </small>
                                  </td>
                                  <td className="text-muted col-auto pt-4">
                                    {!isLoading && this.isAppEditable(app) && (
                                      <Link to={`/apps/${app.id}`} className="d-none d-lg-inline">
                                        <OverlayTrigger
                                          placement="top"
                                          overlay={(props) =>
                                            renderTooltip({
                                              props,
                                              text: 'Open in app builder',
                                            })
                                          }
                                        >
                                          <span className="badge bg-green-lt">Edit</span>
                                        </OverlayTrigger>
                                      </Link>
                                    )}
                                    <Link
                                      to={app?.current_version_id ? `/applications/${app.slug}` : ''}
                                      target={app?.current_version_id ? '_blank' : ''}
                                    >
                                      {!this.props.darkMode && (
                                        <OverlayTrigger
                                          placement="top"
                                          overlay={(props) =>
                                            renderTooltip({
                                              props,
                                              text:
                                                app?.current_version_id === null
                                                  ? 'App does not have a deployed version'
                                                  : 'Open in app viewer',
                                            })
                                          }
                                        >
                                          {
                                            <span
                                              className={`${
                                                app?.current_version_id
                                                  ? 'badge bg-blue-lt mx-2 '
                                                  : 'badge bg-light-grey mx-2'
                                              }`}
                                            >
                                              launch{' '}
                                            </span>
                                          }
                                        </OverlayTrigger>
                                      )}
                                      {this.props.darkMode && (
                                        <OverlayTrigger
                                          placement="top"
                                          overlay={(props) =>
                                            renderTooltip({
                                              props,
                                              text:
                                                app?.current_version_id === null
                                                  ? 'App does not have a deployed version'
                                                  : 'Open in app viewer',
                                            })
                                          }
                                        >
                                          {
                                            <span
                                              className={`${
                                                app?.current_version_id === null
                                                  ? 'badge mx-2 '
                                                  : 'badge bg-azure-lt mx-2'
                                              }`}
                                              style={{
                                                filter:
                                                  app?.current_version_id === null
                                                    ? 'brightness(0.3)'
                                                    : 'brightness(1) invert(1)',
                                              }}
                                            >
                                              launch{' '}
                                            </span>
                                          }
                                        </OverlayTrigger>
                                      )}
                                    </Link>

                                    {this.isAppDeletable(app) && (
                                      <AppMenu
                                        app={app}
                                        folders={this.state.folders}
                                        foldersChanged={this.foldersChanged}
                                        deleteApp={() => this.deleteApp(app)}
                                        cloneApp={() => this.cloneApp(app)}
                                        exportApp={() => this.exportApp(app)}
                                      />
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </>
                          )}
                          {currentFolder.count === 0 && (
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
                    {this.pageCount() > 10 && (
                      <Pagination
                        currentPage={meta.current_page}
                        count={this.pageCount()}
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
