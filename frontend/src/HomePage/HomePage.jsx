import React from 'react';
import { appService, folderService, authenticationService } from '@/_services';
import { Pagination, Header, Organization, ConfirmDialog } from '@/_components';
import { Link } from 'react-router-dom';
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
import { withTranslation } from 'react-i18next';
const { iconList, defaultIcon } = configs;

class HomePageComponent extends React.Component {
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
          .then((data) => {
            toast.success('App imported successfully.', {
              position: 'top-center',
            });
            this.setState({
              isImportingApp: false,
            });
            this.props.history.push(`/apps/${data.id}`);
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
        <img src={`assets/images/icons/app-icons/${icon}.svg`} data-cy={`${icon}-icon`} />
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
      <div className="row">
        <div className="col-auto">
          <aside className="left-sidebar p-3 h-100" style={{ borderRight: '1px solid #eee' }}>
            <div className="application-brand">logo</div>
            <div>
              <ul className="sidebar-inner nav nav-vertical">
                <li className="text-center mt-3 cursor-pointer">
                  <Link to="/">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="32" height="32" rx="4" fill="#E6EDFE" />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M7 9C7 7.89543 7.89543 7 9 7H13C14.1046 7 15 7.89543 15 9V13C15 14.1046 14.1046 15 13 15H9C7.89543 15 7 14.1046 7 13V9ZM13 9H9V13H13V9ZM21 7C21.5523 7 22 7.44772 22 8V10H24C24.5523 10 25 10.4477 25 11C25 11.5523 24.5523 12 24 12H22V14C22 14.5523 21.5523 15 21 15C20.4477 15 20 14.5523 20 14V12H18C17.4477 12 17 11.5523 17 11C17 10.4477 17.4477 10 18 10H20V8C20 7.44772 20.4477 7 21 7ZM7 19C7 17.8954 7.89543 17 9 17H13C14.1046 17 15 17.8954 15 19V23C15 24.1046 14.1046 25 13 25H9C7.89543 25 7 24.1046 7 23V19ZM13 19H9V23H13V19ZM17 19C17 17.8954 17.8954 17 19 17H23C24.1046 17 25 17.8954 25 19V23C25 24.1046 24.1046 25 23 25H19C17.8954 25 17 24.1046 17 23V19ZM19 19V23H23V19H19Z"
                        fill="#3E63DD"
                      />
                    </svg>
                  </Link>
                </li>
                <li className="ext-center mt-3 cursor-pointer">
                  <Link to="/tooljet-database">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M7 10C7 9.44772 7.44772 9 8 9H13.5C14.0523 9 14.5 9.44772 14.5 10C14.5 10.5523 14.0523 11 13.5 11H8C7.44772 11 7 10.5523 7 10ZM17.5 10C17.5 9.44772 17.9477 9 18.5 9H24C24.5523 9 25 9.44772 25 10C25 10.5523 24.5523 11 24 11H18.5C17.9477 11 17.5 10.5523 17.5 10ZM7 14C7 13.4477 7.44772 13 8 13H13.5C14.0523 13 14.5 13.4477 14.5 14C14.5 14.5523 14.0523 15 13.5 15H8C7.44772 15 7 14.5523 7 14ZM17.5 14C17.5 13.4477 17.9477 13 18.5 13H24C24.5523 13 25 13.4477 25 14C25 14.5523 24.5523 15 24 15H18.5C17.9477 15 17.5 14.5523 17.5 14ZM7 18C7 17.4477 7.44772 17 8 17H13.5C14.0523 17 14.5 17.4477 14.5 18C14.5 18.5523 14.0523 19 13.5 19H8C7.44772 19 7 18.5523 7 18ZM17.5 18C17.5 17.4477 17.9477 17 18.5 17H24C24.5523 17 25 17.4477 25 18C25 18.5523 24.5523 19 24 19H18.5C17.9477 19 17.5 18.5523 17.5 18ZM7 22C7 21.4477 7.44772 21 8 21H13.5C14.0523 21 14.5 21.4477 14.5 22C14.5 22.5523 14.0523 23 13.5 23H8C7.44772 23 7 22.5523 7 22ZM17.5 22C17.5 21.4477 17.9477 21 18.5 21H24C24.5523 21 25 21.4477 25 22C25 22.5523 24.5523 23 24 23H18.5C17.9477 23 17.5 22.5523 17.5 22Z"
                        fill="#C1C8CD"
                      />
                    </svg>
                  </Link>
                </li>
                <li className="text-center mt-3 cursor-pointer">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M13 21V22C13 22.7956 13.3161 23.5587 13.8787 24.1213C14.4413 24.6839 15.2044 25 16 25C16.7956 25 17.5587 24.6839 18.1213 24.1213C18.6839 23.5587 19 22.7956 19 22V21M14 9C14 8.46957 14.2107 7.96086 14.5858 7.58579C14.9609 7.21071 15.4696 7 16 7C16.5304 7 17.0391 7.21071 17.4142 7.58579C17.7893 7.96086 18 8.46957 18 9C19.1484 9.54303 20.1274 10.3883 20.8321 11.4453C21.5367 12.5023 21.9404 13.7311 22 15V18C22.0753 18.6217 22.2954 19.2171 22.6428 19.7381C22.9902 20.2592 23.4551 20.6914 24 21H8C8.54494 20.6914 9.00981 20.2592 9.35719 19.7381C9.70457 19.2171 9.92474 18.6217 10 18V15C10.0596 13.7311 10.4633 12.5023 11.1679 11.4453C11.8726 10.3883 12.8516 9.54303 14 9Z"
                      stroke="#C1C8CD"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </li>
              </ul>
            </div>
          </aside>
        </div>
        <div className="col">
          <div className="wrapper home-page">
            <ConfirmDialog
              show={showAppDeletionConfirmation}
              message={this.props.t(
                'homePage.deleteAppAndData',
                'The app and the associated data will be permanently deleted, do you want to continue?'
              )}
              confirmButtonLoading={isDeletingApp}
              onConfirm={() => this.executeAppDeletion()}
              onCancel={() => this.cancelDeleteAppDialog()}
              darkMode={this.props.darkMode}
            />

            <ConfirmDialog
              show={showRemoveAppFromFolderConfirmation}
              message={this.props.t(
                'homePage.removeAppFromFolder',
                'The app will be removed from this folder, do you want to continue?'
              )}
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
              title={this.props.t('homePage.appCard.addToFolder', 'Add to folder')}
            >
              <div className="row">
                <div className="col modal-main">
                  <div className="mb-3" data-cy="move-selected-app-to-text">
                    <span>{this.props.t('homePage.appCard.move', 'Move')}</span>
                    <strong>{` "${appOperations?.selectedApp?.name}" `}</strong>
                    <span>{this.props.t('homePage.appCard.to', 'to')}</span>
                  </div>
                  <div data-cy="select-folder">
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
                      placeholder={this.props.t('homePage.appCard.selectFolder', 'Select folder')}
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col d-flex modal-footer-btn">
                  <button
                    className="btn btn-light"
                    onClick={() => this.setState({ showAddToFolderModal: false, appOperations: {} })}
                    data-cy="cancel-button"
                  >
                    {this.props.t('globals.cancel', 'Cancel')}
                  </button>
                  <button
                    className={`btn btn-primary ${appOperations?.isAdding ? 'btn-loading' : ''}`}
                    onClick={this.addAppToFolder}
                    data-cy="add-to-folder-button"
                  >
                    {this.props.t('homePage.appCard.addToFolder', 'Add to folder')}
                  </button>
                </div>
              </div>
            </Modal>

            <Modal
              show={showChangeIconModal && !!appOperations.selectedApp}
              closeModal={() => this.setState({ showChangeIconModal: false, appOperations: {} })}
              title={this.props.t('homePage.appCard.changeIcon', 'Change Icon')}
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
                    data-cy="cancel-button"
                  >
                    {this.props.t('globals.cancel', 'Cancel')}
                  </button>
                  <button
                    className={`btn btn-primary ${appOperations?.isAdding ? 'btn-loading' : ''}`}
                    onClick={this.changeIcon}
                    data-cy="change-button"
                  >
                    {this.props.t('homePage.change', 'Change')}
                  </button>
                </div>
              </div>
            </Modal>

            <header className="navbar tabbed-navbar navbar-expand-md navbar-light p-3 d-print-none">
              <div className="row w-100">
                <div className="col-3">
                  <Organization admin={this.state.currentUser.admin} darkMode={this.props.darkMode} />
                </div>
                <div className="col-9">
                  <div className="d-flex justify-content-sm-between">
                    <div className="mr-3">
                      <ol className="breadcrumb breadcrumb-arrows">
                        <li className="breadcrumb-item">
                          <a href="#">Home</a>
                        </li>
                        <li className="breadcrumb-item active">
                          <a href="#">All apps</a>
                        </li>
                      </ol>
                    </div>
                    <div>version</div>
                  </div>
                </div>
              </div>
            </header>
            {/* <Header switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode} /> */}
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
                          darkMode={this.props.darkMode}
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
        </div>
      </div>
    );
  }
}

export const HomePage = withTranslation()(HomePageComponent);
