import React from 'react';
import { appService, folderService, authenticationService } from '@/_services';
import { Pagination, Header, ConfirmDialog } from '@/_components';
import { Folders } from './Folders';
import { BlankPage } from './BlankPage';
import { toast } from 'react-hot-toast';
import AppList from './AppList';
import TemplateLibraryModal from './TemplateLibraryModal/';
import HomeHeader from './Header';
import Modal from './Modal';
import SelectSearch from 'react-select-search';
import Fuse from 'fuse.js';
import configs from './Configs/AppIcon.json';

const { iconList, defaultIcon } = configs;

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
      isDeletingAppFromFolder: false,
      currentFolder: {},
      currentPage: 1,
      appSearchKey: '',
      appToBeDeleted: false,
      showAppDeletionConfirmation: false,
      showRemoveAppFromFolderConfirmation: false,
      showAddToFolderModal: false,
      apps: [],
      folders: [],
      meta: {
        count: 1,
        folders: [],
      },
      appOperations: {},
      showTemplateLibraryModal: false,
    };
  }

  componentDidMount() {
    this.fetchApps(1, this.state.currentFolder.id);
    this.fetchFolders();
  }

  fetchApps = (page = 1, folder, searchKey) => {
    const appSearchKey = searchKey !== '' ? searchKey || this.state.appSearchKey : '';
    this.setState({
      apps: [],
      isLoading: true,
      currentPage: page,
      appSearchKey,
    });

    appService.getAll(page, folder, appSearchKey).then((data) =>
      this.setState({
        apps: data.apps,
        meta: { ...this.state.meta, ...data.meta },
        isLoading: false,
      })
    );
  };

  fetchFolders = (searchKey) => {
    const appSearchKey = searchKey !== '' ? searchKey || this.state.appSearchKey : '';
    this.setState({
      foldersLoading: true,
      appSearchKey: appSearchKey,
    });

    folderService.getAll(appSearchKey).then((data) => {
      const currentFolder = data?.folders?.filter(
        (folder) => this.state.currentFolder?.id && folder.id === this.state.currentFolder?.id
      )?.[0];
      this.setState({
        folders: data.folders,
        foldersLoading: false,
        currentFolder: currentFolder || {},
      });
    });
  };

  pageChanged = (page) => {
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
        _self.props.history.push(`/apps/${data.id}`);
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
        _self.setState({ creatingApp: false });
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
        toast.success('App cloned successfully.', {
          position: 'top-center',
        });
        this.setState({ isCloningApp: false });
        this.props.history.push(`/apps/${data.id}`);
      })
      .catch(({ _error }) => {
        toast.error('Could not clone the app.', {
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
        const json = JSON.stringify(data, null, 2);
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
            toast.success('App imported successfully.', {
              position: 'top-center',
            });
            this.setState({
              isImportingApp: false,
            });
            this.fetchApps(this.state.currentPage, this.state.currentFolder.id);
            this.fetchFolders();
          })
          .catch(({ error }) => {
            toast.error(`Could not import the app: ${error}`, {
              position: 'top-center',
            });
            this.setState({
              isImportingApp: false,
            });
          });
      } catch (error) {
        toast.error(`Could not import the app: ${error}`, {
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

  canUserPerform(user, action, app) {
    let permissionGrant;

    switch (action) {
      case 'create':
        permissionGrant = this.canAnyGroupPerformAction('app_create', user.group_permissions);
        break;
      case 'read':
      case 'update':
        permissionGrant =
          this.canAnyGroupPerformActionOnApp(action, user.app_group_permissions, app) ||
          this.isUserOwnerOfApp(user, app);
        break;
      case 'delete':
        permissionGrant =
          this.canAnyGroupPerformActionOnApp('delete', user.app_group_permissions, app) ||
          this.canAnyGroupPerformAction('app_delete', user.group_permissions) ||
          this.isUserOwnerOfApp(user, app);
        break;
      default:
        permissionGrant = false;
        break;
    }

    return permissionGrant;
  }

  canAnyGroupPerformActionOnApp(action, appGroupPermissions, app) {
    if (!appGroupPermissions) {
      return false;
    }

    const permissionsToCheck = appGroupPermissions.filter((permission) => permission.app_id == app.id);
    return this.canAnyGroupPerformAction(action, permissionsToCheck);
  }

  canAnyGroupPerformAction(action, permissions) {
    if (!permissions) {
      return false;
    }

    return permissions.some((p) => p[action]);
  }

  isUserOwnerOfApp(user, app) {
    return user.id == app.user_id;
  }

  canCreateApp = () => {
    return this.canUserPerform(this.state.currentUser, 'create');
  };

  canUpdateApp = (app) => {
    return this.canUserPerform(this.state.currentUser, 'update', app);
  };

  canDeleteApp = (app) => {
    return this.canUserPerform(this.state.currentUser, 'delete', app);
  };

  canCreateFolder = () => {
    return this.canAnyGroupPerformAction('folder_create', this.state.currentUser.group_permissions);
  };

  canDeleteFolder = () => {
    return this.canAnyGroupPerformAction('folder_delete', this.state.currentUser.group_permissions);
  };

  canUpdateFolder = () => {
    return this.canAnyGroupPerformAction('folder_update', this.state.currentUser.group_permissions);
  };

  cancelDeleteAppDialog = () => {
    this.setState({
      isDeletingApp: false,
      appToBeDeleted: null,
      showAppDeletionConfirmation: false,
    });
  };

  executeAppDeletion = () => {
    this.setState({ isDeletingApp: true });
    appService
      .deleteApp(this.state.appToBeDeleted.id)
      // eslint-disable-next-line no-unused-vars
      .then((data) => {
        toast.success('App deleted successfully.', {
          position: 'top-center',
        });
        this.fetchApps(
          this.state.currentPage
            ? this.state.apps?.length === 1
              ? this.state.currentPage - 1
              : this.state.currentPage
            : 1,
          this.state.currentFolder.id
        );
        this.fetchFolders();
      })
      .catch(({ error }) => {
        toast.error('Could not delete the app.', {
          position: 'top-center',
        });
        console.log(error);
      })
      .finally(() => {
        this.cancelDeleteAppDialog();
      });
  };

  pageCount = () => {
    return this.state.currentFolder.id ? this.state.meta.folder_count : this.state.meta.total_count;
  };

  onSearchSubmit = (key) => {
    if (this.state.appSearchKey === key) {
      return;
    }
    this.fetchApps(1, this.state.currentFolder.id, key || '');
    this.fetchFolders(key || '');
  };

  customFuzzySearch(options) {
    const fuse = new Fuse(options, {
      keys: ['name'],
      threshold: 0.1,
    });

    return (value) => {
      if (!value.length) {
        return options;
      }
      let searchKeystrokes = fuse.search(value);

      let _fusionSearchArray = searchKeystrokes.map((_item) => _item.item);

      return _fusionSearchArray;
    };
  }

  addAppToFolder = () => {
    const { appOperations } = this.state;
    if (!appOperations?.selectedFolder || !appOperations?.selectedApp) {
      return toast.error('Select a folder', { position: 'top-center' });
    }
    this.setState({ appOperations: { ...appOperations, isAdding: true } });

    folderService
      .addToFolder(appOperations.selectedApp.id, appOperations.selectedFolder)
      .then(() => {
        toast.success('Added to folder.', {
          position: 'top-center',
        });

        this.foldersChanged();
        this.setState({ appOperations: {}, showAddToFolderModal: false });
      })
      .catch(({ error }) => {
        this.setState({ appOperations: { ...appOperations, isAdding: false } });
        toast.error(error, { position: 'top-center' });
      });
  };

  removeAppFromFolder = () => {
    const { appOperations } = this.state;
    if (!appOperations?.selectedFolder || !appOperations?.selectedApp) {
      return toast.error('Select a folder', { position: 'top-center' });
    }
    this.setState({ isDeletingAppFromFolder: true });

    folderService
      .removeAppFromFolder(appOperations.selectedApp.id, appOperations.selectedFolder.id)
      .then(() => {
        toast.success('Removed from folder.', {
          position: 'top-center',
        });

        this.fetchApps(1, appOperations.selectedFolder.id);
        this.fetchFolders();
      })
      .catch(({ error }) => {
        toast.error(error, { position: 'top-center' });
      })
      .finally(() => {
        this.setState({
          appOperations: {},
          isDeletingAppFromFolder: false,
          showRemoveAppFromFolderConfirmation: false,
        });
      });
  };

  appActionModal = (app, folder, action) => {
    const { appOperations } = this.state;

    switch (action) {
      case 'add-to-folder':
        this.setState({ appOperations: { ...appOperations, selectedApp: app }, showAddToFolderModal: true });
        break;
      case 'change-icon':
        this.setState({
          appOperations: { ...appOperations, selectedApp: app, selectedIcon: app?.icon },
          showChangeIconModal: true,
        });
        break;
      case 'remove-app-from-folder':
        this.setState({
          appOperations: { ...appOperations, selectedApp: app, selectedFolder: folder },
          showRemoveAppFromFolderConfirmation: true,
        });
        break;
    }
  };

  getIcons = () => {
    const { appOperations } = this.state;
    const selectedIcon = appOperations.selectedIcon || appOperations.selectedApp?.icon || defaultIcon;
    return iconList.map((icon, index) => (
      <li
        className={`p-3 ms-1 me-2 mt-1 mb-2${selectedIcon === icon ? ' selected' : ''}`}
        onClick={() => this.setState({ appOperations: { ...appOperations, selectedIcon: icon } })}
        key={index}
      >
        <img src={`/assets/images/icons/app-icons/${icon}.svg`} />
      </li>
    ));
  };

  changeIcon = () => {
    const { appOperations, apps } = this.state;

    if (!appOperations?.selectedIcon || !appOperations?.selectedApp) {
      return toast.error('Select an icon', { position: 'top-center' });
    }
    if (appOperations.selectedIcon === appOperations.selectedApp.icon) {
      this.setState({ appOperations: {}, showChangeIconModal: false });
      return toast.success('Icon updated.', {
        position: 'top-center',
      });
    }
    this.setState({ appOperations: { ...appOperations, isAdding: true } });

    appService
      .changeIcon(appOperations.selectedIcon, appOperations.selectedApp.id)
      .then(() => {
        toast.success('Icon updated.', {
          position: 'top-center',
        });

        const updatedApps = apps.map((app) => {
          if (app.id === appOperations.selectedApp.id) {
            app.icon = appOperations.selectedIcon;
          }
          return app;
        });
        this.setState({ appOperations: {}, showChangeIconModal: false, apps: updatedApps });
      })
      .catch(({ error }) => {
        this.setState({ appOperations: { ...appOperations, isAdding: false } });
        toast.error(error, { position: 'top-center' });
      });
  };

  showTemplateLibraryModal = () => {
    this.setState({ showTemplateLibraryModal: true });
  };
  hideTemplateLibraryModal = () => {
    this.setState({ showTemplateLibraryModal: false });
  };

  render() {
    const {
      apps,
      isLoading,
      creatingApp,
      meta,
      currentFolder,
      showAppDeletionConfirmation,
      showRemoveAppFromFolderConfirmation,
      isDeletingApp,
      isImportingApp,
      isDeletingAppFromFolder,
      appSearchKey,
      showAddToFolderModal,
      showChangeIconModal,
      appOperations,
    } = this.state;
    const appCountText = currentFolder.count ? ` (${currentFolder.count})` : '';
    const folderName = currentFolder.id
      ? `${currentFolder.name}${appCountText}`
      : `All applications${meta.total_count ? ` (${meta.total_count})` : ''}`;
    return (
      <div className="wrapper home-page">
        <ConfirmDialog
          show={showAppDeletionConfirmation}
          message={'The app and the associated data will be permanently deleted, do you want to continue?'}
          confirmButtonLoading={isDeletingApp}
          onConfirm={() => this.executeAppDeletion()}
          onCancel={() => this.cancelDeleteAppDialog()}
          darkMode={this.props.darkMode}
        />

        <ConfirmDialog
          show={showRemoveAppFromFolderConfirmation}
          message={'The app will be removed from this folder, do you want to continue?'}
          confirmButtonLoading={isDeletingAppFromFolder}
          onConfirm={() => this.removeAppFromFolder()}
          onCancel={() =>
            this.setState({
              appOperations: {},
              isDeletingAppFromFolder: false,
              showRemoveAppFromFolderConfirmation: false,
            })
          }
        />

        <Modal
          show={showAddToFolderModal && !!appOperations.selectedApp}
          closeModal={() => this.setState({ showAddToFolderModal: false, appOperations: {} })}
          title="Add to folder"
        >
          <div className="row">
            <div className="col modal-main">
              <div className="mb-3">
                <span>Move</span>
                <strong>{` "${appOperations?.selectedApp?.name}" `}</strong>
                <span>to</span>
              </div>
              <div>
                <SelectSearch
                  className={`${this.props.darkMode ? 'select-search-dark' : 'select-search'}`}
                  options={this.state.folders.map((folder) => {
                    return { name: folder.name, value: folder.id };
                  })}
                  search={true}
                  disabled={!!appOperations?.isAdding}
                  onChange={(newVal) => {
                    this.setState({ appOperations: { ...appOperations, selectedFolder: newVal } });
                  }}
                  value={appOperations?.selectedFolder}
                  emptyMessage={this.state.folders === 0 ? 'No folders present' : 'Not found'}
                  filterOptions={this.customFuzzySearch}
                  placeholder="Select folder"
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col d-flex modal-footer-btn">
              <button
                className="btn btn-light"
                onClick={() => this.setState({ showAddToFolderModal: false, appOperations: {} })}
              >
                Cancel
              </button>
              <button
                className={`btn btn-primary ${appOperations?.isAdding ? 'btn-loading' : ''}`}
                onClick={this.addAppToFolder}
              >
                Add to folder
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          show={showChangeIconModal && !!appOperations.selectedApp}
          closeModal={() => this.setState({ showChangeIconModal: false, appOperations: {} })}
          title="Change Icon"
        >
          <div className="row">
            <div className="col modal-main icon-change-modal">
              <ul className="p-0">{this.getIcons()}</ul>
            </div>
          </div>
          <div className="row">
            <div className="col d-flex modal-footer-btn">
              <button
                className="btn btn-light"
                onClick={() => this.setState({ showChangeIconModal: false, appOperations: {} })}
              >
                Cancel
              </button>
              <button
                className={`btn btn-primary ${appOperations?.isAdding ? 'btn-loading' : ''}`}
                onClick={this.changeIcon}
              >
                Change
              </button>
            </div>
          </div>
        </Modal>

        <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} />
        {!isLoading && meta.total_count === 0 && !currentFolder.id && !appSearchKey && (
          <BlankPage
            createApp={this.createApp}
            isImportingApp={isImportingApp}
            fileInput={this.fileInput}
            handleImportApp={this.handleImportApp}
            creatingApp={creatingApp}
            darkMode={this.props.darkMode}
            showTemplateLibraryModal={this.state.showTemplateLibraryModal}
            viewTemplateLibraryModal={this.showTemplateLibraryModal}
            hideTemplateLibraryModal={this.hideTemplateLibraryModal}
          />
        )}

        {(isLoading || meta.total_count > 0 || currentFolder.id || appSearchKey) && (
          <div className="page-body homepage-body">
            <div className="container-xl">
              <div className="row">
                <div className="col-12 col-lg-3 mb-5">
                  <Folders
                    foldersLoading={this.state.foldersLoading}
                    folders={this.state.folders}
                    currentFolder={currentFolder}
                    folderChanged={this.folderChanged}
                    foldersChanged={this.foldersChanged}
                    canCreateFolder={this.canCreateFolder()}
                    canDeleteFolder={this.canDeleteFolder()}
                    canUpdateFolder={this.canUpdateFolder()}
                    darkMode={this.props.darkMode}
                  />
                </div>

                <div className="col-md-9">
                  <div className="w-100 mb-5">
                    <HomeHeader
                      folderName={folderName}
                      onSearchSubmit={this.onSearchSubmit}
                      handleImportApp={this.handleImportApp}
                      isImportingApp={isImportingApp}
                      canCreateApp={this.canCreateApp}
                      creatingApp={creatingApp}
                      createApp={this.createApp}
                      fileInput={this.fileInput}
                      appCount={currentFolder.count}
                      showTemplateLibraryModal={this.showTemplateLibraryModal}
                    />
                    <AppList
                      apps={apps}
                      canCreateApp={this.canCreateApp}
                      canDeleteApp={this.canDeleteApp}
                      canUpdateApp={this.canUpdateApp}
                      deleteApp={this.deleteApp}
                      cloneApp={this.cloneApp}
                      exportApp={this.exportApp}
                      meta={meta}
                      currentFolder={currentFolder}
                      isLoading={isLoading}
                      darkMode={this.props.darkMode}
                      appActionModal={this.appActionModal}
                      removeAppFromFolder={this.removeAppFromFolder}
                    />
                    <div className="homepage-pagination">
                      {this.pageCount() > 10 && (
                        <Pagination
                          currentPage={meta.current_page}
                          count={this.pageCount()}
                          pageChanged={this.pageChanged}
                          darkMode={this.props.darkMode}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <TemplateLibraryModal
              show={this.state.showTemplateLibraryModal}
              onHide={() => this.setState({ showTemplateLibraryModal: false })}
              onCloseButtonClick={() => this.setState({ showTemplateLibraryModal: false })}
              darkMode={this.props.darkMode}
            />
          </div>
        )}
      </div>
    );
  }
}

export { HomePage };
