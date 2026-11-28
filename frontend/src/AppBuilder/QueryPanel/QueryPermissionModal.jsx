import React from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import AppPermissionsModal from '@/modules/Appbuilder/components/AppPermissionsModal';
import { appPermissionService } from '@/_services';

// Hosted by AppBuilder so "Query permission" works from the query list and the query editor
// header alike, whether or not the left Queries panel is open.
export const QueryPermissionModal = ({ darkMode }) => {
  const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
  const licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const showQueryPermissionModal = useStore((state) => state.queryPanel.showQueryPermissionModal);
  const toggleQueryPermissionModal = useStore((state) => state.queryPanel.toggleQueryPermissionModal);
  const dataQueries = useStore((state) => state.dataQuery.queries.modules.canvas);
  const setQueries = useStore((state) => state.dataQuery.setQueries);

  if (!licenseValid) return null;

  return (
    <AppPermissionsModal
      modalType="query"
      resourceId={selectedQuery?.id}
      resourceName={selectedQuery?.name}
      showModal={showQueryPermissionModal}
      toggleModal={toggleQueryPermissionModal}
      darkMode={darkMode}
      fetchPermission={(id, appId) => appPermissionService.getQueryPermission(appId, id)}
      createPermission={(id, appId, body) => appPermissionService.createQueryPermission(appId, id, body)}
      updatePermission={(id, appId, body) => appPermissionService.updateQueryPermission(appId, id, body)}
      deletePermission={(id, appId) => appPermissionService.deleteQueryPermission(appId, id)}
      onSuccess={(data) => {
        const permissions = data.length === 0 || data.length === undefined ? [] : [data[0]];
        setQueries(dataQueries.map((query) => (query.id === selectedQuery.id ? { ...query, permissions } : query)));
      }}
    />
  );
};

export default QueryPermissionModal;
