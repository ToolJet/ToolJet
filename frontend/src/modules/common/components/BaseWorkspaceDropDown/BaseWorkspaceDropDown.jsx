import React from 'react';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import { authenticationService } from '@/_services';
import { ToolTip } from '@/_components';
import { decodeEntities } from '@/_helpers/utils';
import WorkspaceActions from '@/modules/dashboard/components/WorkspaceActions';
import LicenseBanner from '@/modules/common/components/LicenseBanner';

function BaseWorkspaceDropDown({ handleAddWorkspace, ...props }) {
  const workspacesLimit = props.workspacesLimit;
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
          <LicenseBanner classes="mb-3 mx-1 small" limits={workspacesLimit} type="workspaces" size="small" />
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

  return (
    <>
      <Select
        className={`react-select-container ${darkMode && 'dark-theme'}`}
        width={'262px'}
        hasSearch={false}
        components={{ Menu, SingleValue }}
        workspacesLimit={workspacesLimit}
        styles={{ border: 0, cursor: 'pointer' }}
        {...props}
      />
    </>
  );
}

export default BaseWorkspaceDropDown;
