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
  aiOnboardingService,
} from '@/_services';
import { ConfirmDialog, AppModal, ToolTip } from '@/_components';
import Select from '@/_ui/Select';
import _, { sample, isEmpty, capitalize, has } from 'lodash';
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
  ConsultationBanner,
  AppTypeTab,
} from '@/modules/dashboard/components';
import CreateAppWithPrompt from '@/modules/AiBuilder/components/CreateAppWithPrompt';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { isWorkflowsFeatureEnabled } from '@/modules/common/helpers/utils';
import EmptyModuleSvg from '../../assets/images/icons/empty-modules.svg';
import { v4 as uuidv4 } from 'uuid';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
const { iconList, defaultIcon } = configs;
import { PermissionDeniedModal } from './PermissionDeniedModal/PermissionDeniedModal';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';

const MAX_APPS_PER_PAGE = 9;
class HomePageComponent extends React.Component {
  constructor(props) {
    super(props);

    const currentSession = authenticationService?.currentSessionValue;
    this.fileInput = React.createRef();
    this.state = {
      currentUser: {
        id: currentSession?.current_user?.id,
        organization_id: currentSession?.current_organization_id,
      },
      tj_api_source: currentSession?.tj_api_source,
      shouldRedirect: false,
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
      importedAppName: {},
      isAppImportEditable: false,
      showMissingGroupsModal: false,
      missingGroups: [],
      missingGroupsExpanded: false,
      showAIOnboardingLoadingScreen: false,
      showInsufficentPermissionModal: false,
    };
  }

  setQueryParameter = () => {
    const showImportTemplateModal = getQueryParams('fromtemplate');
    this.setState({
      showTemplateLibraryModal: showImportTemplateModal ? showImportTemplateModal : false,
    });
  };

  checkIfUserHasBuilderAccess = () => {
    const role = authenticationService.currentSessionValue?.role.name;
    const hasBuilderAccess = role === 'admin' || role === 'builder';
    return hasBuilderAccess;
  };

  /* For cloud ai onboarding */
  handleAiOnboarding = () => {
    const aiCookies = authenticationService.currentSessionValue?.ai_cookies;
    const latestPrompt = aiCookies?.tj_ai_prompt;
    const templateId = aiCookies?.tj_template_id;

    /* First check the user permission */
    if (latestPrompt || templateId) {
      if (!this.checkIfUserHasBuilderAccess()) {
        this.setState({ showInsufficentPermissionModal: true });
        return;
      }
    }

    switch (true) {
      case !!latestPrompt:
        // toast.success(`Prompt you have entered: ${decodeURIComponent(latestPrompt)}`, {
        //   duration: 10000,
        // });
        // Optional: Clear the cookie after showing toast
        this.setState({ showAIOnboardingLoadingScreen: true });
        this.createApp(`Untitled App: ${uuidv4()}`, undefined, `${decodeURIComponent(latestPrompt)}`);
        break;
      case !!templateId: {
        this.setState({ showAIOnboardingLoadingScreen: true });
        if (templateId) {
          /*TODO: I Believe the people who will try the templates from site should be new to tooljet. so making name unique for existed user can be do it in sometime */
          this.deployApp(new Event('deploy'), `${templateId.replace(/-/g, ' ')}`, {
            id: templateId,
          });
        }
        break;
      }
      default:
        break;
    }
  };

