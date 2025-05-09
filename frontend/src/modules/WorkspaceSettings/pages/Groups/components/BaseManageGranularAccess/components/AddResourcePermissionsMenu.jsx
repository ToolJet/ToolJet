import React from 'react';
import '../../../resources/styles/group-permissions.styles.scss';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

function AddResourcePermissionsMenu({
  openAddPermissionModal,
  resourcesOptions,
  currentGroupPermission,
  darkMode,
  isBasicPlan,
}) {
  return resourcesOptions.length > 1 ? (
    <OverlayTrigger
      rootClose={true}
      trigger="click"
      placement={'top'}
      overlay={
        <div>
          <div className={`settings-card tj-text card ${darkMode && 'dark-theme'}`}>
            {resourcesOptions.map((resource, index) => (
              <ButtonSolid
                key={index}
                variant="tertiary"
                iconWidth="17"
                fill="var(--slate9)"
                className="apps-remove-btn permission-type remove-decoration tj-text-xsm font-weight-600 remove-disabled-bg"
                leftIcon={resource === 'Apps' ? 'apps' : 'datasource'}
                onClick={() => {
                  openAddPermissionModal(resource);
                }}
                disabled={currentGroupPermission.name === 'end-user' && resource === 'Data Sources'}
              >
                <OverlayTrigger
                  key={index}
                  placement="right"
                  overlay={
                    currentGroupPermission.name === 'end-user' && resource === 'Data Sources' ? (
                      <Tooltip id={`tooltip-${index}`} style={{ maxWidth: '120px' }}>
                        End-user cannot access data sources
                      </Tooltip>
                    ) : (
                      <></>
                    )
                  }
                >
                  <span>{resource === 'Data Sources' ? 'Data source' : resource}</span>
                </OverlayTrigger>
              </ButtonSolid>
            ))}
          </div>
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
          disabled={currentGroupPermission.name === 'admin' || isBasicPlan}
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
        disabled={currentGroupPermission.name === 'admin' || isBasicPlan}
        onClick={() => {
          openAddPermissionModal('Apps');
        }}
        data-cy="add-apps-buton"
      >
        Add apps
      </ButtonSolid>
    </div>
  );
}

export default AddResourcePermissionsMenu;
