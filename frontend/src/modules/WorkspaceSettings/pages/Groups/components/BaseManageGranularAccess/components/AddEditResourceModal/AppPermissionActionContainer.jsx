import React from 'react';
import '../../../../resources/styles/group-permissions.styles.scss';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { EnvironmentSelect } from '@/_ui/Modal/EnvironmentSelect';

function AppPermissionsActions({
  handleClickEdit,
  handleClickView,
  handleHideFromDashboard,
  disableBuilderLevelUpdate,
  initialPermissionState,
  selectedEnvironments,
  setSelectedEnvironments,
  groupName,
  isBuilderLevel,
  hasEndUsers,
}) {
  return (
    <>
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
                data-cy="edit-permission-radio"
              />

              <div>
                <span
                  className="form-check-label"
                  style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}
                  data-cy="edit-permission-label"
                >
                  Edit
                </span>
                <span
                  className="tj-text-xsm"
                  style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}
                  data-cy="edit-permission-info-text"
                >
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
              data-cy="view-permission-radio"
            />
            <div>
              <span
                className="form-check-label"
                style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}
                data-cy="view-permission-label"
              >
                View
              </span>
              <span
                className="tj-text-xsm"
                style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}
                data-cy="view-permission-info-text"
              >
                Access preview & released versions of apps
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
              data-cy="hide-from-dashboard-permission-input"
            />
            <div>
              <span className={`form-check-label`} data-cy="hide-from-dashboard-permission-label">
                Hide from dashboard
              </span>
              <span className="tj-text-xsm" data-cy="hide-from-dashboard-permission-info-text">
                App will be accessible by URL only
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="form-group mt-3" data-cy="environment-selection-container">
        <label className="form-label bold-text" data-cy="environment-label">
          Environment
        </label>
        <EnvironmentSelect
          value={selectedEnvironments}
          onChange={setSelectedEnvironments}
          allowSelectAll={true}
          groupName={groupName}
          isBuilderLevel={isBuilderLevel}
          hasEndUsers={hasEndUsers}
          data-cy="environment-select"
        />
      </div>
    </>
  );
}

export default AppPermissionsActions;
