import React from 'react';
import '@/modules/WorkspaceSettings/pages/Groups/resources/styles/group-permissions.styles.scss';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { components as SelectComponents } from 'react-select';
import { EnvironmentSelect } from '@/_ui/Modal/EnvironmentSelect';

const ALL_ENVIRONMENTS_VALUE = [{ label: 'All environments', value: '*', isAllField: true }];

const AllEnvironmentsMultiValue = (props) => (
  <SelectComponents.MultiValue {...props}>
    <div className="selected-value">{props.data.label}</div>
  </SelectComponents.MultiValue>
);

// Generic 3-tier (edit container / edit items / view items) permission radio group used for
// container-style resources (Folders, Workflow folders, ...). Parametrized with labels/helper
// text and the state slice key so it can be reused across resource types without duplicating
// the JSX structure defined in FolderPermissionActionContainer.
function ContainerFolderPermissionActionContainer({
  updateParentState,
  disableBuilderLevelUpdate,
  initialPermissionState,
  stateKey,
  dataCyPrefix,
  editContainerLabel,
  editContainerHelperText,
  editItemsLabel,
  editItemsHelperText,
  viewItemsLabel,
  viewItemsHelperText,
  environmentTooltipText,
}) {
  // Permission hierarchy: canEditFolder > canEditApps > canViewApps
  // Radio button approach: only the selected permission is stored as true
  // Implied permissions are derived at runtime by the backend
  const handleClickEditContainer = () => {
    updateParentState((_prevState) => ({
      [stateKey]: {
        canEditFolder: true,
        canEditApps: false,
        canViewApps: false,
      },
    }));
  };

  const handleClickEditItems = () => {
    updateParentState((_prevState) => ({
      [stateKey]: {
        canEditFolder: false,
        canEditApps: true,
        canViewApps: false,
      },
    }));
  };

  const handleClickViewItems = () => {
    updateParentState((_prevState) => ({
      [stateKey]: {
        canEditFolder: false,
        canEditApps: false,
        canViewApps: true,
      },
    }));
  };

  // Determine current permission level for radio button selection
  const getCurrentPermissionLevel = () => {
    if (initialPermissionState?.canEditFolder) return 'canEditFolder';
    if (initialPermissionState?.canEditApps) return 'canEditApps';
    return 'canViewApps';
  };

  const currentLevel = getCurrentPermissionLevel();

  return (
    <>
      <div className="type-container flex-column permission-vertical-list">
        {/* Edit container - full width row */}
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
                checked={currentLevel === 'canEditFolder'}
                onClick={() => {
                  currentLevel !== 'canEditFolder' && handleClickEditContainer();
                }}
                data-cy={`${dataCyPrefix}-edit-folder-permission-radio`}
              />

              <div>
                <span
                  className="form-check-label"
                  style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}
                  data-cy={`${dataCyPrefix}-edit-folder-permission-label`}
                >
                  {editContainerLabel}
                </span>
                <span
                  className="tj-text-xsm"
                  style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}
                  data-cy={`${dataCyPrefix}-edit-folder-permission-helper-text`}
                >
                  {editContainerHelperText}
                </span>
              </div>
            </label>
          </OverlayTrigger>
        </div>
        {/* Edit items and View items - side by side on same row */}
        <div className="permission-item">
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
            <label className="form-check form-check-inline w-100">
              <input
                className="form-check-input"
                type="radio"
                disabled={disableBuilderLevelUpdate}
                checked={currentLevel === 'canEditApps'}
                onClick={() => {
                  currentLevel !== 'canEditApps' && handleClickEditItems();
                }}
                data-cy={`${dataCyPrefix}-edit-apps-permission-radio`}
              />
              <div>
                <span
                  className="form-check-label"
                  style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}
                  data-cy={`${dataCyPrefix}-edit-apps-permission-label`}
                >
                  {editItemsLabel}
                </span>
                <span
                  className="tj-text-xsm"
                  style={{ color: disableBuilderLevelUpdate ? 'var(--text-disabled)' : '' }}
                  data-cy={`${dataCyPrefix}-edit-apps-permission-helper-text`}
                >
                  {editItemsHelperText}
                </span>
              </div>
            </label>
          </OverlayTrigger>
        </div>
        <div className="permission-item">
          <label className="form-check form-check-inline w-100">
            <input
              className="form-check-input"
              type="radio"
              checked={currentLevel === 'canViewApps'}
              onClick={() => {
                currentLevel !== 'canViewApps' && handleClickViewItems();
              }}
              data-cy={`${dataCyPrefix}-view-apps-permission-radio`}
            />
            <div>
              <span className="form-check-label" data-cy={`${dataCyPrefix}-view-apps-permission-label`}>
                {viewItemsLabel}
              </span>
              <span className="tj-text-xsm" data-cy={`${dataCyPrefix}-view-apps-permission-helper-text`}>
                {viewItemsHelperText}
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="form-group mt-3" data-cy="environment-selection-container">
        <div
          className="coming-soon-wrapper"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row',
            width: '100%',
          }}
        >
          <label className="form-label disabled bold-text" data-cy="environment-label">
            Environment
          </label>
          <span
            className="coming-soon-text"
            data-cy="coming-soon-chip"
            style={{
              fontSize: '10px',
              lineHeight: '12px',
              color: 'var(--text-accent, #4368E3)',
              background: 'var(--background-accent-weak)',
              padding: '0px 6px',
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '4px !important',
            }}
          >
            Coming Soon
          </span>
        </div>
        <OverlayTrigger
          overlay={
            <Tooltip id="tooltip-folder-env-coming-soon" style={{ maxWidth: '200px' }}>
              {environmentTooltipText}
            </Tooltip>
          }
          placement="left"
        >
          <div>
            <EnvironmentSelect
              value={ALL_ENVIRONMENTS_VALUE}
              onChange={() => {}}
              disabled={true}
              components={{ MultiValue: AllEnvironmentsMultiValue }}
              data-cy="environment-select"
            />
          </div>
        </OverlayTrigger>
      </div>
    </>
  );
}

ContainerFolderPermissionActionContainer.defaultProps = {
  stateKey: 'initialPermissionStateFolder',
  dataCyPrefix: 'folder',
  editContainerLabel: 'Edit folder',
  editContainerHelperText: 'Rename the folder, add, remove and edit apps in the folder',
  editItemsLabel: 'Edit apps',
  editItemsHelperText: 'Edit apps in the folder',
  viewItemsLabel: 'View apps',
  viewItemsHelperText: 'View apps in the folder',
  environmentTooltipText: 'Environment selection for folder permissions is coming soon',
};

export default ContainerFolderPermissionActionContainer;
