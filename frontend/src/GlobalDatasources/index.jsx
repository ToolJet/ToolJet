import React, { createContext, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/_ui/Layout';
import { globalDatasourceService, authenticationService } from '@/_services';
import { GlobalDataSourcesPage } from './GlobalDataSourcesPage';

export const GlobalDataSourcesContext = createContext({
  showDataSourceManagerModal: false,
  toggleDataSourceManagerModal: () => {},
  selectedDataSource: null,
  setSelectedDataSource: () => {},
});

export const GlobalDatasources = (props) => {
  const { current_organization_id, admin } = authenticationService.currentSessionValue;
  const [organizationId, setOrganizationId] = useState(current_organization_id);
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [dataSources, setDataSources] = useState([]);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = useState(false);
  const [isEditing, setEditing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!admin) {
      navigate('/');
    }
  }, [admin]);

  const fetchDataSources = async (resetSelection = false, dsName = null) => {
    globalDatasourceService
      .getAll(organizationId)
      .then((data) => {
        const orderedDataSources = data.data_sources.sort((a, b) => a.name.localeCompare(b.name));
        setDataSources([...(orderedDataSources ?? [])]);
        const ds = dsName && orderedDataSources.find((ds) => ds.name === dsName);

        if (!resetSelection && ds) {
          setSelectedDataSource(ds);
          toggleDataSourceManagerModal(true);
        }

        if (orderedDataSources.length && resetSelection) {
          setSelectedDataSource(orderedDataSources[0]);
          toggleDataSourceManagerModal(true);
        }
      })
      .catch(() => setDataSources([]));
  };

  const handleToggleSourceManagerModal = () => {
    toggleDataSourceManagerModal(
      (prevState) => !prevState,
      () => setEditing((prev) => !prev)
    );
  };

  const handleModalVisibility = () => {
    if (selectedDataSource) {
      return setSelectedDataSource(null, () => handleToggleSourceManagerModal());
    }

    handleToggleSourceManagerModal();
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
    }),
    [selectedDataSource, dataSources, showDataSourceManagerModal, isEditing]
  );

  return (
    <Layout switchDarkMode={props.switchDarkMode} darkMode={props.darkMode}>
      <GlobalDataSourcesContext.Provider value={value}>
        <div className="page-wrapper">
          <GlobalDataSourcesPage darkMode={props.darkMode} />
        </div>
      </GlobalDataSourcesContext.Provider>
    </Layout>
  );
};
