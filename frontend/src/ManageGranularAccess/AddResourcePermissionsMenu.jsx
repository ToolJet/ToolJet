import React from 'react';
import '../ManageGroupPermissionsV2/groupPermissions.theme.scss';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { OverlayTrigger } from 'react-bootstrap';

function AddResourcePermissionsMenu({ openAddPermissionModal, resourcesOptions, currentGroupPermission }) {
  return resourcesOptions.length > 1 ? (
    <OverlayTrigger
      rootClose={true}
      trigger="click"
      placement={'bottom'}
      overlay={
        <div className={`settings-card tj-text card ${this.props.darkMode && 'dark-theme'}`}>
          <ButtonSolid
            variant="tertiary"
            iconWidth="17"
            fill="var(--slate9)"
            className="apps-remove-btn permission-type remove-decoration tj-text-xsm font-weight-600"
            leftIcon="dashboard"
            onClick={() => {
              openAddPermissionModal();
            }}
          >
            Apps
          </ButtonSolid>
        </div>
      }
    >
      <div className={'cursor-pointer'}>
        <ButtonSolid
          variant="tertiary"
          iconWidth="17"
          fill="var(--slate9)"
          className="add-icon tj-text-xsm font-weight-600"
          leftIcon="plus"
          disabled={currentGroupPermission.name === 'admin'}
        >
          Add permission
        </ButtonSolid>
      </div>
    </OverlayTrigger>
  ) : (
    <div className={'cursor-pointer'}>
      <ButtonSolid
        variant="tertiary"
        iconWidth="17"
        fill="var(--slate9)"
        className="add-icon tj-text-xsm font-weight-600"
        leftIcon="plus"
        disabled={currentGroupPermission.name === 'admin'}
        onClick={() => {
          openAddPermissionModal();
        }}
        data-cy="add-apps-buton"
      >
        Add apps
      </ButtonSolid>
    </div>
  );
}

export default AddResourcePermissionsMenu;
