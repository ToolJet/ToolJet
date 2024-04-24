import React from 'react';
import cx from 'classnames';
import { appsService, folderService, authenticationService, libraryAppService } from '@/_services';
import { ConfirmDialog, AppModal } from '@/_components';
import Select from '@/_ui/Select';
import { Folders } from './Folders';
import { BlankPage } from './BlankPage';
import { toast } from 'react-hot-toast';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import Layout from '@/_ui/Layout';
import AppList from './AppList';
import TemplateLibraryModal from './TemplateLibraryModal/';
import HomeHeader from './Header';
import Modal from './Modal';
import configs from './Configs/AppIcon.json';
import { withTranslation } from 'react-i18next';
import { sample, isEmpty } from 'lodash';
import ExportAppModal from './ExportAppModal';
import Footer from './Footer';
import { OrganizationList } from '@/_components/OrganizationManager/List';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import BulkIcon from '@/_ui/Icon/bulkIcons/index';
import { getWorkspaceId, pageTitles, setWindowTitle } from '@/_helpers/utils';
import { withRouter } from '@/_hoc/withRouter';
import FolderFilter from './FolderFilter';
import { APP_ERROR_TYPE } from '@/_helpers/error_constants';
import Skeleton from 'react-loading-skeleton';

const { iconList, defaultIcon } = configs;

const MAX_APPS_PER_PAGE = 9;
class HomePageComponent extends React.Component {
  constructor(props) {
    super(props);

    const currentSession = authenticationService.currentSessionValue;

    this.fileInput = React.createRef();
    this.state = {
      currentUser: {
        id: currentSession?.current_user.id,
        organization_id: currentSession?.current_organization_id,
      },
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
      app: {},
      showCreateAppModal: false,
      showCreateAppFromTemplateModal: false,
      showImportAppModal: false,
      showCloneAppModal: false,
      showRenameAppModal: false,
      fileContent: '',
      fileName: '',
      selectedTemplate: null,
      deploying: false,
    };
  }

  componentDidMount() {
    setWindowTitle({ page: pageTitles.DASHBOARD });
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

    appsService.getAll(page, folder, appSearchKey).then((data) =>
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
      const folder_slug = new URL(window.location.href)?.searchParams?.get('folder');
      const folder = data?.folders?.find((folder) => folder.name === folder_slug);
      const currentFolderId = folder ? folder.id : this.state.currentFolder?.id;
      const currentFolder = data?.folders?.find((folder) => currentFolderId && folder.id === currentFolderId);
      this.setState({
        folders: data.folders,
        foldersLoading: false,
        currentFolder: currentFolder || {},
      });
      currentFolder && this.fetchApps(1, currentFolder.id);
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

  createApp = async (appName) => {
    let _self = this;
    _self.setState({ creatingApp: true });
    try {
      const data = await appsService.createApp({ icon: sample(iconList), name: appName });
      const workspaceId = getWorkspaceId();
      _self.props.navigate(`/${workspaceId}/apps/${data.id}`);
      toast.success('App created successfully!');
      _self.setState({ creatingApp: false });
      return true;
    } catch (errorResponse) {
      _self.setState({ creatingApp: false });
      if (errorResponse.statusCode === 409) {
        return false;
      } else {
        throw errorResponse;
      }
    }
  };

  renameApp = async (newAppName, appId) => {
    let _self = this;
    _self.setState({ renamingApp: true });
    try {
      await appsService.saveApp(appId, { name: newAppName });
      await this.fetchApps(this.state.currentPage, this.state.currentFolder.id);
      toast.success('App name has been updated!');
      _self.setState({ renamingApp: false });
      return true;
    } catch (errorResponse) {
      _self.setState({ renamingApp: false });
      if (errorResponse.statusCode === 409) {
        return false;
      } else {
        throw errorResponse;
      }
    }
  };

  deleteApp = (app) => {
    this.setState({ showAppDeletionConfirmation: true, appToBeDeleted: app });
  };

  cloneApp = async (appName, appId) => {
    this.setState({ isCloningApp: true });
    try {
      const data = await appsService.cloneResource({
        app: [{ id: appId, name: appName }],
        organization_id: this.state.currentUser?.organization_id,
      });
      toast.success('App cloned successfully!');
      this.props.navigate(`/${getWorkspaceId()}/apps/${data?.imports?.app[0]?.id}`);
      this.setState({ isCloningApp: false });
      return true;
    } catch (_error) {
      this.setState({ isCloningApp: false });
      if (_error.statusCode === 409) {
        return false;
      } else {
        throw _error;
      }
    }
  };

  exportApp = async (app) => {
    this.setState({ isExportingApp: true, app: app });
  };

  readAndImport = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const fileReader = new FileReader();
      const fileName = file.name.replace('.json', '').substring(0, 50);
      fileReader.readAsText(file, 'UTF-8');
      fileReader.onload = (event) => {
        const result = event.target.result;
        let fileContent;
        try {
          fileContent = JSON.parse(result);
        } catch (parseError) {
          toast.error(`Could not import: ${parseError}`);
          return;
        }
        this.setState({ fileContent, fileName, showImportAppModal: true });
      };
      fileReader.onerror = (error) => {
        toast.error(`Could not import the app: ${error}`);
        return;
      };
      event.target.value = null;
    } catch (error) {
      toast.error(error.message);
    }
  };

