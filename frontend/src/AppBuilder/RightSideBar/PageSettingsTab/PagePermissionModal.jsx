import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import AppPermissionsModal from '@/modules/Appbuilder/components/AppPermissionsModal';
import { appPermissionService } from '@/_services';

// Hosted by AppBuilder so "Page permission" in the Edit page header works whether or not the
// Pages panel is open, and only one copy of the modal is ever mounted.
export const PagePermissionModal = ({ darkMode }) => {
  const permissionPage = useStore((state) => state.pagePermissionTarget);
  const showPagePermissionModal = useStore((state) => state.showPagePermissionModal);
  const togglePagePermissionModal = useStore((state) => state.togglePagePermissionModal);
  const updatePageWithPermissions = useStore((state) => state.updatePageWithPermissions);
  const appPagePermissionEnabled = useStore((state) => state.license?.featureAccess?.appPermissionPages);

  if (!appPagePermissionEnabled) return null;

  return (
    <AppPermissionsModal
      modalType="page"
      resourceId={permissionPage?.id}
      resourceName={permissionPage?.name}
      showModal={showPagePermissionModal}
      toggleModal={togglePagePermissionModal}
      darkMode={darkMode}
      fetchPermission={(id, appId) => appPermissionService.getPagePermission(appId, id)}
      createPermission={(id, appId, body) => appPermissionService.createPagePermission(appId, id, body)}
      updatePermission={(id, appId, body) => appPermissionService.updatePagePermission(appId, id, body)}
      deletePermission={(id, appId) => appPermissionService.deletePagePermission(appId, id)}
      onSuccess={(data) => updatePageWithPermissions(permissionPage?.id, data)}
    />
  );
};

export default PagePermissionModal;
