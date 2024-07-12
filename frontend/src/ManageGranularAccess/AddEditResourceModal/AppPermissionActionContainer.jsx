import React from 'react';
import '../../ManageGroupPermissionsV2/groupPermissions.theme.scss';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

function AppPermissionsActions({
  handleClickEdit,
  handleClickView,
  handleHideFromDashboard,
  disableBuilderLevelUpdate,
  initialPermissionState,
}) {
  return (
    <div className="type-container">
      <div className="left-container">
        <OverlayTrigger
          overlay={
            disableBuilderLevelUpdate ? (
              <Tooltip id="tooltip-disable-edit-update">End-user cannot have edit permission</Tooltip>
            ) : (
              <span></span>
            )
          }
          placement="left"
        >
          <label className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              disabled={disableBuilderLevelUpdate}
              checked={initialPermissionState.canEdit}
              onClick={() => {
                !initialPermissionState.canEdit && handleClickEdit();
              }}
            />

            <div>
              <span
                className="form-check-label"
                style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}
              >
                Edit
              </span>
              <span className="tj-text-xsm" style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}>
                Access to app builder
              </span>
            </div>
          </label>
        </OverlayTrigger>
      </div>
      <div className="right-container">
        <label className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            disabled={disableBuilderLevelUpdate}
            checked={initialPermissionState.canView}
            onClick={() => {
              !initialPermissionState.canView && handleClickView();
            }}
          />
          <div>
            <span
              className="form-check-label"
              style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}
            >
              View
            </span>
            <span className="tj-text-xsm" style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}>
              Only access released version of apps
            </span>
          </div>
        </label>
        <label className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="checkbox"
            disabled={!initialPermissionState.canView}
            checked={initialPermissionState.hideFromDashboard}
            onClick={() => {
              handleHideFromDashboard();
            }}
          />
          <div>
            <span className={`form-check-label`}>Hide from dashboard</span>
            <span className="tj-text-xsm">App will be accessible by URL only</span>
          </div>
        </label>
      </div>
    </div>
  );
}

export default AppPermissionsActions;
