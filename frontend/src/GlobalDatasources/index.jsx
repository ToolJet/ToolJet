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
  const { organization_id, admin } = JSON.parse(localStorage.getItem('currentUser')) || {};
  const [organizationId, setOrganizationId] = useState(organization_id);
  const [selectedDataSource, setSelectedDataSource] = useState(null);
  const [dataSources, setDataSources] = useState([]);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = useState(false);
  const [isEditing, setEditing] = useState(true);
  const navigate = useNavigate();
  const currentUser = authenticationService.currentUserValue;

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

  const canUserPerform = (user, action, dataSource) => {
    if (currentUser?.super_admin) {
      return true;
    }
    let permissionGrant;

    switch (action) {
      case 'create':
        permissionGrant = canAnyGroupPerformAction('data_source_create', user.group_permissions);
        break;
      case 'read':
      case 'update':
        permissionGrant = canAnyGroupPerformActionOnDataSource(action, user.data_source_group_permissions, dataSource);
        break;
      case 'delete':
        permissionGrant =
          this.canAnyGroupPerformActionOnDataSource('delete', user.app_group_permissions, dataSource) ||
          this.canAnyGroupPerformAction('data_source_delete', user.group_permissions);
        break;
      default:
        permissionGrant = false;
        break;
    }

    return permissionGrant;
  };

  const canAnyGroupPerformActionOnDataSource = (action, dataSourceGroupPermissions, dataSource) => {
    if (!dataSourceGroupPermissions) {
      return false;
    }

    const permissionsToCheck = dataSourceGroupPermissions.filter(
      (permission) => permission.data_source_id == dataSource.id
    );
    return this.canAnyGroupPerformAction(action, permissionsToCheck);
  };

  const canAnyGroupPerformAction = (action, permissions) => {
    if (!permissions) {
      return false;
    }

    return permissions.some((p) => p[action]);
  };

  const canCreateDataSource = () => {
    return canUserPerform(currentUser, 'create');
  };

  const canUpdateDataSource = (dataSource) => {
    return canUserPerform(currentUser, 'update', dataSource);
  };

  const canDeleteDataSource = (dataSource) => {
    return canUserPerform(currentUser, 'delete', dataSource);
  };

  const handleModalVisibility = () => {
    setSelectedDataSource(null);
    setEditing(false);
    toggleDataSourceManagerModal(true);
  };

  useEffect(() => {
    if (!canCreateDataSource()) {
      navigate('/');
    }
  }, []);

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
      canCreateDataSource,
      canDeleteDataSource,
      canUpdateDataSource,
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
