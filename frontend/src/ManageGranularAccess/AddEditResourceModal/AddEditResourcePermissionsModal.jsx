import React from 'react';
import '../../ManageGroupPermissionsV2/groupPermissions.theme.scss';
import ModalBase from '@/_ui/Modal';
import { AppsSelect } from '@/_ui/Modal/AppsSelect';
import AppPermissionsActions from './AppPermissionActionContainer';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

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
  const errors = currentState?.errors;
  const isAll = currentState?.isAll;

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
        <label className="form-label bold-text" data-cy="permission-label">
          Permission
        </label>
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
              <span className="form-check-label" data-cy="all-apps-label">
                All apps
              </span>
              <span className="tj-text-xsm" data-cy="all-apps-info-text">
                This will select all apps in the workspace including any new apps created
              </span>
            </div>
          </label>
          <OverlayTrigger
            overlay={
              disableBuilderLevelUpdate || resourceType === '' || groupName === 'builder' ? (
                <Tooltip id="tooltip-disable-edit-update">Use custom groups to select custom resources</Tooltip>
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
                  Select specific applications you want to add to the group
                </span>
              </div>
            </label>
          </OverlayTrigger>
          <AppsSelect
            disabled={!isCustom}
            allowSelectAll={true}
            value={selectedApps}
            onChange={setSelectedApps}
            options={addableApps}
            data-value="test"
          />
        </div>
      </div>
    </ModalBase>
  );
}

export default AddEditResourcePermissionsModal;
