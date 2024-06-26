import React, { useEffect } from 'react';
import GroupChipTD from '@/ManageGroupPermissionsV2/ResourceChip';
import '../ManageGroupPermissionsV2/groupPermissions.theme.scss';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

function AppResourcePermissions({
  updateOnlyGranularPermissions,
  permissions,
  currentGroupPermission,
  openEditPermissionModal,
}) {
  console.log('Logging permissions');
  console.log(permissions);
  const isRoleGroup = currentGroupPermission.name == 'admin';
  const disableEditUpdate = currentGroupPermission.name == 'end-user';
  const appsPermissions = permissions.appsGroupPermissions;
  let apps = appsPermissions?.groupApps?.map((app) => {
    return app?.app?.name;
  });
  if (apps.length == 0 || permissions.isAll) apps = ['All apps'];

  return (
    <div className="manage-resource-permission">
      <div className="resource-name">
        <SolidIcon name="app" width="20px" className="resource-icon" />
        <div className="resource-text">{permissions.name}</div>
      </div>
      <div className="text-muted">
        <div className="d-flex apps-permission-wrap flex-column">
          <label className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              onClick={() => {
                updateOnlyGranularPermissions(permissions, {
                  canEdit: !appsPermissions.canEdit,
                });
              }}
              checked={appsPermissions.canEdit}
              disabled={isRoleGroup || disableEditUpdate}
              data-cy="app-create-checkbox"
            />
            <span className="form-check-label" data-cy="app-create-label">
              {'Edit'}
            </span>
            {/* <span class={`text-muted tj-text-xxsm ${isRoleGroup && 'check-label-disable'}`}>Create apps in this workspace</span> */}
            <span class={`text-muted tj-text-xxsm`}>Access to app builder</span>
          </label>
          <label className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              onClick={() => {
                updateOnlyGranularPermissions(permissions, {
                  canView: !appsPermissions.canView,
                });
              }}
              checked={appsPermissions.canView}
              disabled={isRoleGroup || disableEditUpdate}
              data-cy="app-delete-checkbox"
            />
            <span className="form-check-label" data-cy="app-delete-label">
              {'View'}
            </span>
            <span class={`text-muted tj-text-xxsm`}>Only view released version of app</span>
          </label>
          <label className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              onChange={() => {
                updateOnlyGranularPermissions(permissions, {
                  hideFromDashboard: !appsPermissions.hideFromDashboard,
                });
              }}
              checked={appsPermissions.hideFromDashboard}
              disabled={isRoleGroup}
              data-cy="app-delete-checkbox"
            />
            <span className="form-check-label" data-cy="app-delete-label">
              {'Hide from dashbaord'}
            </span>
            <span class={`text-muted tj-text-xxsm`}>App will be accessible by URL only</span>
          </label>
        </div>
      </div>
      <div>
        <GroupChipTD groups={apps} />
      </div>
      <div className="edit-icon-container">
        <ButtonSolid
          leftIcon="editrectangle"
          className="edit-permission-custom"
          iconWidth="14"
          onClick={() => {
            openEditPermissionModal(permissions);
          }}
          disabled={isRoleGroup}
        />
      </div>
    </div>
  );
}

export default AppResourcePermissions;
