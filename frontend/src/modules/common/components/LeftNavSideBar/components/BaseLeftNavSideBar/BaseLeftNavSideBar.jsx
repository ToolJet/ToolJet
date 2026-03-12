import React from 'react';
import { Home, Blocks, Workflow, Table2, Puzzle, KeyRound, Moon, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ToolTip } from '@/_components/ToolTip';
import { NotificationCenter } from '@/_components/NotificationCenter';
import { getPrivateRoute } from '@/_helpers/routes';
import { Link } from 'react-router-dom';
import { SettingsMenu } from '@/modules/dashboard/components';

const routeLinkClassName = (isRouteActive) => cn('tj-leftsidebar-icon-items', { active: isRouteActive });

const BaseLeftNavSideBar = ({
  checkForUnsavedChanges,
  router,
  workflowsEnabled,
  showNewHomePage,
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
        {showNewHomePage && (
          <li className="text-center cursor-pointer">
            <ToolTip message="Home" placement="right">
              <Link
                to={getPrivateRoute('home')}
                onClick={(event) => checkForUnsavedChanges(getPrivateRoute('home'), event)}
                className={routeLinkClassName(router.pathname === getPrivateRoute('home'))}
                data-cy="icon-home"
              >
                <Home size={16} />
              </Link>
            </ToolTip>
          </li>
        )}
        <li className="text-center cursor-pointer">
          <ToolTip message="Apps" placement="right">
            <Link
              to={getPrivateRoute('dashboard')}
              onClick={(event) => checkForUnsavedChanges(getPrivateRoute('dashboard'), event)}
              className={routeLinkClassName(
                router.pathname === '/:workspaceId' || router.pathname === getPrivateRoute('dashboard')
              )}
              data-cy="icon-dashboard"
            >
              <Blocks size={16} />
            </Link>
          </ToolTip>
        </li>
        {workflowsEnabled && (
          <li className="text-center  cursor-pointer" data-cy="icon-workflows">
            <ToolTip message="Workflows" placement="right">
              <Link
                to={getPrivateRoute('workflows')}
                onClick={(event) => checkForUnsavedChanges(getPrivateRoute('workflows'), event)}
                className={routeLinkClassName(router.pathname === getPrivateRoute('workflows'))}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'fit-content',
                  gap: '4px',
                  padding: '8px',
                }}
              >
                <Workflow size={16} />
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
                className={routeLinkClassName(router.pathname === getPrivateRoute('database'))}
                data-cy="icon-database"
              >
                <Table2 size={16} />
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
                className={routeLinkClassName(router.pathname === getPrivateRoute('data_sources'))}
                data-cy="icon-global-datasources"
              >
                <Puzzle size={16} />
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
                className={routeLinkClassName(router.pathname === getPrivateRoute('workspace_constants'))}
                data-cy="icon-workspace-constants"
              >
                <KeyRound size={16} />
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
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
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
