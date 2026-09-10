import React, { createContext, useMemo, useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/_ui/Layout';
import {
  globalDatasourceService,
  appEnvironmentService,
  authenticationService,
  licenseService,
  dataSourceFolderService,
} from '@/_services';
import { GlobalDataSources } from '../../components/GlobalDataSources';
import { toast } from 'react-hot-toast';
import { BreadCrumbContext } from '@/App/App';
import { returnDevelopmentEnv, getWorkspaceId } from '@/_helpers/utils';
import _ from 'lodash';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import { appendBranchName } from '@/_helpers/active-branch';
import { fetchAndSetWindowTitle, pageTitles } from '@white-label/whiteLabelling';
import { fetchEdition } from '@/modules/common/helpers/utils';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { subscribeLiveNotifications } from '@/_stores/notificationsStore';

export const GlobalDataSourcesContext = createContext({
  showDataSourceManagerModal: false,
  toggleDataSourceManagerModal: () => {},
  selectedDataSource: null,
  setSelectedDataSource: () => {},
  environments: [],
  featureAccess: {},
});

export const GlobalDataSourcesPage = (props) => {
  const { admin, current_organization_id, load_app } = authenticationService.currentSessionValue;
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [dataSources, setDataSources] = useState([]);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = useState(false);
  const [isEditing, setEditing] = useState(true);
  const [isLoading, setLoading] = useState(true);
  const [environments, setEnvironments] = useState([]);
  const [currentEnvironment, setCurrentEnvironment] = useState(null);
  const [environmentLoading, setEnvironmentLoading] = useState(false);
  const [activeDatasourceList, setActiveDatasourceList] = useState('#commonlyused');
  const navigate = useNavigate();
  const { selectedId: selectedIdFromUrl } = useParams();
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const [featureAccess, setFeatureAccess] = useState({});
  const initialUrlSelectionHandled = useRef(false);

  // Data-source folders (workspace + active-branch scoped). `folders` carries each folder's
  // `folder_data_sources` membership; stray (unfoldered) data sources are derived in the sidebar
  // by subtracting foldered ids from `dataSources`. Expanding a folder is inline/accordion — it
  // never changes the right-hand pane (that keeps whatever was open). `selectedDataSourceIds`
  // backs shift+click multi-select for drag and the "Add to folder" modal.
  const [folders, setFolders] = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [expandedFolderIds, setExpandedFolderIds] = useState([]);
  const [selectedDataSourceIds, setSelectedDataSourceIds] = useState([]);

  const activeBranchId = useWorkspaceBranchesStore((state) => state.activeBranchId);
  const setHasUnsyncedDatasources = useWorkspaceBranchesStore((state) => state.actions.setHasUnsyncedDatasources);
  const prevBranchIdRef = useRef(activeBranchId);

  // Refetch datasources when the active branch changes (without hard reload)
  useEffect(() => {
    if (prevBranchIdRef.current !== activeBranchId && activeBranchId && environments?.length) {
      prevBranchIdRef.current = activeBranchId;
      setSelectedDataSource(null);
      toggleDataSourceManagerModal(false);
      setActiveDatasourceList('#commonlyused');
      fetchDataSources(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId, environments]);

  // Refetch datasources once a workspace pull actually completes. `pullWorkspace()` only
  // enqueues a background job and returns immediately — the pulled data isn't in the DB yet at
  // that point, so we wait for the job-completion notification (same signal HomePage listens to
  // for apps/folders) instead of refetching right after the request resolves.
  useEffect(() => {
    const unsubscribe = subscribeLiveNotifications((n) => {
      const meta = n?.metadata;
      if (meta?.source !== 'git-sync' || n?.type !== 'success') return;
      if (meta.action !== 'git-pull-branch') return;
      fetchDataSources(true);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (dataSources?.length == 0) updateSidebarNAV('Commonly used');
    fetchFeatureAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    selectedDataSource
      ? updateSidebarNAV(selectedDataSource.name)
      : !activeDatasourceList && updateSidebarNAV('Commonly used');

    //if user selected a new datasource to create one. switch to development env
    if (!selectedDataSource) {
      setCurrentEnvironment(returnDevelopmentEnv(environments));
      // Update URL when datasource is deselected (but not on initial load)
      if (initialUrlSelectionHandled.current) {
        navigate(appendBranchName(`/${getWorkspaceId()}/data-sources`), { replace: true });
      }
    }

    fetchAndSetWindowTitle({ page: `${selectedDataSource?.name || pageTitles.DATA_SOURCES}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dataSources), JSON.stringify(selectedDataSource), activeDatasourceList]);

  // Auto-select datasource from URL param on initial load
  useEffect(() => {
    if (selectedIdFromUrl && !initialUrlSelectionHandled.current && dataSources.length > 0 && environments.length > 0) {
      const dsFromUrl = dataSources.find((ds) => ds.id === selectedIdFromUrl);
      if (dsFromUrl) {
        initialUrlSelectionHandled.current = true;
        setActiveDatasourceList('');
        setSelectedDataSource(dsFromUrl);
        setCurrentEnvironment(environments[0]);
        toggleDataSourceManagerModal(true);
        updateSidebarNAV(dsFromUrl.name);
      } else {
        initialUrlSelectionHandled.current = true;
      }
    }
    if (!selectedIdFromUrl) {
      initialUrlSelectionHandled.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources, environments, selectedIdFromUrl]);

  useEffect(() => {
    if (!_.isEmpty(featureAccess)) {
      if (!(canReadDataSource() || canUpdateDataSource() || canCreateDataSource() || canDeleteDataSource())) {
        const edition = fetchEdition();
        toast.error("You don't have access to GDS, contact your workspace admin to add data sources");
        return navigate(`/${getWorkspaceId()}${edition === 'ce' ? '/' : '/home'}`);
      }
      fetchEnvironments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, load_app, featureAccess.isExpired, featureAccess.isLicenseValid]);

  const canAnyGroupPerformAction = (action, id) => {
    let { user_permissions, data_source_group_permissions, super_admin, admin } =
      authenticationService.currentSessionValue;

    const canCreateDataSource = super_admin || admin || user_permissions?.data_source_create;
    const canDeleteDataSource = super_admin || admin || user_permissions?.data_source_delete;
    const canConfigureDataSource =
      canCreateDataSource ||
      data_source_group_permissions?.is_all_configurable ||
      data_source_group_permissions?.configurable_data_source_id?.length ||
      data_source_group_permissions?.configurable_data_source_id?.includes(id);
    const canUseDataSource =
      canConfigureDataSource ||
      data_source_group_permissions?.is_all_usable ||
      data_source_group_permissions?.usable_data_sources_id?.length ||
      data_source_group_permissions?.usable_data_sources_id?.includes(id);

    switch (action) {
      case 'data_source_create':
        return canCreateDataSource;
      case 'data_source_delete':
        return canDeleteDataSource;
      case 'read':
        return canUseDataSource;
      case 'update':
        return canConfigureDataSource;
      default:
        return false;
    }
  };

  const canReadDataSource = () => {
    return canAnyGroupPerformAction('read');
  };

  const canCreateDataSource = () => {
    return canAnyGroupPerformAction('data_source_create');
  };

  const canUpdateDataSource = (id) => {
    return canAnyGroupPerformAction('update', id);
  };

  const canDeleteDataSource = () => {
    return canAnyGroupPerformAction('data_source_delete');
  };

  function updateSelectedDatasource(source) {
    updateSidebarNAV(source);
  }

  const fetchFeatureAccess = () => {
    licenseService.getFeatureAccess().then((data) => {
      setFeatureAccess({ ...data?.licenseStatus, ...data });
    });
  };

  // Coarse folder permissions surface on the session's user_permissions (decamelized from the
  // ability service's dataSourceFolderCreate/Delete). Admins/super-admins always pass.
  const canManageDataSourceFolder = (action) => {
    const { super_admin, admin, user_permissions } = authenticationService.currentSessionValue;
    return !!(super_admin || admin || user_permissions?.[`data_source_folder_${action}`]);
  };
  const canCreateDataSourceFolder = () => canManageDataSourceFolder('create');
  const canDeleteDataSourceFolder = () => canManageDataSourceFolder('delete');
  // Rename reuses the create gate (matches the app-folder convention where folderCreate is the
  // master flag for folder mutations).
  const canUpdateDataSourceFolder = () => canManageDataSourceFolder('create');

  const fetchFolders = async (searchKey = '') => {
    setFoldersLoading(true);
    try {
      const data = await dataSourceFolderService.getFolders(searchKey);
      setFolders(data?.folders ?? []);
    } catch {
      setFolders([]);
    } finally {
      setFoldersLoading(false);
    }
  };

  const toggleFolderExpanded = (folderId) => {
    setExpandedFolderIds((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  // Folder CRUD + membership wrappers. Each resolves the service promise (so the caller can show a
  // loading state and success toast) and refetches folders on success to reflect the new state.
  const createDataSourceFolder = (name) =>
    dataSourceFolderService.createFolder(name).then((res) => {
      fetchFolders();
      return res;
    });

  const renameDataSourceFolder = (name, id) =>
    dataSourceFolderService.renameFolder(name, id).then((res) => {
      fetchFolders();
      return res;
    });

  const deleteDataSourceFolder = (id) =>
    dataSourceFolderService.deleteFolder(id).then((res) => {
      // Auto-expanding folders that no longer exist would leak stale ids; prune on delete.
      setExpandedFolderIds((prev) => prev.filter((fid) => fid !== id));
      fetchFolders();
      return res;
    });

  // Add/move one or many data sources into a folder. The backend POST is idempotent and
  // auto-moves any data source already foldered elsewhere on this branch, so this covers both
  // "add to folder" and "move across folders" for single and bulk.
  const addDataSourcesToFolder = (dataSourceIds, folderId) => {
    const ids = Array.isArray(dataSourceIds) ? dataSourceIds : [dataSourceIds];
    const request =
      ids.length > 1
        ? dataSourceFolderService.bulkAddToFolder(ids, folderId)
        : dataSourceFolderService.addToFolder(ids[0], folderId);
    return request.then((res) => {
      fetchFolders();
      return res;
    });
  };

  const removeDataSourceFromFolder = (dataSourceId, folderId) =>
    dataSourceFolderService.removeFromFolder(dataSourceId, folderId).then((res) => {
      fetchFolders();
      return res;
    });

  const fetchDataSources = async (resetSelection = false, dataSource = null) => {
    toggleDataSourceManagerModal(false);
    setLoading(true);
    globalDatasourceService
      .getAll(current_organization_id)
      .then((data) => {
        const orderedDataSources = data.data_sources
          .map((ds) => {
            if (ds.options && ds.options.connection_limit) {
              return {
                ...ds,
                options: {
                  ...ds.options,
                  connectionLimit: ds.options.connection_limit,
                },
              };
            }
            return ds;
          })
          .sort((a, b) => {
            if (a.type === DATA_SOURCE_TYPE.SAMPLE && b.type !== DATA_SOURCE_TYPE.SAMPLE) {
              return -1; // a comes before b
            } else if (a.type !== DATA_SOURCE_TYPE.SAMPLE && b.type === DATA_SOURCE_TYPE.SAMPLE) {
              return 1; // b comes before a
            } else {
              // If types are the same or both are not 'sample', sort by name
              return a.name.localeCompare(b.name);
            }
          });
        setDataSources([...(orderedDataSources ?? [])]);
        setHasUnsyncedDatasources(orderedDataSources.some((ds) => ds?.is_synced === false || ds?.isSynced === false));
        const ds = dataSource && orderedDataSources.find((ds) => ds.id === dataSource.id);
        if (!resetSelection && ds) {
          setEditing(true);
          setSelectedDataSource(ds);
          setActiveDatasourceList('');
          toggleDataSourceManagerModal(true);
          fetchDataSourceByEnvironment(ds?.id, currentEnvironment?.id);
          navigate(appendBranchName(`/${getWorkspaceId()}/data-sources/${ds.id}`), { replace: true });
        }
        if (orderedDataSources.length && resetSelection) {
          if (!canCreateDataSource()) {
            setActiveDatasourceList('#commonlyused');
            setSelectedDataSource(null);
          } else if (!canUpdateDataSource()) {
            setSelectedDataSource(orderedDataSources[0]);
            toggleDataSourceManagerModal(true);
            setActiveDatasourceList('');
            navigate(appendBranchName(`/${getWorkspaceId()}/data-sources/${orderedDataSources[0].id}`), {
              replace: true,
            });
          } else {
            setActiveDatasourceList('#databases');
            setSelectedDataSource(null);
          }
        }
        if (!orderedDataSources.length) {
          setActiveDatasourceList('#commonlyused');
        }
        // Keep folders in lockstep with the data-source list (initial load + every branch switch
        // / git-pull refetch share the same active-branch context here).
        fetchFolders();
        setLoading(false);
      })
      .catch(() => {
        setDataSources([]);
        setLoading(false);
      });
  };

  const handleToggleSourceManagerModal = () => {
    toggleDataSourceManagerModal(
      (prevState) => !prevState,
      () => {
        setEditing((prev) => !prev);
      }
    );
  };

  const handleModalVisibility = () => {
    if (selectedDataSource) {
      return setSelectedDataSource(null, () => handleToggleSourceManagerModal());
    }
    setEditing(true);
    handleToggleSourceManagerModal();
  };

  const fetchEnvironments = () => {
    appEnvironmentService.getAllEnvironments().then((data) => {
      const envArray = data?.environments;
      setEnvironments(envArray);
      if (envArray.length > 0) {
        const env = returnDevelopmentEnv(envArray);
        setCurrentEnvironment(env);
      }
    });
  };

  const fetchDataSourceByEnvironment = (dataSourceId, envId) => {
    setEnvironmentLoading(true);
    globalDatasourceService.getDataSourceByEnvironmentId(dataSourceId, envId).then((data) => {
      // Preserve isSynced flags: the environment endpoint doesn't include them, but we need them
      // to correctly gate credential editing on the default branch (synced DSes must stay locked).
      setSelectedDataSource((prev) => ({
        ...data,
        isSynced: prev?.isSynced,
        is_synced: prev?.is_synced,
      }));
      setEnvironmentLoading(false);
    });
  };

  const value = useMemo(
    () => ({
      selectedDataSource,
      setSelectedDataSource,
      fetchDataSources,
      dataSources,
      showDataSourceManagerModal,
      toggleDataSourceManagerModal,
      handleModalVisibility,
      isEditing,
      setEditing,
      fetchEnvironments,
      environments,
      featureAccess,
      currentEnvironment,
      setCurrentEnvironment,
      setDataSources,
      fetchDataSourceByEnvironment,
      canReadDataSource,
      canUpdateDataSource,
      canDeleteDataSource,
      canCreateDataSource,
      isLoading,
      activeDatasourceList,
      setActiveDatasourceList,
      setLoading,
      environmentLoading,
      // Data-source folders
      folders,
      foldersLoading,
      fetchFolders,
      expandedFolderIds,
      toggleFolderExpanded,
      selectedDataSourceIds,
      setSelectedDataSourceIds,
      createDataSourceFolder,
      renameDataSourceFolder,
      deleteDataSourceFolder,
      addDataSourcesToFolder,
      removeDataSourceFromFolder,
      canCreateDataSourceFolder,
      canUpdateDataSourceFolder,
      canDeleteDataSourceFolder,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      selectedDataSource,
      dataSources,
      showDataSourceManagerModal,
      isEditing,
      environments,
      featureAccess,
      currentEnvironment,
      isLoading,
      activeDatasourceList,
      environmentLoading,
      folders,
      foldersLoading,
      expandedFolderIds,
      selectedDataSourceIds,
    ]
  );

  return (
    <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
      <GlobalDataSourcesContext.Provider value={value}>
        <div className="page-wrapper">
          <GlobalDataSources darkMode={props.darkMode} updateSelectedDatasource={updateSelectedDatasource} />
        </div>
      </GlobalDataSourcesContext.Provider>
    </Layout>
  );
};
