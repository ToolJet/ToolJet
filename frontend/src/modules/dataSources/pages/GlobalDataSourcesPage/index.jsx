import React, { createContext, useMemo, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/_ui/Layout';
import { globalDatasourceService, appEnvironmentService, authenticationService, licenseService } from '@/_services';
import { GlobalDataSources } from '../../components/GlobalDataSources';
import { toast } from 'react-hot-toast';
import { BreadCrumbContext } from '@/App/App';
import { returnDevelopmentEnv } from '@/_helpers/utils';
import _ from 'lodash';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import { fetchAndSetWindowTitle, pageTitles } from '@white-label/whiteLabelling';

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
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const [featureAccess, setFeatureAccess] = useState({});

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
    if (!selectedDataSource) setCurrentEnvironment(returnDevelopmentEnv(environments));

    fetchAndSetWindowTitle({ page: `${selectedDataSource?.name || pageTitles.DATA_SOURCES}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dataSources), JSON.stringify(selectedDataSource), activeDatasourceList]);

  useEffect(() => {
    if (!_.isEmpty(featureAccess)) {
      if (!(canReadDataSource() || canUpdateDataSource() || canCreateDataSource() || canDeleteDataSource())) {
        toast.error("You don't have access to GDS, contact your workspace admin to add data sources");
        return navigate('/');
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
        const ds = dataSource && orderedDataSources.find((ds) => ds.id === dataSource.id);
        if (!resetSelection && ds) {
          setEditing(true);
          setSelectedDataSource(ds);
          setActiveDatasourceList('');
          toggleDataSourceManagerModal(true);
          fetchDataSourceByEnvironment(ds?.id, currentEnvironment?.id);
        }
        if (orderedDataSources.length && resetSelection) {
          if (!canCreateDataSource()) {
            setActiveDatasourceList('#commonlyused');
            setSelectedDataSource(null);
          } else if (!canUpdateDataSource()) {
            setSelectedDataSource(orderedDataSources[0]);
            toggleDataSourceManagerModal(true);
            setActiveDatasourceList('');
          } else {
            setActiveDatasourceList('#databases');
            setSelectedDataSource(null);
          }
        }
        if (!orderedDataSources.length) {
          setActiveDatasourceList('#commonlyused');
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
    setEnvironmentLoading(true);
    globalDatasourceService.getDataSourceByEnvironmentId(dataSourceId, envId).then((data) => {
      setSelectedDataSource({ ...data });
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
