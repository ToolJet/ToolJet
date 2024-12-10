import React, { useState } from 'react';
import GroupChipTD from '@/ManageGroupPermissionsV2/ResourceChip';
import '../ManageGroupPermissionsV2/groupPermissions.theme.scss';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import OverflowTooltip from '@/_components/OverflowTooltip';
function AppResourcePermissions({
  updateOnlyGranularPermissions,
  permissions,
  currentGroupPermission,
  openEditPermissionModal,
}) {
  const [onHover, setHover] = useState(false);
  const [notClickable, setNotClickable] = useState(false);
  const isRoleGroup = currentGroupPermission.name == 'admin';
  const disableEditUpdate = currentGroupPermission.name == 'end-user';
  const appsPermissions = permissions.appsGroupPermissions;
  let apps = appsPermissions?.groupApps?.map((app) => {
    return app?.app?.name;
  });
  if (permissions.isAll) apps = ['All apps'];

  return (
    <div
      className="manage-resource-permission"
      data-cy="granular-access-permission"
      onMouseEnter={() => {
        setHover(true);
      }}
      onMouseLeave={() => {
        setHover(false);
      }}
      onClick={() => {
        !isRoleGroup && !notClickable && openEditPermissionModal(permissions);
      }}
    >
      <div className="resource-name d-flex">
        <SolidIcon name="app" width="20px" className="resource-icon" />

        <div className="resource-text" data-cy={`${permissions.name.toLowerCase().replace(/\s+/g, '-')}-text`}>
          <OverflowTooltip width={160}>{`  ${permissions.name}`}</OverflowTooltip>
        </div>
      </div>

      <div className="text-muted">
        <div className="d-flex apps-permission-wrap flex-column">
          <OverlayTrigger
            overlay={
              disableEditUpdate ? (
                <Tooltip id="tooltip-disable-edit-update">End-user cannot have edit permission</Tooltip>
              ) : (
                <span></span>
              )
            }
            placement="top"
          >
            <div
              onMouseEnter={() => {
                setNotClickable(true);
              }}
              onMouseLeave={() => {
                setNotClickable(false);
              }}
            >
              <label className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  onClick={() => {
                    !appsPermissions.canEdit &&
                      updateOnlyGranularPermissions(permissions, {
                        canEdit: !appsPermissions.canEdit,
                        canView: appsPermissions.canEdit,
                        ...(!appsPermissions.canEdit && { hideFromDashboard: false }),
                      });
                  }}
                  checked={appsPermissions.canEdit}
                  disabled={isRoleGroup || disableEditUpdate}
                  data-cy="app-edit-radio"
                />
                <span className="form-check-label" data-cy="app-edit-label">
                  {'Edit'}
                </span>
                {/* <span class={`text-muted tj-text-xxsm ${isRoleGroup && 'check-label-disable'}`}>Create apps in this workspace</span> */}
                <span class={`tj-text-xxsm`} data-cy="app-edit-helper-text">
                  Access to app builder
                </span>
              </label>
            </div>
          </OverlayTrigger>
          <div
            onMouseEnter={() => {
              setNotClickable(true);
            }}
            onMouseLeave={() => {
              setNotClickable(false);
            }}
          >
            <label className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                onClick={() => {
                  !appsPermissions.canView &&
                    updateOnlyGranularPermissions(permissions, {
                      canView: !appsPermissions.canView,
                      canEdit: appsPermissions.canView,
                    });
                }}
                checked={appsPermissions.canView}
                disabled={isRoleGroup || disableEditUpdate}
                data-cy="app-view-radio"
              />
              <span className="form-check-label" data-cy="app-view-label">
                {'View'}
              </span>
              <span class={`tj-text-xxsm`} data-cy="app-view-helper-text">
                Only access released version of apps
              </span>
            </label>
          </div>
          <div
            onMouseEnter={() => {
              setNotClickable(true);
            }}
            onMouseLeave={() => {
              setNotClickable(false);
            }}
          >
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
                disabled={isRoleGroup || !appsPermissions.canView}
                data-cy="app-hide-from-dashboard-radio"
              />
              <span className="form-check-label" data-cy="app-hide-from-dashboard-label">
                {'Hide from dashbaord'}
              </span>
              <span class={`tj-text-xxsm`} data-cy="app-hide-from-dashboard-helper-text">
                App will be accessible by URL only
              </span>
            </label>
          </div>
        </div>
      </div>
      <div>
        <GroupChipTD groups={apps} />
      </div>
      <div className="edit-icon-container">
        {onHover && (
          <ButtonSolid
            leftIcon="editrectangle"
            className="edit-permission-custom"
            iconWidth="14"
            onClick={() => {
              openEditPermissionModal(permissions);
            }}
            disabled={isRoleGroup}
            data-cy="edit-permission-button"
          />
        )}
      </div>
    </div>
  );
}

export default AppResourcePermissions;
