import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components';
const BaseWorkspaceActions = ({
  workspacesLimit = null,
  super_admin = false,
  handleAddWorkspace,
  LicenseTooltip = DefaultLicenseTooltip,
  ManageWorkspaceComponent = () => null,
  ...props
}) => {
  //If License ToolTip component is not passed from version specific component--> We will show normal ToolTip component
  const isDefaultLicenseTooltip = LicenseTooltip === DefaultLicenseTooltip;
  const isAllowPersonalWorkspace = window.public_config?.ALLOW_PERSONAL_WORKSPACE === 'true';

  return (
    <div
      className="d-flex"
      style={{ gap: '10px', marginLeft: super_admin && !isDefaultLicenseTooltip ? '0px' : '20px' }}
    >
      <ManageWorkspaceComponent super_admin={super_admin} />
      {isDefaultLicenseTooltip || workspacesLimit === undefined || workspacesLimit === null ? (
        <ToolTip message={'Add new workspace'} position="top">
          <div className="col-1" style={{ paddingRight: '24px' }} onClick={handleAddWorkspace}>
            <SolidIcon name="plus" fill="var(--icon-strong)" className="" dataCy="add-new-workspace-link" width="15" />
          </div>
        </ToolTip>
      ) : (
          (isAllowPersonalWorkspace || super_admin) && (
            <LicenseTooltip
              limits={workspacesLimit}
              feature={'workspaces'}
              placement="top"
              customTitle="Add new workspace"
              isAvailable={true}
            >
              <div
                disabled={!workspacesLimit.canAddUnlimited && workspacesLimit?.percentage >= 100}
                onClick={handleAddWorkspace}
                style={{ marginLeft: super_admin ? '0px' : '10px' }}
              >
                <SolidIcon name="plus" fill="var(--icon-strong)" dataCy="add-new-workspace-link" width="17" />
              </div>
            </LicenseTooltip>
          )
      )}
    </div>
  );
};
const DefaultLicenseTooltip = () => null;

export default BaseWorkspaceActions;
