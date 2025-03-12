import React from 'react';
import '../../../../resources/styles/group-permissions.styles.scss';
import ModalBase from '@/_ui/Modal';
import { AppsSelect } from '@/_ui/Modal/AppsSelect';
import AppPermissionsActions from './AppPermissionActionContainer';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import DsPermissionsActions from './DataSourcPermissionActionContainer';

function AddEditResourcePermissionsModal({
  handleClose,
  handleConfirm,
  updateParentState,
  resourceType,
  currentState,
  show,
  title,
  confirmBtnProps,
  disableBuilderLevelUpdate,
  selectedApps,
  setSelectedApps,
  addableApps,
  darkMode,
  groupName,
}) {
  const isCustom = currentState?.isCustom;
  const newPermissionName = currentState?.newPermissionName;
  const initialPermissionState = currentState?.initialPermissionState;
  const initialPermissionStateDs = currentState?.initialPermissionStateDs;
  const errors = currentState?.errors;
  const isAll = currentState?.isAll;
  const allResourceText =
    resourceType === 'Apps'
      ? 'This will select all apps in the workspace including any new apps created'
      : 'This will select all data sources in the workspace including any new connections created';
  const allResourceTitle = resourceType === 'Apps' ? 'All apps' : 'All data sources';
  return (
    <ModalBase
      size="md"
      show={show}
      handleClose={handleClose}
      handleConfirm={handleConfirm}
      className="permission-manager-modal"
      title={title}
      confirmBtnProps={confirmBtnProps}
      darkMode={darkMode}
    >
      <div className="form-group mb-3">
        <label className="form-label bold-text" data-cy="permission-name-label">
          Permission name
        </label>
        <div className="tj-app-input">
          <input
            type="text"
            className={`form-control ${newPermissionName?.length == 50 ? 'error-input' : ''}`}
            placeholder={'Eg. Product analytics apps'}
            name="permissionName"
            value={newPermissionName}
            onChange={(e) => {
              let value = e.target.value;
              if (value?.length > 50) {
                value = value.slice(0, 50);
              }
              updateParentState(() => ({
                newPermissionName: value,
              }));
            }}
            data-cy="permission-name-input"
          />
          <span className="text-danger" data-cy="permission-name-error">
            {errors['permissionName']}
          </span>
        </div>
        <div className={`mt-1 tj-text-xxsm ${newPermissionName?.length > 50 ? 'error-text' : ''}`}>
          <div data-cy="permission-name-help-text">Permission name must be unique and max 50 characters</div>
        </div>
      </div>
      {/* Till here */}
      <div className="form-group mb-3">
        <label className="form-label bold-text">Permission</label>
        {resourceType === 'Apps' ? (
          <AppPermissionsActions
            handleClickEdit={() => {
              updateParentState((prevState) => ({
                initialPermissionState: {
                  ...prevState.initialPermissionState,
                  canEdit: !prevState.initialPermissionState.canEdit,
                  canView: prevState.initialPermissionState.canEdit,
                  ...(!prevState.initialPermissionState.canEdit && { hideFromDashboard: false }),
                },
              }));
            }}
            handleClickView={() => {
              updateParentState((prevState) => ({
                initialPermissionState: {
                  ...prevState.initialPermissionState,
                  canView: !prevState.initialPermissionState.canView,
                  canEdit: prevState.initialPermissionState.canView,
                  ...(prevState.initialPermissionState.canEdit && { hideFromDashboard: false }),
                },
              }));
            }}
            handleHideFromDashboard={() => {
              updateParentState((prevState) => ({
                initialPermissionState: {
                  ...initialPermissionState,
                  hideFromDashboard: !prevState.initialPermissionState.hideFromDashboard,
                },
              }));
            }}
            disableBuilderLevelUpdate={disableBuilderLevelUpdate}
            initialPermissionState={initialPermissionState}
          />
        ) : (
          <DsPermissionsActions
            updateParentState={updateParentState}
            disableBuilderLevelUpdate={disableBuilderLevelUpdate}
            initialPermissionStateDs={initialPermissionStateDs}
          />
        )}
      </div>

      <div className="form-group mb-3">
        <label className="form-label bold-text" data-cy="resource-label">
          Resources
        </label>
        <div className="resources-container" data-cy="resources-container">
          <label className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              checked={isAll}
              onClick={() => {
                !isAll && updateParentState((prevState) => ({ isAll: !prevState.isAll, isCustom: !!prevState.isAll }));
              }}
              data-cy="all-apps-radio"
            />
            <div>
              <span className="form-check-label">{allResourceTitle}</span>
              <span className="tj-text-xsm">{allResourceText}</span>
            </div>
          </label>
          <OverlayTrigger
            overlay={
              disableBuilderLevelUpdate || resourceType === '' || groupName === 'builder' ? (
                <Tooltip id="tooltip-disable-edit-update" style={{ maxWidth: '190px' }}>
                  Use custom groups to select custom resources
                </Tooltip>
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
                disabled={addableApps.length === 0 || disableBuilderLevelUpdate || groupName === 'builder'}
                checked={isCustom}
                onClick={() => {
                  !isCustom &&
                    updateParentState((prevState) => ({ isCustom: !prevState.isCustom, isAll: prevState.isCustom }));
                }}
                data-cy="custom-radio"
              />
              <div>
                <span
                  className="form-check-label"
                  style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}
                  data-cy="custom-label"
                >
                  Custom
                </span>
                <span
                  className="tj-text-xsm"
                  style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}
                  data-cy="custom-info-text"
                >
                  Select specific {resourceType === 'Apps' ? 'applications' : 'data sources'} you want to add to the
                  group
                </span>
              </div>
            </label>
          </OverlayTrigger>
          {isCustom && (
            <AppsSelect
              disabled={!isCustom}
              allowSelectAll={true}
              value={selectedApps}
              onChange={setSelectedApps}
              options={addableApps}
              data-value="test"
              resourceType={resourceType}
            />
          )}
        </div>
      </div>
    </ModalBase>
  );
}

export default AddEditResourcePermissionsModal;
