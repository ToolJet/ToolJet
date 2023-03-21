import React, { createContext, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/_ui/Layout';
import { globalDatasourceService } from '@/_services';
import { GlobalDataSourcesPage } from './GlobalDataSourcesPage';

export const GlobalDataSourcesContext = createContext({
  showDataSourceManagerModal: false,
  toggleDataSourceManagerModal: () => {},
  selectedDataSource: null,
  setSelectedDataSource: () => {},
});

export const GlobalDatasources = (props) => {
  const { organization_id, admin } = JSON.parse(localStorage.getItem('currentUser')) || {};
  const [organizationId, setOrganizationId] = useState(organization_id);
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

  const fetchDataSources = async (resetSelection = false) => {
    globalDatasourceService
      .getAll(organizationId)
      .then((data) => {
        setDataSources([...(data.data_sources ?? [])]);
        if (data.data_sources.length && resetSelection) {
          setSelectedDataSource(data.data_sources[0]);
          toggleDataSourceManagerModal(true);
        }
      })
      .catch(() => setDataSources([]));
  };

  const handleModalVisibility = () => {
    setSelectedDataSource(null);
    setEditing(false);
    toggleDataSourceManagerModal(true);
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