  componentDidMount() {
    this.handleAiOnboarding();
    if (this.props.appType === 'workflow') {
      if (!this.canViewWorkflow()) {
        toast.error('You do not have permission to view workflows');
        this.setState({ shouldRedirect: true });
        return;
      }
    }
    if (this.props.appType === 'module' && authenticationService.currentSessionValue?.role?.name == 'end-user') {
      //Restrict route
      this.setState({ shouldRedirect: true });
      return;
    }
    fetchAndSetWindowTitle({ page: pageTitles.DASHBOARD });
    this.fetchApps(1, this.state.currentFolder.id);
    this.fetchFolders();
    this.fetchFeatureAccesss();
    this.fetchAppsLimit();
    this.fetchWorkflowsInstanceLimit();
    this.fetchWorkflowsWorkspaceLimit();
    this.fetchOrgGit();
    this.setQueryParameter();

    // Check module access permission
    this.props.checkModuleAccess();

    const hasClosedBanner = localStorage.getItem('hasClosedGroupMigrationBanner');

    //Only show the banner once
    if (hasClosedBanner) {
      this.setState({ showGroupMigrationBanner: false });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.appType != this.props.appType) {
      this.fetchFolders();
      this.fetchApps(1);
    }
    if (Object.keys(this.props.featureAccess).length && !this.state.featureAccess) {
      this.setState({ featureAccess: this.props.featureAccess, featuresLoaded: this.props.featuresLoaded });
    }
    if (this.state.shouldRedirect && !prevState.shouldRedirect) {
      const workspaceId = getWorkspaceId();
      this.props.navigate(`/${workspaceId}`);
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

  getAppType = () => {
    const { appType } = this.props;
    if (appType === 'front-end') return 'App';
    if (appType === 'workflow') return 'Workflow';
    if (appType === 'module') return 'Module';
    return 'app';
  };

  createApp = async (appName, type, prompt) => {
    let _self = this;
    _self.setState({ creatingApp: true });
    try {
      const data = await appsService.createApp({
        icon: sample(iconList),
        name: appName,
        type: this.props.appType,
        prompt,
      });
      /* Posthog Event */
      posthogHelper.captureEvent('click_new_app', {
        workspace_id:
          authenticationService?.currentUserValue?.organization_id ||
          authenticationService?.currentSessionValue?.current_organization_id,
        app_id: data?.id,
        button_name: this.state.posthog_from === 'blank_page' ? 'click_new_app_from_scratch' : 'click_new_app_button',
      });
      const workspaceId = getWorkspaceId();
      _self.props.navigate(`/${workspaceId}/apps/${data.id}`, {
        state: { commitEnabled: this.state.commitEnabled, prompt },
      });
      this.eraseAIOnboardingRelatedCookies();
      this.props.appType !== 'front-end' && toast.success(`${capitalize(this.getAppType())} created successfully!`);
      _self.setState({ creatingApp: false, posthog_from: null, showAIOnboardingLoadingScreen: false });
      return true;
    } catch (errorResponse) {
      this.eraseAIOnboardingRelatedCookies();
      _self.setState({ creatingApp: false, showAIOnboardingLoadingScreen: false });
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
      await appsService.saveApp(appId, { name: newAppName }, this.props.appType);
      await this.fetchApps(this.state.currentPage, this.state.currentFolder.id);
      toast.success(`${this.getAppType()} name has been updated!`);
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
      const data = await appsService.cloneResource(
        {
          app: [{ id: appId, name: appName }],
          organization_id: this.state.currentUser?.organization_id,
        },
        this.props.appType
      );
      toast.success(`${this.getAppType()} cloned successfully!`);
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

  exportAppDirectly = async (app) => {
    try {
      const fetchVersions = await appsService.getVersions(app.id);
      const { versions } = fetchVersions;

      const currentEditingVersion = versions?.filter((version) => version?.isCurrentEditingVersion)[0];
      if (!currentEditingVersion) {
        toast.error('Could not find current editing version.', {
          position: 'top-center',
        });
        return;
      }

      // Export all TJDB tables used by default
      const fetchTables = await appsService.getTables(app.id);
      const { tables: allTables } = fetchTables;

      const versionId = currentEditingVersion.id;
      const exportTjDb = true;
      const exportTables = allTables;

      const appOpts = {
        app: [
          {
            id: app.id,
            search_params: { version_id: versionId },
          },
        ],
      };

      const requestBody = {
        ...appOpts,
        ...(exportTjDb && { tooljet_database: exportTables }),
        organization_id: app.organization_id,
      };

      const data = await appsService.exportResource(requestBody);

      const appName = app.name.replace(/\s+/g, '-').toLowerCase();
      const fileName = `${appName}-export-${new Date().getTime()}`;
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = fileName + '.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Workflow exported successfully!', {
        position: 'top-center',
      });
    } catch (error) {
      toast.error(`Could not export workflow: ${error?.data?.message || error.message}`, {
        position: 'top-center',
      });
    }
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

        const dependentPluginsResponse = await pluginsService.findDependentPlugins(dataSourcesUsedInApps);
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

  importFile = async (importJSON, appName, skipPermissionsGroupCheck = false) => {
    this.setState({ isImportingApp: true });
    // For backward compatibility with legacy app import
    const organization_id = this.state.currentUser?.organization_id;
    const isLegacyImport = isEmpty(importJSON.tooljet_version);
    if (isLegacyImport) {
      importJSON = {
        app: [{ definition: importJSON, appName: appName }],
        tooljet_version: importJSON.tooljetVersion,
      };
    } else {
      importJSON.app[0].appName = appName;
    }
    const requestBody = {
      organization_id,
      ...importJSON,
      skip_permissions_group_check: skipPermissionsGroupCheck,
    };
    let installedPluginsInfo = [];
    try {
      if (this.state.dependentPlugins.length) {
        ({ installedPluginsInfo = [] } = await pluginsService.installDependentPlugins(
          this.state.dependentPlugins,
          true
        ));
      }

      if (importJSON.app[0].definition.appV2.type !== this.props.appType) {
        toast.error(
          `${this.props.appType === 'module' ? 'App' : 'Module'} could not be imported in ${
            this.props.appType === 'module' ? 'modules' : 'apps'
          } section. Switch to ${this.props.appType === 'module' ? 'apps' : 'modules'} section and try again.`,
          { style: { maxWidth: '425px' } }
        );
        this.setState({ isImportingApp: false });
        return;
      }

      const data = await appsService.importResource(requestBody, this.props.appType);
      toast.success(`${this.getAppType()} imported successfully.`);
      this.setState({ isImportingApp: false });

      if (!isEmpty(data.imports.app)) {
        this.props.navigate(`/${getWorkspaceId()}/apps/${data.imports.app[0].id}`, {
          state: { commitEnabled: this.state.commitEnabled },
        });
      } else if (!isEmpty(data.imports.tooljet_database)) {
        this.props.navigate(`/${getWorkspaceId()}/database`);
      }
    } catch (error) {
      if (error?.error?.type === 'permission-check') {
        this.setState({ showMissingGroupsModal: true, missingGroups: error?.error?.data });
        return;
      }
      if (installedPluginsInfo.length) {
        const pluginsId = installedPluginsInfo.map((pluginInfo) => pluginInfo.id);
        await pluginsService.uninstallPlugins(pluginsId);
      }

      this.setState({ isImportingApp: false });
      if (error.statusCode === 409) return false;
      toast.error(error?.error || error?.message || `${capitalize(this.getAppType())} import failed`);
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
      this.setState({ deploying: false, showAIOnboardingLoadingScreen: false });
      toast.success(`${this.getAppType()} created successfully!`, { position: 'top-center' });
      this.props.navigate(`/${getWorkspaceId()}/apps/${data.app[0].id}`, {
        state: { commitEnabled: this.state.commitEnabled },
      });
      this.eraseAIOnboardingRelatedCookies();
    } catch (e) {
      this.setState({ deploying: false, showAIOnboardingLoadingScreen: false });
      toast.error(e.error);
      this.eraseAIOnboardingRelatedCookies();
      if (e.statusCode === 409) {
        return false;
      } else {
        return e;
      }
    }
  };

  eraseAIOnboardingRelatedCookies = () => {
    aiOnboardingService
      .deleteAiCookies()
      .then(() => {
        console.log('AI onboarding server side cookies deleted successfully');
      })
      .catch((error) => {
        console.error('Deleting AI onboarding server side cookies failed', error);
      })
      .finally(() => {
        updateCurrentSession({
          ai_cookies: {
            tj_api_source: null,
            tj_template_id: null,
          },
        });
      });
  };

  canViewWorkflow = () => {
    return this.canUserPerform(this.state.currentUser, 'view') && isWorkflowsFeatureEnabled();
  };

  canUserPerform(user, action, app) {
    const currentSession = authenticationService.currentSessionValue;
    const { user_permissions, app_group_permissions, workflow_group_permissions, super_admin, admin } = currentSession;

    if (super_admin) return true;

    if (this.props.appType === 'workflow') {
      const canCreateWorkflow = admin || user_permissions?.workflow_create;
      const canUpdateWorkflow =
        workflow_group_permissions?.is_all_editable ||
        workflow_group_permissions?.editable_workflows_id?.includes(app?.id);
      const canExecuteWorkflow =
        canUpdateWorkflow ||
        workflow_group_permissions?.is_all_executable ||
        workflow_group_permissions?.executable_workflows_id?.includes(app?.id);
      const canDeleteWorkflow = user_permissions?.workflow_delete || admin;

      switch (action) {
        case 'create':
          return canCreateWorkflow;
        case 'read':
          return canCreateWorkflow || canUpdateWorkflow || canDeleteWorkflow || canExecuteWorkflow;
        case 'update':
          return canUpdateWorkflow;
        case 'delete':
          return canDeleteWorkflow;
        case 'view':
          return (
            canCreateWorkflow ||
            canUpdateWorkflow ||
            canDeleteWorkflow ||
            canExecuteWorkflow ||
            workflow_group_permissions?.editable_workflows_id?.length > 0 ||
            workflow_group_permissions?.executable_workflows_id?.length > 0
          );
        default:
          return false;
      }
    } else {
      const canUpdateApp =
        app_group_permissions &&
        (app_group_permissions.is_all_editable || app_group_permissions.editable_apps_id.includes(app?.id));
      const canReadApp =
        (app_group_permissions && canUpdateApp) ||
        app_group_permissions.is_all_viewable ||
        app_group_permissions.viewable_apps_id.includes(app?.id);

      switch (action) {
        case 'create':
          return user_permissions.app_create;
        case 'read':
          return this.isUserOwnerOfApp(user, app) || canReadApp;
        case 'update':
          return canUpdateApp || this.isUserOwnerOfApp(user, app);
        case 'delete':
          return user_permissions.app_delete || this.isUserOwnerOfApp(user, app);
        default:
          return false;
      }
    }
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
      .deleteApp(this.state.appToBeDeleted.id, this.props.appType)
      .then((data) => {
        toast.success(`${this.getAppType()} deleted successfully.`);
        this.fetchApps(
          this.state.currentPage
            ? this.state.apps?.length === 1
              ? this.state.currentPage - 1
              : this.state.currentPage
            : 1,
          this.state.currentFolder.id
        );
        this.fetchFolders();
        if (this.props.appType === 'workflow') {
          this.fetchWorkflowsInstanceLimit();
          this.fetchWorkflowsWorkspaceLimit();
        } else {
          this.fetchAppsLimit();
        }
      })
      .catch(({ error }) => {
        toast.error('Could not delete the app.');
      })
      .finally(() => {
        this.cancelDeleteAppDialog();
      });
  };

  isExistingPlanUser = (date) => {
    return new Date(date) < new Date('2025-04-01');
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
      appName: this.state.importedAppName,
      allowEditing: this.state.isAppImportEditable,
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
        posthogHelper.captureEvent('click_add_to_folder_button', {
          workspace_id:
            authenticationService?.currentUserValue?.organization_id ||
            authenticationService?.currentSessionValue?.current_organization_id,
          app_id: appOperations?.selectedApp?.id,
          folder_id: appOperations?.selectedFolder,
        });
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
    posthogHelper.captureEvent('click_import_from_template', {
      workspace_id:
        authenticationService?.currentUserValue?.organization_id ||
        authenticationService?.currentSessionValue?.current_organization_id,
      button_name: 'click_import_from_template',
    });
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
    this.setState({ showCreateAppModal: true });
  };

  closeCreateAppModal = () => {
    this.setState({ showCreateAppModal: false });
  };

  openImportAppModal = async () => {
    /* Posthog Events */
    posthogHelper.captureEvent('click_import_button', {
      workspace_id:
        authenticationService?.currentUserValue?.organization_id ||
        authenticationService?.currentSessionValue?.current_organization_id,
      button_name: 'click_import_dropdown_button',
    });
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
  handleAppNameChange = (e) => {
    const newAppName = e.target.value;
    const { appsFromRepos } = this.state;
    let validationMessage = {};
    if (!newAppName.trim()) {
      validationMessage = { message: 'App name cannot be empty' };
    } else if (newAppName.length > 50) {
      validationMessage = { message: 'App name cannot exceed 50 characters' };
    } else {
      const matchingApp = Object.values(appsFromRepos).find((app) => app.git_app_name === newAppName.trim());
      if (matchingApp?.app_name_exist === 'EXIST') {
        validationMessage = { message: 'App name already exists' };
      }
    }
    this.setState({
      importedAppName: newAppName,
      importingGitAppOperations: validationMessage,
    });
  };

  // Helper functions for workflow limit checks
  hasWorkflowLimitReached = () => {
    const { workflowInstanceLevelLimit, workflowWorkspaceLevelLimit } = this.state;

    const instanceLimitReached =
      workflowInstanceLevelLimit.total === 0 || workflowInstanceLevelLimit.current >= workflowInstanceLevelLimit.total;
    const workspaceLimitReached =
      workflowWorkspaceLevelLimit.total === 0 ||
      workflowWorkspaceLevelLimit.current >= workflowWorkspaceLevelLimit.total;

    return instanceLimitReached || workspaceLimitReached;
  };

  hasWorkflowLimitWarning = () => {
    const { workflowInstanceLevelLimit, workflowWorkspaceLevelLimit } = this.state;
    return this.hasInstanceLimitWarning() || this.hasWorkspaceLimitWarning();
  };

  hasInstanceLimitWarning = () => {
    const { workflowInstanceLevelLimit } = this.state;
    const percentage = workflowInstanceLevelLimit.percentage;

    return (
      workflowInstanceLevelLimit.current >= workflowInstanceLevelLimit.total ||
      (percentage >= 90 && percentage < 100) ||
      workflowInstanceLevelLimit.current === workflowInstanceLevelLimit.total - 1
    );
  };

  hasWorkspaceLimitWarning = () => {
    const { workflowWorkspaceLevelLimit } = this.state;
    const percentage = workflowWorkspaceLevelLimit.percentage;

    return (
      workflowWorkspaceLevelLimit.current >= workflowWorkspaceLevelLimit.total ||
      (percentage >= 90 && percentage < 100) ||
      workflowWorkspaceLevelLimit.current === workflowWorkspaceLevelLimit.total - 1
    );
  };

  getWorkflowLimit = () => {
    return this.hasInstanceLimitWarning()
      ? this.state.workflowInstanceLevelLimit
      : this.state.workflowWorkspaceLevelLimit;
  };

  onPermissionDeniedModalHide = () => {
    this.setState({ showInsufficentPermissionModal: false });
    this.eraseAIOnboardingRelatedCookies();
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
      showMissingGroupsModal,
      missingGroups,
      missingGroupsExpanded,
      showAIOnboardingLoadingScreen,
      showInsufficentPermissionModal,
    } = this.state;

    if (showAIOnboardingLoadingScreen) {
      return <TJLoader />;
    }

    const invalidLicense = featureAccess?.licenseStatus?.isExpired || !featureAccess?.licenseStatus?.isLicenseValid;
    const deleteModuleText =
      'This action will permanently delete the module from all connected applications. This cannot be reversed. Confirm deletion?';

    const getDisabledState = () => {
      if (this.props.appType === 'module') {
        return invalidLicense;
      } else if (this.props.appType === 'front-end') {
        return appsLimit?.percentage >= 100;
      } else {
        return this.hasWorkflowLimitReached();
      }
    };
    const modalConfigs = {
      create: {
        modalType: 'create',
        closeModal: this.closeCreateAppModal,
        processApp: (name) => this.createApp(name),
        show: this.openCreateAppModal,
        title: `Create ${this.getAppType().toLocaleLowerCase()}`,
        actionButton: `+ Create ${this.getAppType().toLocaleLowerCase()}`,
        actionLoadingButton: 'Creating',
        appType: this.props.appType,
      },
      clone: {
        modalType: 'clone',
        closeModal: () => this.setState({ showCloneAppModal: false }),
        processApp: this.cloneApp,
        show: () => this.setState({ showCloneAppModal: true }),
        title: `Clone ${this.getAppType().toLocaleLowerCase()}`,
        actionButton: `Clone ${this.getAppType().toLocaleLowerCase()}`,
        actionLoadingButton: 'Cloning',
        selectedAppId: appOperations?.selectedApp?.id,
        selectedAppName: appOperations?.selectedApp?.name,
        appType: this.props.appType,
      },
      import: {
        modalType: 'import',
        closeModal: () => this.setState({ showImportAppModal: false }),
        processApp: this.importFile,
        show: this.openImportAppModal,
        title: `Import ${this.getAppType().toLocaleLowerCase()}`,
        actionButton: `Import ${this.getAppType().toLocaleLowerCase()}`,
        actionLoadingButton: 'Importing',
        fileContent: fileContent,
        selectedAppName: fileName,
        dependentPluginsDetail: dependentPluginsDetail,
        dependentPlugins: dependentPlugins,
        appType: this.props.appType,
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
    const isAdmin = authenticationService?.currentSessionValue?.admin;
    const isBuilder = authenticationService?.currentSessionValue?.is_builder;

    //import app missing groups modal config
    const threshold = 3;
    const isLong = missingGroups.length > threshold;
    const displayedGroups = missingGroupsExpanded ? missingGroups : missingGroups.slice(0, threshold);

    return (
      <Layout switchDarkMode={this.props.switchDarkMode} darkMode={this.props.darkMode}>
        <div className="wrapper home-page">
          {/* this needs more revamp and conditions---> currently added this for testing*/}
          {showInsufficentPermissionModal && (
            <PermissionDeniedModal
              show={showInsufficentPermissionModal}
              onHide={this.onPermissionDeniedModalHide}
              darkMode={this.props.darkMode}
            />
          )}
          <AppActionModal
            modalStates={{
              showCreateAppModal,
              showCloneAppModal,
              showImportAppModal,
              showCreateAppFromTemplateModal,
            }}
            configs={modalConfigs}
            onCommitChange={this.handleCommitChange}
          />
          <ModalBase
            showHeader={false}
            showFooter={false}
            handleConfirm={() => this.importFile(fileContent, fileName, true)}
            show={showMissingGroupsModal}
            isLoading={importingApp}
            handleClose={() => this.setState({ showMissingGroupsModal: false })}
            confirmBtnProps={{
              title: 'Import',
              tooltipMessage: '',
            }}
            className="missing-groups-modal"
            darkMode={this.props.darkMode}
          >
            <div className="missing-groups-modal-body">
              <div className="flex items-start">
                <SolidIcon name="warning" width="40px" fill="var(--icon-warning)" />
                <div>
                  <div className="header">Warning: Missing user groups for permissions</div>
                  <p className="sub-header">
                    Permissions for the following user group(s) won’t be applied since they do not exist in this
                    workspace.
                  </p>
                </div>
              </div>

              <div className="groups-list">
                <div
                  className={`border rounded text-sm container ${
                    missingGroupsExpanded ? 'max-h-48 overflow-y-auto' : ''
                  }`}
                >
                  <div style={{ color: 'var(--text-placeholder)' }} className="tj-text-xsm font-weight-500">
                    User groups
                  </div>
                  <div className="mt-1">
                    {displayedGroups.map((group, idx) => (
                      <span className="tj-text-xsm font-weight-500" key={idx}>
                        {group}
                        {idx < displayedGroups.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                    {!missingGroupsExpanded && isLong && '...'}
                  </div>
                </div>

                {isLong && (
                  <button
                    class="toggle-button"
                    onClick={() => this.setState({ missingGroupsExpanded: !missingGroupsExpanded })}
                  >
                    <span className="chevron">
                      <SolidIcon
                        fill="var(--icon-brand)"
                        name={missingGroupsExpanded ? 'cheveronup' : 'cheverondown'}
                      />
                    </span>
                    <span class="label">{missingGroupsExpanded ? 'See less' : 'See more'}</span>
                  </button>
                )}
              </div>

              <p className="info">
                Restricted pages, queries, or components will become accessible to all users or to existing groups with
                permissions. To avoid this, create the missing groups before importing, or reconfigure permissions after
                import.
              </p>

              <div className="mt-6 d-flex justify-between action-btns">
                <ButtonSolid
                  className="secondary-action"
                  variant={'tertiary'}
                  onClick={() => this.setState({ showMissingGroupsModal: false, isImportingApp: false })}
                >
                  Cancel import
                </ButtonSolid>
                <ButtonSolid
                  isLoading={importingApp}
                  variant={'primary'}
                  onClick={() => this.importFile(fileContent, fileName, true)}
                  className="primary-action"
                >
                  Import with limited permissions
                </ButtonSolid>
              </div>
            </div>
          </ModalBase>
          {showRenameAppModal && (
            <AppModal
              show={() => this.setState({ showRenameAppModal: true })}
              closeModal={() => this.setState({ showRenameAppModal: false })}
              processApp={this.renameApp}
              selectedAppId={appOperations.selectedApp.id}
              selectedAppName={appOperations.selectedApp.name}
              title={`Rename ${this.getAppType().toLocaleLowerCase()}`}
              actionButton={`Rename ${this.getAppType().toLocaleLowerCase()}`}
              actionLoadingButton={'Renaming'}
              appType={this.props.appType}
            />
          )}
          <ConfirmDialog
            show={showAppDeletionConfirmation}
            message={this.props.t(
              this.props.appType === 'workflow'
                ? 'homePage.deleteWorkflowAndData'
                : this.props.appType === 'front-end'
                ? 'homePage.deleteAppAndData'
                : deleteModuleText,
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
                        this.setState(
                          { selectedAppRepo: newVal, importedAppName: appsFromRepos[newVal]?.git_app_name },
                          () => {
                            if (appsFromRepos[newVal]?.app_name_exist === 'EXIST') {
                              this.setState({ importingGitAppOperations: { message: 'App name already exists' } });
                            } else {
                              this.setState({ importingGitAppOperations: {} });
                            }
                          }
                        );
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
                          value={this.state.importedAppName}
                          className={cx('form-control font-weight-400', {
                            'tj-input-error-state': importingGitAppOperations?.message,
                          })}
                          onChange={this.handleAppNameChange}
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
                          {importingGitAppOperations?.message}
                        </div>
                      </div>
                    </div>
                    <div className="application-editable-checkbox-container">
                      <input
                        className="form-check-input"
                        checked={this.state.isAppImportEditable}
                        type="checkbox"
                        onChange={() =>
                          this.setState((prevState) => ({ isAppImportEditable: !prevState.isAppImportEditable }))
                        }
                      />
                      Make application editable
                      <div className="helper-text">
                        <div className="tj-text tj-text-xsm"></div>
                        <div className="tj-text-xxsm">
                          Enabling this allows editing and git sync push/pull access in development.
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
              <div className="create-new-app-license-wrapper">
                {this.canCreateApp() && (
                  <LicenseTooltip
                    limits={appsLimit}
                    feature={
                      this.props.appType === 'workflow'
                        ? 'workflows'
                        : this.props.appType === 'module'
                        ? 'modules'
                        : 'apps'
                    }
                    isAvailable={true}
                    noTooltipIfValid={true}
                  >
                    <div className="create-new-app-wrapper">
                      <Dropdown as={ButtonGroup} className="d-inline-flex create-new-app-dropdown">
                        <Button
                          disabled={getDisabledState()}
                          className={`create-new-app-button col-11 ${creatingApp ? 'btn-loading' : ''}`}
                          onClick={() =>
                            this.setState({
                              showCreateAppModal: true,
                            })
                          }
                          data-cy="create-new-app-button"
                        >
                          <>
                            {isImportingApp && (
                              <span className="spinner-border spinner-border-sm mx-2" role="status"></span>
                            )}
                            {this.props.appType === 'module'
                              ? 'Create new module'
                              : this.props.t(
                                  `${
                                    this.props.appType === 'workflow' ? 'workflowsDashboard' : 'homePage'
                                  }.header.createNewApplication`,
                                  'Create new app'
                                )}
                          </>
                        </Button>
                        <Dropdown.Toggle
                          disabled={getDisabledState()}
                          split
                          className="d-inline"
                          data-cy="import-dropdown-menu"
                        />
                        <ImportAppMenu
                          darkMode={this.props.darkMode}
                          showTemplateLibraryModal={
                            this.props.appType !== 'module' ? this.showTemplateLibraryModal : undefined
                          }
                          featureAccess={featureAccess}
                          orgGit={orgGit}
                          toggleGitRepositoryImportModal={
                            this.props.appType !== 'module' ? this.toggleGitRepositoryImportModal : undefined
                          }
                          readAndImport={this.readAndImport}
                          appType={this.props.appType}
                        />
                      </Dropdown>
                    </div>
                  </LicenseTooltip>
                )}
              </div>
              {this.props.appType === 'module' ? (
                <div>
                  <p></p>
                </div>
              ) : (
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
              )}
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
              {authenticationService.currentSessionValue?.super_admin &&
                this.isWithinSevenDaysOfSignUp(authenticationService.currentSessionValue?.consultation_banner_date) && (
                  <ConsultationBanner
                    classes={`${this.props.darkMode ? 'theme-dark dark-theme m-3 trial-banner' : 'm-3 trial-banner'}`}
                  />
                )}

              <OrganizationList customStyle={{ marginBottom: isAdmin || isBuilder ? '' : '0px' }} />
            </div>

            <div className={cx('col home-page-content')} data-cy="home-page-content">
              <div className="w-100 mb-5 container home-page-content-container">
                {featuresLoaded && !isLoading ? (
                  <>
                    <AppTypeTab
                      appType={this.props.appType}
                      navigate={this.props.navigate}
                      darkMode={this.props.darkMode}
                      hasModuleAccess={this.props.hasModuleAccess}
                    />
                  </>
                ) : (
                  !appSearchKey && <HeaderSkeleton />
                )}

                {this.props.appType !== 'workflow' && this.props.appType !== 'module' && this.canCreateApp() && (
                  <CreateAppWithPrompt createApp={this.createApp} />
                )}

                {(meta?.total_count > 0 || appSearchKey) && (
                  <>
                    {!(isLoading && !appSearchKey) && (
                      <HomeHeader
                        onSearchSubmit={this.onSearchSubmit}
                        darkMode={this.props.darkMode}
                        appType={this.props.appType}
                        disabled={this.props.appType === 'module' && invalidLicense}
                      />
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
                {!isLoading &&
                  featuresLoaded &&
                  meta?.total_count === 0 &&
                  !currentFolder.id &&
                  !appSearchKey &&
                  (['front-end', 'workflow'].includes(this.props.appType) ? (
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
                      workflowsLimit={
                        workflowInstanceLevelLimit.current >= workflowInstanceLevelLimit.total ||
                        100 > workflowInstanceLevelLimit.percentage >= 90 ||
                        workflowInstanceLevelLimit.current === workflowInstanceLevelLimit.total - 1
                          ? workflowInstanceLevelLimit
                          : workflowWorkspaceLevelLimit
                      }
                    />
                  ) : (
                    <div className="empty-module-container">
                      <EmptyModuleSvg />
                      <div className="empty-title mt-3" style={{ display: 'block' }}>
                        <div>Create reusable groups of components and queries via modules.</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <a
                            href="https://docs.tooljet.ai/docs/app-builder/modules/overview"
                            target="_blank"
                            className="docs-link"
                            rel="noreferrer"
                          >
                            Check out our guide
                          </a>
                          &nbsp;on creating modules.
                        </div>
                      </div>

                      <ButtonSolid
                        disabled={invalidLicense}
                        leftIcon="folderdownload"
                        isLoading={false}
                        onClick={this.openCreateAppModal}
                        data-cy="button-import-an-app"
                        className="col"
                        variant="tertiary"
                      >
                        <ToolTip
                          show={invalidLicense}
                          message="Modules are available only on paid plans"
                          placement="bottom"
                        >
                          <label style={{ visibility: isImportingApp ? 'hidden' : 'visible' }} data-cy="create-module">
                            {'Create new module'}
                          </label>
                        </ToolTip>
                      </ButtonSolid>
                    </div>
                  ))}
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
                    exportApp={this.props.appType === 'workflow' ? this.exportAppDirectly : this.exportApp}
                    meta={meta}
                    currentFolder={currentFolder}
                    isLoading={isLoading || !featuresLoaded}
                    darkMode={this.props.darkMode}
                    appActionModal={this.appActionModal}
                    removeAppFromFolder={this.removeAppFromFolder}
                    appType={this.props.appType}
                    basicPlan={invalidLicense}
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
                    appType={this.props.appType}
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
  const { featureAccess, featuresLoaded, hasModuleAccess } = useLicenseStore(
    (state) => ({
      featureAccess: state.featureAccess,
      featuresLoaded: state.featuresLoaded,
      hasModuleAccess: state.hasModuleAccess,
    }),
    shallow
  );
  const { checkModuleAccess } = useLicenseStore((state) => state.actions, shallow);

  return (
    <Component
      {...props}
      featureAccess={featureAccess}
      featuresLoaded={featuresLoaded}
      checkModuleAccess={checkModuleAccess}
      hasModuleAccess={hasModuleAccess}
    />
  );
};

export const HomePage = withTranslation()(withStore(withRouter(HomePageComponent)));
