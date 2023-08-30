import React, { createContext, useMemo, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/_ui/Layout';
import { globalDatasourceService, appEnvironmentService, authenticationService } from '@/_services';
import { GlobalDataSourcesPage } from './GlobalDataSourcesPage';
import { toast } from 'react-hot-toast';
import { BreadCrumbContext } from '@/App/App';
import { returnDevelopmentEnv } from '@/_helpers/utils';

export const GlobalDataSourcesContext = createContext({
  showDataSourceManagerModal: false,
  toggleDataSourceManagerModal: () => {},
  selectedDataSource: null,
  setSelectedDataSource: () => {},
  environments: [],
});

export const GlobalDatasources = (props) => {
  const { admin, data_source_group_permissions, group_permissions, super_admin, current_organization_id } =
    authenticationService.currentSessionValue;
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [dataSources, setDataSources] = useState([]);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = useState(false);
  const [isEditing, setEditing] = useState(true);
  const [isLoading, setLoading] = useState(true);
  const [environments, setEnvironments] = useState([]);
  const [currentEnvironment, setCurrentEnvironment] = useState(null);
  const [activeDatasourceList, setActiveDatasourceList] = useState('#databases');
  const navigate = useNavigate();
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  useEffect(() => {
    if (dataSources?.length == 0) updateSidebarNAV('Databases');
  }, []);

  useEffect(() => {
    selectedDataSource
      ? updateSidebarNAV(selectedDataSource.name)
      : !activeDatasourceList && updateSidebarNAV('Databases');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dataSources), JSON.stringify(selectedDataSource)]);

  useEffect(() => {
    if (!canCreateDataSource() && !canReadDataSource() && !canUpdateDataSource() && !canDeleteDataSource()) {
      toast.error("You don't have access to GDS, contact your workspace admin to add data sources");
      return navigate('/');
    }
    fetchEnvironments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  const canAnyGroupPerformAction = (action, permissions) => {
    if (!permissions) {
      return false;
    }

    return permissions.some((p) => p[action]);
  };

  const canReadDataSource = () => {
    return canAnyGroupPerformAction('read', data_source_group_permissions) || super_admin || admin;
  };

  const canCreateDataSource = () => {
    return canAnyGroupPerformAction('data_source_create', group_permissions) || super_admin || admin;
  };

  const canUpdateDataSource = () => {
    return canAnyGroupPerformAction('update', data_source_group_permissions) || super_admin || admin;
  };

  const canDeleteDataSource = () => {
    return canAnyGroupPerformAction('data_source_delete', group_permissions) || super_admin || admin;
  };

  function updateSelectedDatasource(source) {
    updateSidebarNAV(source);
  }

  const fetchDataSources = async (resetSelection = false, dataSource = null) => {
    toggleDataSourceManagerModal(false);
    setLoading(true);
    globalDatasourceService
      .getAll(current_organization_id)
      .then((data) => {
        const orderedDataSources = data.data_sources.sort((a, b) => a.name.localeCompare(b.name));
        setDataSources([...(orderedDataSources ?? [])]);
        const ds = dataSource && orderedDataSources.find((ds) => ds.id === dataSource.id);

        if (!resetSelection && ds) {
          setEditing(true);
          setSelectedDataSource(ds);
          toggleDataSourceManagerModal(true);
          return;
        }
        if (orderedDataSources.length && resetSelection) {
          setActiveDatasourceList('#databases');
        }
        if (!orderedDataSources.length) {
          setActiveDatasourceList('#databases');
        }
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
    globalDatasourceService.getDataSourceByEnvironmentId(dataSourceId, envId).then((data) => {
      setSelectedDataSource(data);
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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      selectedDataSource,
      dataSources,
      showDataSourceManagerModal,
      isEditing,
      environments,
      currentEnvironment,
      isLoading,
      activeDatasourceList,
    ]
  );

  return (
    <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
      <GlobalDataSourcesContext.Provider value={value}>
        <div className="page-wrapper">
          <GlobalDataSourcesPage darkMode={props.darkMode} updateSelectedDatasource={updateSelectedDatasource} />
        </div>
      </GlobalDataSourcesContext.Provider>
    </Layout>
  );
};
