import React, { createContext, useMemo, useState } from 'react';
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
  const { organization_id } = JSON.parse(localStorage.getItem('currentUser')) || {};
  const [organizationId, setOrganizationId] = useState(organization_id);
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [dataSources, setDataSources] = useState([]);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = useState(false);

  const fetchDataSources = async (refetch = false) => {
    return await globalDatasourceService.getAll(organizationId).then((data) => {
      setDataSources([...data?.data_sources]);
      setSelectedDataSource(data.data_sources[0]);
      refetch ? toggleDataSourceManagerModal(false) : toggleDataSourceManagerModal(true);
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
    }),
    [selectedDataSource, dataSources, showDataSourceManagerModal]
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
