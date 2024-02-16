import React from 'react';
import CustomAvatar from '../CustomAvatar';
import SolidIcon from '../Icon/solidIcons/index';
import { Tooltip } from 'react-tooltip';
import { ButtonSolid } from '../AppButton/AppButton';
import Skeleton from 'react-loading-skeleton';

const WORKSPACE_STATUS = {
  ARCHIVED: 'archived',
  ACTIVE: 'active',
};

const WorkspaceListingTable = ({
  workspaces,
  unArchiveWorkspace,
  archiveWorkspace,
  openOrganizationNew,
  currentTab,
  currentOrganizationId,
  singleActiveWorkspace,
  isLoading,
  darkMode,
}) => {
  return (
    <div class="ws-list-table">
      <div class="worspace-list-table-body-header">
        <p class="font-weight-500 tj-text-xsm" data-cy="name-header">
          Workspace name
        </p>
      </div>
      <table class="manage-ws-table-body">
        {!isLoading ? (
          <tbody>
            {workspaces.length > 0 &&
              workspaces.map((workspace, index) => (
                <tr class="workspace-table-row" data-cy="table" key={`ws_row_${index}`}>
                  <td key={`ws_name_${index}`} className="ws-name">
                    <div class="d-flex align-bottom">
                      <CustomAvatar
                        text={`${workspace.name ? workspace.name[0] : ''}${
                          workspace.name ? workspace.name[1].toLowerCase() : ''
                        }`}
                      />
                      <span
                        className="mx-3 tj-text-sm d-flex align-items-center "
                        data-cy={`${workspace.name.toLowerCase().replace(/\s+/g, '-')}-workspace`}
                      >
                        {workspace.name}
                        {currentOrganizationId == workspace.id && (
                          <div className="current-workspace-tag">Current workspace</div>
                        )}
                      </span>
                    </div>
                  </td>
                  <td key={`ws_open_${index}`} className="open-button-cont">
                    {workspace.status === WORKSPACE_STATUS.ACTIVE && (
                      <div>
                        <ButtonSolid
                          className="workspace-open-btn"
                          disabled={false}
                          data-tooltip-id="tooltip-for-open-new-ws"
                          data-tooltip-content="Open workspace in new tab"
                          leftIcon="open"
                          fill={darkMode ? '#9ba1a6' : '#000000'}
                          iconWidth="17"
                          onClick={() => {
                            openOrganizationNew({ organizationId: workspace.id, slug: workspace.slug });
                          }}
                          data-cy="button-user-status-change"
                        ></ButtonSolid>
                        <Tooltip id="tooltip-for-open-new-ws" place="bottom" className="tooltip" />
                      </div>
                    )}
                  </td>
                  <td key={`status_but_${index}`} className="archive-btn-cont">
                    <ButtonSolid
                      style={{ minWidth: '100px' }}
                      className={`${
                        workspace.status == WORKSPACE_STATUS.ACTIVE ? 'workspace-archive-btn' : 'workspace-active-btn'
                      } tj-text-xsm`}
                      disabled={workspace.status == WORKSPACE_STATUS.ACTIVE && singleActiveWorkspace}
                      data-tooltip-id={singleActiveWorkspace ? 'single-active-tooltip' : ''}
                      data-tooltip-content={
                        singleActiveWorkspace ? 'There must be atleast one active workspace all the time' : ''
                      }
                      leftIcon="archive"
                      fill={
                        singleActiveWorkspace
                          ? '#8f8f8f'
                          : workspace.status === WORKSPACE_STATUS.ACTIVE
                          ? '#E54D2E'
                          : '#8f8f8f'
                      }
                      iconWidth="12"
                      onClick={() => {
                        workspace.status === WORKSPACE_STATUS.ARCHIVED
                          ? unArchiveWorkspace(workspace.id, WORKSPACE_STATUS.ACTIVE, workspace.name)
                          : !singleActiveWorkspace && archiveWorkspace(workspace.id, workspace.name);
                      }}
                      data-cy="button-ws-status-change"
                    >
                      {workspace.status === WORKSPACE_STATUS.ACTIVE ? 'Archive' : 'Unarchive'}
                    </ButtonSolid>
                    {singleActiveWorkspace && (
                      <Tooltip
                        style={{ maxWidth: '250px' }}
                        id="single-active-tooltip"
                        place="bottom"
                        className="tooltip"
                      />
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        ) : (
          <tbody className="w-100 h-auto">
            {Array.from(Array(4)).map((_item, index) => (
              <tr key={index}>
                <td className="col-2 p-3">
                  <div className="d-flex align-items-center">
                    <Skeleton circle="15%" className="col-auto" style={{ width: '35px', height: '35px' }} />
                    <Skeleton className="mx-3" width={100} />
                  </div>
                </td>
                <td className="col-4 p-3">
                  <Skeleton />
                </td>
                {workspaces && workspaces[0]?.status ? (
                  <td className="col-2 p-3">
                    <Skeleton />
                  </td>
                ) : (
                  <td className="text-muted col-auto col-1 pt-3">
                    <Skeleton />
                  </td>
                )}
                <td className="text-muted col-auto col-1 pt-3">
                  <Skeleton />
                </td>

                <td className="text-muted col-auto col-1 pt-3">
                  <Skeleton />
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
      {workspaces.length === 0 && !isLoading && (
        <div
          class={`row ws-empty-icon  d-flex  align-items-center justify-content-center ${darkMode ? 'dark-mode' : ''} `}
        >
          <SolidIcon name={darkMode ? 'danger-dark' : 'danger'} />
          <p> No {currentTab === WORKSPACE_STATUS.ACTIVE ? 'active' : 'archived'} workspace</p>
        </div>
      )}
    </div>
  );
};

export default WorkspaceListingTable;
