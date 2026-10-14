import React, { useState } from 'react';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import { authenticationService, organizationService } from '@/_services';
import { ToolTip } from '@/_components';
import { decodeEntities } from '@/_helpers/utils';
import { CreateOrganization } from '@/modules/common/components/OrganizationManager';
import WorkspaceActions from '@/modules/dashboard/components/WorkspaceActions';
import { useLicenseStore } from '@/_stores/licenseStore';
import { getLimitState } from '@/modules/common/helpers/limitGating';

function BaseWorkspaceDropDown({ ...props }) {
  const workspacesLimit = props.workspacesLimit;
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const { super_admin } = authenticationService.currentSessionValue;
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const Menu = (menuProps) => {
    return (
      <components.Menu {...menuProps}>
        <div
          className={`org-dropdown-shadow ${darkMode && 'dark-theme'}`}
          style={{ paddingTop: '4px', paddingBottom: '4px' }}
        >
          <div className="org-custom-select-header-wrap" style={{ padding: '8px 12px' }}>
            <div className="row cursor-pointer d-flex align-items-center">
              <div className="col-9 select-header-font" data-cy="workspace-count">
                Workspaces ({menuProps.options.length})
              </div>
              <div className="col-3">
                <WorkspaceActions
                  super_admin={super_admin}
                  workspacesLimit={workspacesLimit}
                  handleAddWorkspace={handleAddWorkspace}
                />
              </div>
            </div>
          </div>
          <div className={`${darkMode && 'dark-theme'}`}>{menuProps.children}</div>
        </div>
      </components.Menu>
    );
  };

  const SingleValue = ({ selectProps }) => (
    <ToolTip message={selectProps?.value?.name}>
      <div className="d-inline-flex align-items-center">
        <div data-cy="workspace-name" className="tj-text-xsm">
          {decodeEntities(selectProps.value.name)}
        </div>
      </div>
    </ToolTip>
  );
  // Re-check the plan limit on click so the decision uses fresh counts. At the limit, the
  // limit-reached modal opens instead of the create form.
  const handleAddWorkspace = async () => {
    const limit = await organizationService
      .getWorkspacesLimit()
      .then((data) => data?.workspacesCount)
      .catch(() => workspacesLimit);
    if (getLimitState(limit).reached) {
      useLicenseStore.getState().actions.openLimitReached({ resource: 'workspaces', limit });
      return;
    }
    setShowCreateOrg(true);
  };

  return (
    <>
      <CreateOrganization
        showCreateOrg={showCreateOrg}
        setShowCreateOrg={setShowCreateOrg}
        workspacesLimit={workspacesLimit}
      />
      <Select
        className={`react-select-container ${darkMode && 'dark-theme'}`}
        width={'262px'}
        hasSearch={false}
        components={{ Menu, SingleValue }}
        setShowCreateOrg={setShowCreateOrg}
        workspacesLimit={workspacesLimit}
        styles={{ border: 0, cursor: 'pointer' }}
        {...props}
      />
    </>
  );
}

export default BaseWorkspaceDropDown;