  importFile = async (importJSON, appName) => {
    this.setState({ isImportingApp: true });
    // For backward compatibility with legacy app import
    const organization_id = this.state.currentUser?.organization_id;
    const isLegacyImport = isEmpty(importJSON.tooljet_version);
    if (isLegacyImport) {
      importJSON = { app: [{ definition: importJSON, appName: appName }], tooljet_version: importJSON.tooljetVersion };
    } else {
      importJSON.app[0].appName = appName;
    }
    const requestBody = { organization_id, ...importJSON };
    try {
      const data = await appsService.importResource(requestBody);
      toast.success('App imported successfully.');
      this.setState({
        isImportingApp: false,
      });
      if (!isEmpty(data.imports.app)) {
        this.props.navigate(`/${getWorkspaceId()}/apps/${data.imports.app[0].id}`);
      } else if (!isEmpty(data.imports.tooljet_database)) {
        this.props.navigate(`/${getWorkspaceId()}/database`);
      }
    } catch (error) {
      this.setState({
        isImportingApp: false,
      });
      if (error.statusCode === 409) {
        return false;
      }
      toast.error(error?.error || 'App import failed');
    }
  };

  deployApp = async (event, appName, selectedApp) => {
    event.preventDefault();
    const id = selectedApp.id;
    this.setState({ deploying: true });
    try {
      const data = await libraryAppService.deploy(id, appName);
      this.setState({ deploying: false });
      toast.success('App created successfully!', { position: 'top-center' });
      this.props.navigate(`/${getWorkspaceId()}/apps/${data.app[0].id}`);
    } catch (e) {
      this.setState({ deploying: false });
      if (e.statusCode === 409) {
        return false;
      } else {
        return e;
      }
    }
  };

