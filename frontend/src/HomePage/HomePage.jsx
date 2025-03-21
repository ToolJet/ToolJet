import React from 'react';
import cx from 'classnames';
import moment from 'moment';
import {
  appsService,
  folderService,
  authenticationService,
  libraryAppService,
  gitSyncService,
  licenseService,
  pluginsService,
} from '@/_services';
import { ConfirmDialog, AppModal } from '@/_components';
import Select from '@/_ui/Select';
import _, { sample, isEmpty } from 'lodash';
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
import ExportAppModal from './ExportAppModal';
import Footer from './Footer';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import BulkIcon from '@/_ui/Icon/bulkIcons/index';
import { getWorkspaceId } from '@/_helpers/utils';
import { getQueryParams } from '@/_helpers/routes';
import { withRouter } from '@/_hoc/withRouter';
import LicenseBanner from '@/modules/common/components/LicenseBanner';
import { LicenseTooltip } from '@/LicenseTooltip';
import ModalBase from '@/_ui/Modal';
import FolderFilter from './FolderFilter';
import { useLicenseStore } from '@/_stores/licenseStore';
import { shallow } from 'zustand/shallow';
import { fetchAndSetWindowTitle, pageTitles } from '@white-label/whiteLabelling';
import HeaderSkeleton from '@/_ui/FolderSkeleton/HeaderSkeleton';
import {
  ImportAppMenu,
  AppActionModal,
  OrganizationList,
  UserGroupMigrationBanner,
  ConsultationBanner,
} from '@/modules/dashboard/components';
import CreateAppWithPrompt from '@/modules/AiBuilder/components/CreateAppWithPrompt';

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
      appsLimit: {},
      featureAccess: null,
      newAppName: '',
      commitEnabled: false,
      fetchingOrgGit: false,
      orgGit: null,
      showGitRepositoryImportModal: false,
      fetchingAppsFromRepos: false,
      appsFromRepos: {},
      selectedAppRepo: null,
      importingApp: false,
      importingGitAppOperations: {},
      featuresLoaded: false,
      showCreateAppModal: false,
      showCreateModuleModal: false,
      showCreateAppFromTemplateModal: false,
      showImportAppModal: false,
      showCloneAppModal: false,
      showRenameAppModal: false,
      fileContent: '',
      fileName: '',
      selectedTemplate: null,
      deploying: false,
      workflowWorkspaceLevelLimit: {},
      workflowInstanceLevelLimit: {},
      showUserGroupMigrationModal: false,
      showGroupMigrationBanner: true,
      shouldAutoImportPlugin: false,
      dependentPlugins: [],
      dependentPluginsDetail: {},
    };
  }

  setQueryParameter = () => {
    const showImportTemplateModal = getQueryParams('fromtemplate');
    this.setState({
      showTemplateLibraryModal: showImportTemplateModal ? showImportTemplateModal : false,
    });
  };

  componentDidMount() {
    fetchAndSetWindowTitle({ page: pageTitles.DASHBOARD });
    this.fetchApps(1, this.state.currentFolder.id);
    this.fetchFolders();
    this.fetchFeatureAccesss();
    this.fetchAppsLimit();
    this.fetchWorkflowsInstanceLimit();
    this.fetchWorkflowsWorkspaceLimit();
    this.fetchOrgGit();
    this.setQueryParameter();
    const hasClosedBanner = localStorage.getItem('hasClosedGroupMigrationBanner');

    //Only show the banner once
    if (hasClosedBanner) {
      this.setState({ showGroupMigrationBanner: false });
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.appType != this.props.appType) {
      this.fetchFolders();
      this.fetchApps(1);
    }
    if (Object.keys(this.props.featureAccess).length && !this.state.featureAccess) {
      this.setState({ featureAccess: this.props.featureAccess, featuresLoaded: this.props.featuresLoaded });
    }
  }

  fetchFeatureAccesss = () => {
    licenseService.getFeatureAccess().then((data) => {
      this.setState({
        featureAccess: data,
        featuresLoaded: true,
      });
    });
  };

  fetchAppsLimit() {
    appsService.getAppsLimit().then((data) => {
      this.setState({ appsLimit: data?.appsCount });
    });
  }

  fetchWorkflowsInstanceLimit() {
    appsService.getWorkflowLimit('instance').then((data) => {
      this.setState({ workflowInstanceLevelLimit: data?.appsCount });
    });
  }

  fetchWorkflowsWorkspaceLimit() {
    appsService.getWorkflowLimit('workspace').then((data) => {
      this.setState({ workflowWorkspaceLevelLimit: data?.appsCount });
    });
  }

  fetchApps = (page = 1, folder, searchKey) => {
    const appSearchKey = searchKey !== '' ? searchKey || this.state.appSearchKey : '';
    this.setState({
      apps: [],
      isLoading: true,
      currentPage: page,
      appSearchKey,
    });
    appsService.getAll(page, folder, appSearchKey, this.props.appType).then((data) => {
      this.setState({
        apps: data.apps,
        meta: { ...this.state.meta, ...data.meta },
        searchedAppCount: appSearchKey ? data.apps.length : this.state.currentFolder.count,
        isLoading: false,
      });
    });
  };

  fetchFolders = (searchKey) => {
    const appSearchKey = searchKey !== '' ? searchKey || this.state.appSearchKey : '';
    this.setState({
      foldersLoading: true,
      appSearchKey: appSearchKey,
    });

    folderService.getAll(appSearchKey, this.props.appType).then((data) => {
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

  createApp = async (appName, type) => {
    let _self = this;
    _self.setState({ creatingApp: true });
    try {
      const data = await appsService.createApp({ icon: sample(iconList), name: appName, type: this.props.appType });
      const workspaceId = getWorkspaceId();
      _self.props.navigate(`/${workspaceId}/apps/${data.id}`, { state: { commitEnabled: this.state.commitEnabled } });
      toast.success(`${this.props.appType === 'workflow' ? 'Workflow' : 'App'} created successfully!`);
      _self.setState({ creatingApp: false });
      return true;
    } catch (errorResponse) {
      _self.setState({ creatingApp: false });
      if (errorResponse.statusCode === 409) {
        return false;
      } else if (errorResponse.statusCode !== 451) {
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
      toast.success(`${this.props.appType === 'workflow' ? 'Workflow' : 'App'} name has been updated!`);
      _self.setState({ renamingApp: false });
      return true;
    } catch (errorResponse) {
      _self.setState({ renamingApp: false });
      if (errorResponse.statusCode === 409) {
        return false;
      } else if (errorResponse.statusCode !== 451) {
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
      this.props.navigate(`/${getWorkspaceId()}/apps/${data?.imports?.app[0]?.id}`, {
        state: { commitEnabled: this.state.commitEnabled },
      });
      this.setState({ isCloningApp: false });
      return true;
    } catch (_error) {
      this.setState({ isCloningApp: false });
      if (_error.statusCode === 409) {
        return false;
      } else if (_error.statusCode !== 451) {
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
      fileReader.onload = async (event) => {
        const result = event.target.result;
        let fileContent;
        try {
          fileContent = JSON.parse(result);
        } catch (parseError) {
          toast.error(`Could not import: ${parseError}`);
          return;
        }

        const importedAppDef = fileContent.app || fileContent.appV2;
        const dataSourcesUsedInApps = [];
        importedAppDef.forEach((appDefinition) => {
          appDefinition?.definition?.appV2?.dataSources.forEach((dataSource) => {
            dataSourcesUsedInApps.push(dataSource);
          });
        });

        const dependentPluginsResponse = await pluginsService.findDepedentPlugins(dataSourcesUsedInApps);
        const { pluginsToBeInstalled = [], pluginsListIdToDetailsMap = {} } = dependentPluginsResponse.data;
        this.setState({
          fileContent,
          fileName,
          showImportAppModal: true,
          dependentPlugins: pluginsToBeInstalled,
          dependentPluginsDetail: { ...pluginsListIdToDetailsMap },
        });
      };

      fileReader.onerror = (error) => {
        toast.error(`Could not import the app: ${error}`);
        return;
      };
      event.target.value = null;
    } catch (error) {
      let errorMessage = 'Some Error Occured';
      if (error?.error) {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
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
      if (this.state.dependentPlugins.length) {
        await pluginsService.installDependetnPlugins(this.state.dependentPlugins, true);
      }
      const data = await appsService.importResource(requestBody);
      toast.success('App imported successfully.');
      this.setState({
        isImportingApp: false,
      });
      if (!isEmpty(data.imports.app)) {
        this.props.navigate(`/${getWorkspaceId()}/apps/${data.imports.app[0].id}`, {
          state: { commitEnabled: this.state.commitEnabled },
        });
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
      toast.error(error?.error || error?.message || 'App import failed');
    }
  };

  deployApp = async (event, appName, selectedApp) => {
    event.preventDefault();
    const id = selectedApp.id;
    this.setState({ deploying: true });
    try {
      const data = await libraryAppService.deploy(
        id,
        appName,
        this.state.dependentPlugins,
        this.state.shouldAutoImportPlugin
      );
      this.setState({ deploying: false });
      toast.success('App created successfully!', { position: 'top-center' });
      this.props.navigate(`/${getWorkspaceId()}/apps/${data.app[0].id}`, {
        state: { commitEnabled: this.state.commitEnabled },
      });
    } catch (e) {
      this.setState({ deploying: false });
      toast.error(e.error);
      if (e.statusCode === 409) {
        return false;
      } else {
        return e;
      }
    }
  };

  canUserPerform(user, action, app) {
    if (authenticationService.currentSessionValue?.super_admin) return true;
    const currentSession = authenticationService.currentSessionValue;
    const appPermission = currentSession.app_group_permissions;
    const canUpdateApp =
      appPermission && (appPermission.is_all_editable || appPermission.editable_apps_id.includes(app?.id));
    const canReadApp =
      (appPermission && canUpdateApp) ||
      appPermission.is_all_viewable ||
      appPermission.viewable_apps_id.includes(app?.id);
    let permissionGrant;

    switch (action) {
      case 'create':
        permissionGrant = currentSession.user_permissions.app_create;
        break;
      case 'read':
        permissionGrant = this.isUserOwnerOfApp(user, app) || canReadApp;
        break;
      case 'update':
        permissionGrant = canUpdateApp || this.isUserOwnerOfApp(user, app);
        break;
      case 'delete':
        permissionGrant = currentSession.user_permissions.app_delete || this.isUserOwnerOfApp(user, app);
        break;
      default:
        permissionGrant = false;
        break;
    }

    return permissionGrant;
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
    return authenticationService.currentSessionValue?.user_permissions?.folder_c_r_u_d;
  };

  canDeleteFolder = () => {
    return authenticationService.currentSessionValue?.user_permissions?.folder_c_r_u_d;
  };

  canUpdateFolder = () => {
    return authenticationService.currentSessionValue?.user_permissions?.folder_c_r_u_d;
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
        toast.success(`${this.props.appType === 'workflow' ? 'Workflow' : 'App'} deleted successfully.`);
        this.fetchApps(
          this.state.currentPage
            ? this.state.apps?.length === 1
              ? this.state.currentPage - 1
              : this.state.currentPage
            : 1,
          this.state.currentFolder.id
        );
        this.fetchFolders();
        this.fetchAppsLimit();
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

  fetchOrgGit = () => {
    const workspaceId = authenticationService.currentSessionValue.current_organization_id;
    this.setState({ fetchingOrgGit: true });
    gitSyncService
      .getGitStatus(workspaceId)
      .then((data) => {
        this.setState({ orgGit: data });
      })
      .finally(() => {
        this.setState({ fetchingOrgGit: false });
      });
  };

  fetchRepoApps = () => {
    this.setState({ fetchingAppsFromRepos: true, selectedAppRepo: null, importingGitAppOperations: {} });
    gitSyncService
      .gitPull()
      .then((data) => {
        this.setState({ appsFromRepos: data?.meta_data });
      })
      .catch((error) => {
        toast.error(error?.error);
      })
      .finally(() => {
        this.setState({ fetchingAppsFromRepos: false });
      });
  };

  importGitApp = () => {
    const { appsFromRepos, selectedAppRepo, orgGit } = this.state;
    const appToImport = appsFromRepos[selectedAppRepo];
    const { git_app_name, git_version_id, git_version_name, last_commit_message, last_commit_user, lastpush_date } =
      appToImport;

    this.setState({ importingApp: true });
    const body = {
      gitAppId: selectedAppRepo,
      gitAppName: git_app_name,
      gitVersionName: git_version_name,
      gitVersionId: git_version_id,
      lastCommitMessage: last_commit_message,
      lastCommitUser: last_commit_user,
      lastPushDate: new Date(lastpush_date),
      organizationGitId: orgGit?.id,
    };
    gitSyncService
      .importGitApp(body)
      .then((data) => {
        const workspaceId = getWorkspaceId();
        this.props.navigate(`/${workspaceId}/apps/${data.app.id}`);
      })
      .catch((error) => {
        this.setState({ importingGitAppOperations: { message: error?.error } });
      })
      .finally(() => {
        this.setState({ importingApp: false });
      });
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

  generateOptionsForRepository = () => {
    const { appsFromRepos } = this.state;
    return Object.keys(appsFromRepos).map((gitAppId) => ({
      name: appsFromRepos[gitAppId].git_app_name,
      value: gitAppId,
    }));
  };

  handleNewAppNameChange = (e) => {
    this.setState({ newAppName: e.target.value });
  };
  removeQueryParameters = () => {
    const urlWithoutParams = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, urlWithoutParams);
  };

  showTemplateLibraryModal = () => {
    this.setState({ showTemplateLibraryModal: true });
  };
  hideTemplateLibraryModal = () => {
    this.removeQueryParameters();
    this.setState({ showTemplateLibraryModal: false });
  };
  handleCommitEnableChange = (e) => {
    this.setState({ commitEnabled: e.target.checked });
  };
  toggleGitRepositoryImportModal = (e) => {
    if (!this.state.showGitRepositoryImportModal) this.fetchRepoApps();
    this.setState({ showGitRepositoryImportModal: !this.state.showGitRepositoryImportModal });
  };

  openCreateAppFromTemplateModal = async (template) => {
    try {
      const { plugins_to_be_installed = [], plugins_detail_by_id = {} } =
        (await libraryAppService.findDependentPluginsInTemplate?.(template.id)) || {};

      this.setState({
        showCreateAppFromTemplateModal: true,
        selectedTemplate: template,
        ...(plugins_to_be_installed.length && {
          shouldAutoImportPlugin: true,
          dependentPlugins: plugins_to_be_installed,
          dependentPluginsDetail: { ...plugins_detail_by_id },
        }),
      });
    } catch (error) {
      console.error('Error checking template plugins:', error);
      // Continue with template creation without plugins
      this.setState({
        showCreateAppFromTemplateModal: true,
        selectedTemplate: template,
      });
    }
  };

  closeCreateAppFromTemplateModal = () => {
    this.setState({
      showCreateAppFromTemplateModal: false,
      selectedTemplate: null,
      dependentPlugins: [],
      dependentPluginsDetail: {},
      shouldAutoImportPlugin: false,
    });
  };

  openCreateAppModal = () => {
    this.setState({ showCreateAppModal: true, showCreateModuleModal: true });
  };

  closeCreateAppModal = () => {
    this.setState({ showCreateAppModal: false, showCreateModuleModal: false });
  };

  openImportAppModal = async () => {
    this.setState({ showImportAppModal: true });
  };

  closeImportAppModal = () => {
    this.setState({
      showImportAppModal: false,
      dependentPlugins: [],
      dependentPluginsDetail: {},
      shouldAutoImportPlugin: false,
    });
  };

  isWithinSevenDaysOfSignUp = (date) => {
    const currentDate = new Date().toISOString();
    const differenceInTime = new Date(currentDate).getTime() - new Date(date).getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return differenceInDays <= 7;
  };

  setShowUserGroupMigrationModal = () => {
    this.setState({ showUserGroupMigrationModal: false });
  };

  setShowGroupMigrationBanner = () => {
    this.setState({ showGroupMigrationBanner: false });
    localStorage.setItem('hasClosedGroupMigrationBanner', 'true');
  };
  // We are using this method to get notified from the child component that commit enabled status has been changed
  // To be removed once all git related functionalities are moved to specific components
  handleCommitChange = (commitEnabled) => {
    this.setState({ commitEnabled: commitEnabled });
  };
  shouldShowMigrationBanner = () => {
    const { currentSessionValue } = authenticationService;
    const { appType } = this.props;
    return (
      currentSessionValue?.admin &&
      this.state.showGroupMigrationBanner &&
      new Date(currentSessionValue?.current_user?.created_at) < new Date('2025-02-01') &&
      appType !== 'workflow'
    );
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
      appsLimit,
      featureAccess,
      commitEnabled,
      fetchingOrgGit,
      orgGit,
      showGitRepositoryImportModal,
      fetchingAppsFromRepos,
      selectedAppRepo,
      appsFromRepos,
      importingApp,
      importingGitAppOperations,
      featuresLoaded,
      showCreateAppModal,
      showCreateModuleModal,
      showImportAppModal,
      fileContent,
      fileName,
      showRenameAppModal,
      showCreateAppFromTemplateModal,
      workflowWorkspaceLevelLimit,
      workflowInstanceLevelLimit,
      showUserGroupMigrationModal,
      showGroupMigrationBanner,
      dependentPlugins,
      dependentPluginsDetail,
    } = this.state;
    const modalConfigs = {
      create: {
        modalType: 'create',
        closeModal: this.closeCreateAppModal,
        processApp: (name) => this.createApp(name, showCreateAppModal ? 'front-end' : 'module'),
        show: this.openCreateAppModal,
        title: this.props.appType === 'workflow' ? 'Create workflow' : 'Create app',
        actionButton: this.props.appType === 'workflow' ? '+ Create workflow' : '+ Create app',
        actionLoadingButton: 'Creating',
        appType: this.props.appType,
      },
      clone: {
        modalType: 'clone',
        closeModal: () => this.setState({ showCloneAppModal: false }),
        processApp: this.cloneApp,
        show: () => this.setState({ showCloneAppModal: true }),
        title: 'Clone app',
        actionButton: 'Clone app',
        actionLoadingButton: 'Cloning',
        selectedAppId: appOperations?.selectedApp?.id,
        selectedAppName: appOperations?.selectedApp?.name,
      },
      import: {
        modalType: 'import',
        closeModal: () => this.setState({ showImportAppModal: false }),
        processApp: this.importFile,
        show: this.openImportAppModal,
        title: 'Import app',
        actionButton: 'Import app',
        actionLoadingButton: 'Importing',
        fileContent: fileContent,
        selectedAppName: fileName,
        dependentPluginsDetail: dependentPluginsDetail,
        dependentPlugins: dependentPlugins,
      },
      template: {
        modalType: 'template',
        closeModal: this.closeCreateAppFromTemplateModal,
        processApp: this.deployApp,
        show: this.openCreateAppFromTemplateModal,
        title: 'Create new app from template',
        actionButton: '+ Create app',
        actionLoadingButton: 'Creating',
        templateDetails: this.state.selectedTemplate,
        dependentPluginsDetail: dependentPluginsDetail,
        dependentPlugins: dependentPlugins,
      },
    };
    return (
      <Layout switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode}>
        <div className="wrapper home-page">
          <AppActionModal
            modalStates={{
              showCreateAppModal,
              showCreateModuleModal,
              showCloneAppModal,
              showImportAppModal,
              showCreateAppFromTemplateModal,
            }}
            configs={modalConfigs}
            onCommitChange={this.handleCommitChange}
          />
          {showRenameAppModal && (
            <AppModal
              show={() => this.setState({ showRenameAppModal: true })}
              closeModal={() => this.setState({ showRenameAppModal: false })}
              processApp={this.renameApp}
              selectedAppId={appOperations.selectedApp.id}
              selectedAppName={appOperations.selectedApp.name}
              title={`Rename ${this.props.appType === 'workflow' ? 'workflow' : 'app'}`}
              actionButton={`Rename ${this.props.appType === 'workflow' ? 'workflow' : 'app'}`}
              actionLoadingButton={'Renaming'}
              appType={this.props.appType}
            />
          )}
          <ConfirmDialog
            show={showAppDeletionConfirmation}
            message={this.props.t(
              this.props.appType === 'workflow' ? 'homePage.deleteWorkflowAndData' : 'homePage.deleteAppAndData',
              {
                appName: appToBeDeleted?.name,
              }
            )}
            confirmButtonLoading={isDeletingApp}
            onConfirm={() => this.executeAppDeletion()}
            onCancel={() => this.cancelDeleteAppDialog()}
            darkMode={this.props.darkMode}
            cancelButtonText="Cancel"
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
          <ModalBase
            title={selectedAppRepo ? 'Import app' : 'Import app from git repository'}
            show={showGitRepositoryImportModal}
            handleClose={this.toggleGitRepositoryImportModal}
            handleConfirm={this.importGitApp}
            confirmBtnProps={{
              title: 'Import app',
              isLoading: importingApp,
              disabled: importingApp || !selectedAppRepo || importingGitAppOperations?.message,
            }}
            darkMode={this.props.darkMode}
          >
            {fetchingAppsFromRepos ? (
              <div className="loader-container">
                <div className="primary-spin-loader"></div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="mb-1 tj-text-sm tj-text font-weight-500" data-cy="create-app-from-label">
                    Create app from
                  </label>
                  <div className="tj-app-input" data-cy="app-select">
                    <Select
                      options={this.generateOptionsForRepository()}
                      disabled={importingApp}
                      onChange={(newVal) => {
                        this.setState({ selectedAppRepo: newVal }, () => {
                          if (appsFromRepos[newVal]?.app_name_exist === 'EXIST') {
                            this.setState({ importingGitAppOperations: { message: 'App name already exists' } });
                          } else {
                            this.setState({ importingGitAppOperations: {} });
                          }
                        });
                      }}
                      width={'100%'}
                      value={selectedAppRepo}
                      placeholder={'Select app from git repository...'}
                      closeMenuOnSelect={true}
                      customWrap={true}
                    />
                  </div>
                </div>
                {selectedAppRepo && (
                  <div className="commit-info">
                    <div className="form-group mb-3">
                      <label className="mb-1 info-label mt-3 tj-text-xsm font-weight-500" data-cy="app-name-label">
                        App name
                      </label>
                      <div className="tj-app-input">
                        <input
                          type="text"
                          disabled={true}
                          value={appsFromRepos[selectedAppRepo].git_app_name}
                          className={cx('form-control font-weight-400 disabled', {
                            'tj-input-error-state': importingGitAppOperations?.message,
                          })}
                          data-cy="app-name-field"
                        />
                      </div>
                      <div>
                        <div
                          className={cx(
                            { 'tj-input-error': importingGitAppOperations?.message },
                            'tj-text-xxsm info-text'
                          )}
                          data-cy="app-name-helper-text"
                        >
                          {importingGitAppOperations?.message
                            ? importingGitAppOperations?.message
                            : 'App name is inherited from git repository and cannot be edited'}
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="mb-1 tj-text-xsm font-weight-500" data-cy="last-commit-label">
                        Last commit
                      </label>
                      <div className="last-commit-info form-control">
                        <div className="message-info">
                          <div data-cy="las-commit-message">
                            {appsFromRepos[selectedAppRepo]?.last_commit_message ?? 'No commits yet'}
                          </div>
                          <div data-cy="last-commit-version">{appsFromRepos[selectedAppRepo]?.git_version_name}</div>
                        </div>
                        <div className="author-info" data-cy="auther-info">
                          {`Done by ${appsFromRepos[selectedAppRepo]?.last_commit_user} at ${moment(
                            new Date(appsFromRepos[selectedAppRepo]?.lastpush_date)
                          ).format('DD MMM YYYY, h:mm a')}`}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </ModalBase>
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
              <div className="col d-flex modal-footer-btn justify-content-end">
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
              <div className="col d-flex modal-footer-btn justify-content-end">
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
                <div className="create-new-app-license-wrapper">
                  <LicenseTooltip
                    limits={appsLimit}
                    feature={this.props.appType === 'workflow' ? 'workflows' : 'apps'}
                    isAvailable={true}
                    noTooltipIfValid={true}
                  >
                    <div className="create-new-app-wrapper">
                      <Dropdown as={ButtonGroup} className="d-inline-flex create-new-app-dropdown">
                        <Button
                          //disabled={appsLimit?.percentage >= 100}
                          disabled={
                            this.props.appType === 'front-end'
                              ? appsLimit?.percentage >= 100
                              : workflowInstanceLevelLimit.percentage >= 100 ||
                                workflowWorkspaceLevelLimit.percentage >= 100
                          }
                          className={`create-new-app-button col-11 ${creatingApp ? 'btn-loading' : ''}`}
                          onClick={() => this.setState({ showCreateAppModal: true })}
                          data-cy="create-new-app-button"
                        >
                          {isImportingApp && (
                            <span className="spinner-border spinner-border-sm mx-2" role="status"></span>
                          )}
                          {this.props.t(
                            `${
                              this.props.appType === 'workflow' ? 'workflowsDashboard' : 'homePage'
                            }.header.createNewApplication`,
                            'Create new app'
                          )}
                        </Button>

                        {this.props.appType !== 'workflow' && (
                          <Dropdown.Toggle
                            disabled={appsLimit?.percentage >= 100}
                            split
                            className="d-inline"
                            data-cy="import-dropdown-menu"
                          />
                        )}
                        <ImportAppMenu
                          darkMode={this.props.darkMode}
                          showTemplateLibraryModal={this.showTemplateLibraryModal}
                          featureAccess={featureAccess}
                          orgGit={orgGit}
                          toggleGitRepositoryImportModal={this.toggleGitRepositoryImportModal}
                          readAndImport={this.readAndImport}
                        />
                      </Dropdown>
                    </div>
                  </LicenseTooltip>
                  {this.props.appType === 'front-end' && (
                    <LicenseBanner classes="mb-3 small" limits={appsLimit} type="apps" size="small" />
                  )}
                  {this.props.appType === 'workflow' &&
                    (workflowInstanceLevelLimit.current >= workflowInstanceLevelLimit.total ||
                      100 > workflowInstanceLevelLimit.percentage >= 90 ||
                      workflowInstanceLevelLimit.current === workflowInstanceLevelLimit.total - 1 ||
                      workflowWorkspaceLevelLimit.current >= workflowWorkspaceLevelLimit.total ||
                      100 > workflowWorkspaceLevelLimit.percentage >= 90 ||
                      workflowWorkspaceLevelLimit.current === workflowWorkspaceLevelLimit.total - 1) && (
                      <>
                        <LicenseBanner
                          classes="mb-3 small"
                          limits={
                            workflowInstanceLevelLimit.current >= workflowInstanceLevelLimit.total ||
                            100 > workflowInstanceLevelLimit.percentage >= 90 ||
                            workflowInstanceLevelLimit.current === workflowInstanceLevelLimit.total - 1
                              ? workflowInstanceLevelLimit
                              : workflowWorkspaceLevelLimit
                          }
                          type="workflow"
                          size="small"
                        />
                      </>
                    )}
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
                appType={this.props.appType}
              />
              {authenticationService.currentSessionValue?.super_admin &&
                this.isWithinSevenDaysOfSignUp(authenticationService.currentSessionValue?.consultation_banner_date) && (
                  <ConsultationBanner
                    classes={`${this.props.darkMode ? 'theme-dark dark-theme m-3 trial-banner' : 'm-3 trial-banner'}`}
                  />
                )}
              {this.shouldShowMigrationBanner() && (
                <UserGroupMigrationBanner
                  classes={`${this.props.darkMode ? 'theme-dark dark-theme m-3 trial-banner' : 'm-3 trial-banner'}`}
                  closeBanner={this.setShowGroupMigrationBanner}
                />
              )}

              <OrganizationList />
            </div>

            <div
              className={cx('col home-page-content', {
                'bg-light-gray': !this.props.darkMode,
              })}
              data-cy="home-page-content"
            >
              <div className="w-100 mb-5 container home-page-content-container">
                {featuresLoaded && !isLoading ? (
                  <LicenseBanner
                    classes="mt-3"
                    limits={featureAccess}
                    type={featureAccess?.licenseStatus?.licenseType}
                  />
                ) : (
                  !appSearchKey && <HeaderSkeleton />
                )}

                {this.props.appType !== 'workflow' && this.canCreateApp() && (
                  <CreateAppWithPrompt createApp={this.createApp} />
                )}

                {(meta?.total_count > 0 || appSearchKey) && (
                  <>
                    {!(isLoading && !appSearchKey) && (
                      <>
                        <HomeHeader
                          onSearchSubmit={this.onSearchSubmit}
                          darkMode={this.props.darkMode}
                          appType={this.props.appType}
                        />
                        <div className="liner"></div>
                      </>
                    )}
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
                {!isLoading && featuresLoaded && meta?.total_count === 0 && !currentFolder.id && !appSearchKey && (
                  <BlankPage
                    canCreateApp={this.canCreateApp}
                    isLoading={true}
                    createApp={this.createApp}
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
                    appType={this.props.appType}
                  />
                )}
                {!isLoading && apps?.length === 0 && appSearchKey && (
                  <div>
                    <span className={`d-block text-center text-body pt-5 ${this.props.darkMode && 'text-white-50'}`}>
                      {this.props.t('homePage.noApplicationFound', 'No Applications found')}
                    </span>
                  </div>
                )}
                {(isLoading || meta.total_count > 0 || !_.isEmpty(currentFolder)) && (
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
                    isLoading={isLoading || !featuresLoaded}
                    darkMode={this.props.darkMode}
                    appActionModal={this.appActionModal}
                    removeAppFromFolder={this.removeAppFromFolder}
                    appType={this.props.appType}
                    basicPlan={featureAccess?.licenseStatus?.isExpired || !featureAccess?.licenseStatus?.isLicenseValid}
                    appSearchKey={this.state.appSearchKey}
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
                {/* need to review the mobile view */}
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

const withStore = (Component) => (props) => {
  const { featureAccess, featuresLoaded } = useLicenseStore(
    (state) => ({
      featureAccess: state.featureAccess,
      featuresLoaded: state.featuresLoaded,
    }),
    shallow
  );

  return <Component {...props} featureAccess={featureAccess} featuresLoaded={featuresLoaded} />;
};

export const HomePage = withTranslation()(withStore(withRouter(HomePageComponent)));
