import React from 'react';
import '../../../resources/styles/group-permissions.styles.scss';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { RESOURCE_TYPE } from '../../../index';

function AddResourcePermissionsMenu({
  openAddPermissionModal,
  resourcesOptions,
  currentGroupPermission,
  darkMode,
  isBasicPlan,
}) {
  const selectResourceIcon = (resourceType) => {
    switch (resourceType) {
      case RESOURCE_TYPE.APPS:
        return 'apps';
      case RESOURCE_TYPE.WORKFLOWS:
        return 'workflows';
      case RESOURCE_TYPE.DATA_SOURCES:
        return 'datasource';
      default:
        return '';
    }
  };

  const resourceNameMapping = {
    [RESOURCE_TYPE.APPS]: 'Apps',
    [RESOURCE_TYPE.WORKFLOWS]: 'Workflows',
    [RESOURCE_TYPE.DATA_SOURCES]: 'Data source',
  };

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
                leftIcon={selectResourceIcon(resource)}
                onClick={() => {
                  openAddPermissionModal(resource);
                }}
                disabled={currentGroupPermission.name === 'end-user' && resource === RESOURCE_TYPE.DATA_SOURCES}
              >
                <OverlayTrigger
                  key={index}
                  placement="right"
                  overlay={
                    currentGroupPermission.name === 'end-user' && resource === RESOURCE_TYPE.DATA_SOURCES ? (
                      <Tooltip id={`tooltip-${index}`} style={{ maxWidth: '120px' }}>
                        End-user cannot access data sources
                      </Tooltip>
                    ) : (
                      <></>
                    )
                  }
                >
                  <span>{resourceNameMapping[resource]}</span>
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
          openAddPermissionModal(RESOURCE_TYPE.APPS);
        }}
        data-cy="add-apps-buton"
      >
        Add apps
      </ButtonSolid>
    </div>
  );
}

export default AddResourcePermissionsMenu;