  canUserPerform(user, action, app) {
    const currentSession = authenticationService.currentSessionValue;
    let permissionGrant;

    switch (action) {
      case 'create':
        permissionGrant = this.canAnyGroupPerformAction('app_create', currentSession.group_permissions);
        break;
      case 'read':
      case 'update':
        permissionGrant =
          this.canAnyGroupPerformActionOnApp(action, currentSession.app_group_permissions, app) ||
          this.isUserOwnerOfApp(user, app);
        break;
      case 'delete':
        permissionGrant =
          this.canAnyGroupPerformActionOnApp('delete', currentSession.app_group_permissions, app) ||
          this.canAnyGroupPerformAction('app_delete', currentSession.group_permissions) ||
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
    return this.canAnyGroupPerformAction('folder_create', authenticationService.currentSessionValue?.group_permissions);
  };

  canDeleteFolder = () => {
    return this.canAnyGroupPerformAction('folder_delete', authenticationService.currentSessionValue?.group_permissions);
  };

  canUpdateFolder = () => {
    return this.canAnyGroupPerformAction('folder_update', authenticationService.currentSessionValue?.group_permissions);
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
    appsService
      .deleteApp(this.state.appToBeDeleted.id)
      // eslint-disable-next-line no-unused-vars
      .then((data) => {
        toast.success('App deleted successfully.');
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
        toast.error('Could not delete the app.');
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
  };

  addAppToFolder = () => {
    const { appOperations } = this.state;
    if (!appOperations?.selectedFolder || !appOperations?.selectedApp) {
      return toast.error('Select a folder');
    }
    this.setState({ appOperations: { ...appOperations, isAdding: true } });

    folderService
      .addToFolder(appOperations.selectedApp.id, appOperations.selectedFolder)
      .then(() => {
        toast.success('Added to folder.');
        this.foldersChanged();
        this.setState({ appOperations: {}, showAddToFolderModal: false });
      })
      .catch(({ error }) => {
        this.setState({ appOperations: { ...appOperations, isAdding: false } });
        toast.error(error);
      });
  };

  removeAppFromFolder = () => {
    const { appOperations } = this.state;
    if (!appOperations?.selectedFolder || !appOperations?.selectedApp) {
      return toast.error('Select a folder');
    }
    this.setState({ isDeletingAppFromFolder: true });

    folderService
      .removeAppFromFolder(appOperations.selectedApp.id, appOperations.selectedFolder.id)
      .then(() => {
        toast.success('Removed from folder.');

        this.fetchApps(1, appOperations.selectedFolder.id);
        this.fetchFolders();
      })
      .catch(({ error }) => {
        toast.error(error);
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
      case 'clone-app':
        this.setState({
          appOperations: { ...appOperations, selectedApp: app, selectedIcon: app?.icon },
          showCloneAppModal: true,
        });
        break;
      case 'rename-app':
        this.setState({
          appOperations: { ...appOperations, selectedApp: app },
          showRenameAppModal: true,
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
        <BulkIcon name={icon} data-cy={`${icon}-icon`} />
      </li>
    ));
  };

  changeIcon = () => {
    const { appOperations, apps } = this.state;

    if (!appOperations?.selectedIcon || !appOperations?.selectedApp) {
      return toast.error('Select an icon');
    }
    if (appOperations.selectedIcon === appOperations.selectedApp.icon) {
      this.setState({ appOperations: {}, showChangeIconModal: false });
      return toast.success('Icon updated.');
    }
    this.setState({ appOperations: { ...appOperations, isAdding: true } });

    appsService
      .changeIcon(appOperations.selectedIcon, appOperations.selectedApp.id)
      .then(() => {
        toast.success('Icon updated.');

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
        toast.error(error);
      });
  };

  showTemplateLibraryModal = () => {
    this.setState({ showTemplateLibraryModal: true });
  };
  hideTemplateLibraryModal = () => {
    this.setState({ showTemplateLibraryModal: false });
  };

  openCreateAppFromTemplateModal = (template) => {
    this.setState({ showCreateAppFromTemplateModal: true, selectedTemplate: template });
  };

  closeCreateAppFromTemplateModal = () => {
    this.setState({ showCreateAppFromTemplateModal: false, selectedTemplate: null });
  };

  openCreateAppModal = () => {
    this.setState({ showCreateAppModal: true });
  };

  closeCreateAppModal = () => {
    this.setState({ showCreateAppModal: false });
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
      showCloneAppModal,
      appOperations,
      isExportingApp,
      appToBeDeleted,
      app,
      showCreateAppModal,
      showImportAppModal,
      fileContent,
      fileName,
      showRenameAppModal,
      showCreateAppFromTemplateModal,
    } = this.state;
    return (
      <Layout switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode}>
        <div className="wrapper home-page">
          {showCreateAppModal && (
            <AppModal
              closeModal={this.closeCreateAppModal}
              processApp={this.createApp}
              show={this.openCreateAppModal}
              title={'Create app'}
              actionButton={'+ Create app'}
              actionLoadingButton={'Creating'}
            />
          )}
          {showCloneAppModal && (
            <AppModal
              closeModal={() => this.setState({ showCloneAppModal: false })}
              processApp={this.cloneApp}
              show={() => this.setState({ showCloneAppModal: true })}
              selectedAppId={appOperations?.selectedApp?.id}
              selectedAppName={appOperations?.selectedApp?.name}
              title={'Clone app'}
              actionButton={'Clone app'}
              actionLoadingButton={'Cloning'}
            />
          )}
          {showImportAppModal && (
            <AppModal
              closeModal={() => this.setState({ showImportAppModal: false })}
              processApp={this.importFile}
              fileContent={fileContent}
              show={() => this.setState({ showImportAppModal: true })}
              selectedAppName={fileName}
              title={'Import app'}
              actionButton={'Import app'}
              actionLoadingButton={'Importing'}
            />
          )}
          {showCreateAppFromTemplateModal && (
            <AppModal
              show={this.openCreateAppFromTemplateModal}
              templateDetails={this.state.selectedTemplate}
              processApp={this.deployApp}
              closeModal={this.closeCreateAppFromTemplateModal}
              title={'Create new app from template'}
              actionButton={'+ Create app'}
              actionLoadingButton={'Creating'}
            />
          )}
          {showRenameAppModal && (
            <AppModal
              show={() => this.setState({ showRenameAppModal: true })}
              closeModal={() => this.setState({ showRenameAppModal: false })}
              processApp={this.renameApp}
              selectedAppId={appOperations.selectedApp.id}
              selectedAppName={appOperations.selectedApp.name}
              title={'Rename app'}
              actionButton={'Rename app'}
              actionLoadingButton={'Renaming'}
            />
          )}
          <ConfirmDialog
            show={showAppDeletionConfirmation}
            message={this.props.t(
              'homePage.deleteAppAndData',
              'The app {{appName}} and the associated data will be permanently deleted, do you want to continue?',
              {
                appName: appToBeDeleted?.name,
              }
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
            darkMode={this.props.darkMode}
          />

          <Modal
            show={showAddToFolderModal && !!appOperations.selectedApp}
            closeModal={() => this.setState({ showAddToFolderModal: false, appOperations: {} })}
            title={this.props.t('homePage.appCard.addToFolder', 'Add to folder')}
          >
            <div className="row">
              <div className="col modal-main">
                <div className="mb-3 move-selected-app-to-text " data-cy="move-selected-app-to-text">
                  <p>
                    {this.props.t('homePage.appCard.move', 'Move')}
                    <span>{` "${appOperations?.selectedApp?.name}" `}</span>
                  </p>

                  <span>{this.props.t('homePage.appCard.to', 'to')}</span>
                </div>
                <div data-cy="select-folder" className="select-folder-container">
                  <Select
                    options={this.state.folders.map((folder) => {
                      return { name: folder.name, value: folder.id };
                    })}
                    disabled={!!appOperations?.isAdding}
                    onChange={(newVal) => {
                      this.setState({ appOperations: { ...appOperations, selectedFolder: newVal } });
                    }}
                    width={'100%'}
                    value={appOperations?.selectedFolder}
                    placeholder={this.props.t('homePage.appCard.selectFolder', 'Select folder')}
                    closeMenuOnSelect={true}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col d-flex modal-footer-btn">
                <ButtonSolid
                  variant="tertiary"
                  onClick={() => this.setState({ showAddToFolderModal: false, appOperations: {} })}
                  data-cy="cancel-button"
                >
                  {this.props.t('globals.cancel', 'Cancel')}
                </ButtonSolid>
                <ButtonSolid
                  onClick={this.addAppToFolder}
                  data-cy="add-to-folder-button"
                  isLoading={appOperations?.isAdding}
                >
                  {this.props.t('homePage.appCard.addToFolder', 'Add to folder')}
                </ButtonSolid>
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
                <ButtonSolid
                  onClick={() => this.setState({ showChangeIconModal: false, appOperations: {} })}
                  data-cy="cancel-button"
                  variant="tertiary"
                >
                  {this.props.t('globals.cancel', 'Cancel')}
                </ButtonSolid>
                <ButtonSolid
                  className={`btn btn-primary ${appOperations?.isAdding ? 'btn-loading' : ''}`}
                  onClick={this.changeIcon}
                  data-cy="change-button"
                >
                  {this.props.t('homePage.change', 'Change')}
                </ButtonSolid>
              </div>
            </div>
          </Modal>
          {isExportingApp && app.hasOwnProperty('id') && (
            <ExportAppModal
              show={isExportingApp}
              closeModal={() => {
                this.setState({ isExportingApp: false, app: {} });
              }}
              customClassName="modal-version-lists"
              title={'Select a version to export'}
              app={app}
              darkMode={this.props.darkMode}
            />
          )}
          <div className="row gx-0">
            <div className="home-page-sidebar col p-0">
              {this.canCreateApp() && (
                <div className="create-new-app-wrapper">
                  <Dropdown as={ButtonGroup} className="d-inline-flex create-new-app-dropdown">
                    <Button
                      className={`create-new-app-button col-11 ${creatingApp ? 'btn-loading' : ''}`}
                      onClick={() => this.setState({ showCreateAppModal: true })}
                      data-cy="create-new-app-button"
                    >
                      {isImportingApp && <span className="spinner-border spinner-border-sm mx-2" role="status"></span>}
                      {this.props.t('homePage.header.createNewApplication', 'Create an app')}
                    </Button>
                    <Dropdown.Toggle split className="d-inline" data-cy="import-dropdown-menu" />
                    <Dropdown.Menu className="import-lg-position new-app-dropdown">
                      <Dropdown.Item
                        className="homepage-dropdown-style tj-text tj-text-xsm"
                        onClick={this.showTemplateLibraryModal}
                        data-cy="choose-from-template-button"
                      >
                        {this.props.t('homePage.header.chooseFromTemplate', 'Choose from template')}
                      </Dropdown.Item>
                      <label
                        className="homepage-dropdown-style tj-text tj-text-xsm"
                        data-cy="import-option-label"
                        onChange={this.readAndImport}
                      >
                        {this.props.t('homePage.header.import', 'Import from device')}
                        <input
                          type="file"
                          accept=".json"
                          ref={this.fileInput}
                          style={{ display: 'none' }}
                          data-cy="import-option-input"
                        />
                      </label>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              )}
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
                canCreateApp={this.canCreateApp()}
              />
              <OrganizationList />
            </div>

            <div
              className={cx('col home-page-content', {
                'bg-light-gray': !this.props.darkMode,
              })}
              data-cy="home-page-content"
            >
              <div className="w-100 mb-5 container home-page-content-container">
                {isLoading && (
                  <Skeleton
                    count={1}
                    height={20}
                    width={880}
                    baseColor="#ECEEF0"
                    className="mb-3"
                    style={{ marginTop: '2rem' }}
                  />
                )}
                {(meta?.total_count > 0 || appSearchKey) && (
                  <>
                    <HomeHeader onSearchSubmit={this.onSearchSubmit} darkMode={this.props.darkMode} />
                    <div className="liner"></div>
                    <div className="filter-container">
                      <span>{currentFolder?.count ?? meta?.total_count} APPS</span>
                      <div className="d-flex align-items-center">
                        <div className="mx-2">Filter by</div>
                        <FolderFilter
                          disabled={!!appOperations?.isAdding}
                          options={this.state.folders.map((folder) => {
                            return {
                              name: folder.name,
                              label: folder.name,
                              value: folder.id,
                              id: folder.id,
                              ...folder,
                            };
                          })}
                          onChange={this.folderChanged}
                          value={currentFolder}
                          closeMenuOnSelect={true}
                        />
                      </div>
                    </div>
                  </>
                )}
                {!isLoading && meta?.total_count === 0 && !currentFolder.id && !appSearchKey && (
                  <BlankPage
                    readAndImport={this.readAndImport}
                    isImportingApp={isImportingApp}
                    fileInput={this.fileInput}
                    openCreateAppModal={this.openCreateAppModal}
                    openCreateAppFromTemplateModal={this.openCreateAppFromTemplateModal}
                    creatingApp={creatingApp}
                    darkMode={this.props.darkMode}
                    showTemplateLibraryModal={this.state.showTemplateLibraryModal}
                    viewTemplateLibraryModal={this.showTemplateLibraryModal}
                    hideTemplateLibraryModal={this.hideTemplateLibraryModal}
                    canCreateApp={this.canCreateApp}
                  />
                )}
                {!isLoading && meta.total_count === 0 && appSearchKey && (
                  <div>
                    <span className={`d-block text-center text-body pt-5 ${this.props.darkMode && 'text-white-50'}`}>
                      {this.props.t('homePage.noApplicationFound', 'No Applications found')}
                    </span>
                  </div>
                )}
                {meta.total_count > 0 && (
                  <AppList
                    apps={apps}
                    canCreateApp={this.canCreateApp}
                    canDeleteApp={this.canDeleteApp}
                    canUpdateApp={this.canUpdateApp}
                    deleteApp={this.deleteApp}
                    exportApp={this.exportApp}
                    meta={meta}
                    currentFolder={currentFolder}
                    isLoading={isLoading}
                    darkMode={this.props.darkMode}
                    appActionModal={this.appActionModal}
                    removeAppFromFolder={this.removeAppFromFolder}
                  />
                )}
              </div>
              <div className="footer-container">
                {this.pageCount() > MAX_APPS_PER_PAGE && (
                  <Footer
                    currentPage={meta.current_page}
                    count={this.pageCount()}
                    itemsPerPage={MAX_APPS_PER_PAGE}
                    pageChanged={this.pageChanged}
                    darkMode={this.props.darkMode}
                    dataLoading={isLoading}
                  />
                )}
                <div className="org-selector-mobile">
                  <OrganizationList />
                </div>
              </div>
            </div>
          </div>
          <TemplateLibraryModal
            show={this.state.showTemplateLibraryModal}
            onHide={() => this.setState({ showTemplateLibraryModal: false })}
            onCloseButtonClick={() => this.setState({ showTemplateLibraryModal: false })}
            darkMode={this.props.darkMode}
            openCreateAppFromTemplateModal={this.openCreateAppFromTemplateModal}
            appCreationDisabled={!this.canCreateApp()}
          />
        </div>
      </Layout>
    );
  }
}

export const HomePage = withTranslation()(withRouter(HomePageComponent));
