import React from 'react';
import { ToolTip } from '@/_components/ToolTip';
import { NotificationCenter } from '@/_components/NotificationCenter';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { getPrivateRoute } from '@/_helpers/routes';
import { Link } from 'react-router-dom';
import { SettingsMenu } from '@/modules/dashboard/components';

const BaseLeftNavSideBar = ({
  checkForUnsavedChanges,
  router,
  workflowsEnabled,
  darkMode,
  switchDarkMode,
  admin,
  isBuilder,
  isAuthorizedForGDS,
  canCreateVariableOrConstant,
  featureAccess,
}) => {
  return (
    <div>
      <ul className="sidebar-inner nav nav-vertical">
        <li className="text-center cursor-pointer">
          <ToolTip message="Apps" placement="right">
            <Link
              to={getPrivateRoute('dashboard')}
              onClick={(event) => checkForUnsavedChanges(getPrivateRoute('dashboard'), event)}
              className={`tj-leftsidebar-icon-items  ${
                (router.pathname === '/:workspaceId' || router.pathname === getPrivateRoute('dashboard')) &&
                `current-seleted-route`
              }`}
              data-cy="icon-dashboard"
            >
              <SolidIcon
                name="apps"
                fill={
                  router.pathname === '/:workspaceId' || router.pathname === getPrivateRoute('dashboard')
                    ? '#3E63DD'
                    : 'var(--slate8)'
                }
              />
            </Link>
          </ToolTip>
        </li>
        {workflowsEnabled && (
          <li className="text-center  cursor-pointer" data-cy={`database-icon`}>
            <ToolTip message="Workflows" placement="right">
              <Link
                to={getPrivateRoute('workflows')}
                onClick={(event) => checkForUnsavedChanges(getPrivateRoute('workflows'), event)}
                className={`tj-leftsidebar-icon-items  ${
                  router.pathname === getPrivateRoute('workflows') && `current-seleted-route`
                }`}
                data-cy="icon-workflows"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'fit-content',
                  gap: '4px',
                  padding: '8px',
                }}
              >
                <SolidIcon
                  name="workflows"
                  fill={
                    router.pathname === getPrivateRoute('workflows') && `current-seleted-route`
                      ? '#3E63DD'
                      : darkMode
                      ? '#4C5155'
                      : '#C1C8CD'
                  }
                />
              </Link>
            </ToolTip>
          </li>
        )}
        {(admin || isBuilder) && (
          <li className="text-center  cursor-pointer" data-cy={`database-icon`}>
            <ToolTip message="ToolJet Database" placement="right">
              <Link
                to={getPrivateRoute('database')}
                onClick={(event) => checkForUnsavedChanges(getPrivateRoute('database'), event)}
                className={`tj-leftsidebar-icon-items  ${
                  router.pathname === getPrivateRoute('database') && `current-seleted-route`
                }`}
                data-cy="icon-database"
              >
                <SolidIcon
                  name="table"
                  fill={
                    router.pathname === getPrivateRoute('database') && `current-seleted-route`
                      ? '#3E63DD'
                      : 'var(--slate8)'
                  }
                />
              </Link>
            </ToolTip>
          </li>
        )}

        {/* DATASOURCES */}
        {isAuthorizedForGDS && (
          <li className="text-center cursor-pointer">
            <ToolTip message="Data sources" placement="right">
              <Link
                to={getPrivateRoute('data_sources')}
                onClick={(event) => checkForUnsavedChanges(getPrivateRoute('data_sources'), event)}
                className={`tj-leftsidebar-icon-items  ${
                  router.pathname === getPrivateRoute('data_sources') && `current-seleted-route`
                }`}
                data-cy="icon-global-datasources"
              >
                <SolidIcon
                  name="datasource"
                  fill={router.pathname === getPrivateRoute('data_sources') ? '#3E63DD' : 'var(--slate8)'}
                />
              </Link>
            </ToolTip>
          </li>
        )}
        {canCreateVariableOrConstant() && (
          <li className="text-center cursor-pointer">
            <ToolTip message="Workspace constants" placement="right">
              <Link
                to={getPrivateRoute('workspace_constants')}
                onClick={(event) => checkForUnsavedChanges(getPrivateRoute('workspace_constants'), event)}
                className={`tj-leftsidebar-icon-items  ${
                  router.pathname === getPrivateRoute('workspace_constants') && `current-seleted-route`
                }`}
                data-cy="icon-workspace-constants"
              >
                <SolidIcon
                  name="workspaceconstants"
                  fill={router.pathname === getPrivateRoute('workspace_constants') ? '#3E63DD' : 'var(--slate8)'}
                  width={25}
                  viewBox={'0 0 20 20'}
                />
              </Link>
            </ToolTip>
          </li>
        )}

        <li className="tj-leftsidebar-icon-items-bottom text-center">
          <NotificationCenter darkMode={darkMode} />
          <ToolTip delay={{ show: 0, hide: 0 }} message="Mode" placement="right">
            <Link
              className="cursor-pointer tj-leftsidebar-icon-items"
              onClick={() => switchDarkMode(!darkMode)}
              data-cy="mode-switch-button"
            >
              <SolidIcon name={darkMode ? 'lightmode' : 'darkmode'} fill="var(--slate8)" />
            </Link>
          </ToolTip>
          <SettingsMenu
            featureAccess={featureAccess}
            darkMode={darkMode}
            checkForUnsavedChanges={checkForUnsavedChanges}
          />
        </li>
      </ul>
    </div>
  );
};

export default BaseLeftNavSideBar;
