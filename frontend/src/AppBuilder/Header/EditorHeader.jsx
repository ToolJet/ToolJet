import React from 'react';
import EditAppName from './EditAppName';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import LogoNavDropdown from '@/modules/Appbuilder/components/LogoNavDropdown';
import HeaderActions from './HeaderActions';
import { VersionManagerDropdown, VersionManagerErrorBoundary } from './VersionManager';
import useStore from '@/AppBuilder/_stores/store';
import RightTopHeaderButtons, { PreviewAndShareIcons } from './RightTopHeaderButtons/RightTopHeaderButtons';
import { ModuleEditorBanner } from '@/modules/Modules/components';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { BranchDropdown } from './BranchDropdown';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import './styles/style.scss';

import SaveIndicator from './SaveIndicator';

export const EditorHeader = ({ darkMode }) => {
  const { moduleId, isModuleEditor } = useModuleContext();
  const { isSaving, saveError, isVersionReleased, appId, organizationId, selectedVersion } = useStore(
    (state) => ({
      isSaving: state.appStore.modules[moduleId].app.isSaving,
      saveError: state.appStore.modules[moduleId].app.saveError,
      isVersionReleased: state.isVersionReleased,
      appId: state.appStore.modules[moduleId].app.appId,
      organizationId: state.appStore.modules[moduleId].app.organizationId,
      selectedVersion: state.selectedVersion,
    }),
    shallow
  );

  const workspaceActiveBranch = useWorkspaceBranchesStore((state) => state.currentBranch);
  const isOnWorkspaceFeatureBranch =
    workspaceActiveBranch && !workspaceActiveBranch.is_default && !workspaceActiveBranch.isDefault;

  return (
    <div className={cx('header', { 'dark-theme theme-dark': darkMode })} style={{ width: '100%' }}>
      <header className="navbar navbar-expand-md d-print-none tw-h-12" style={{ zIndex: 12 }}>
        <div className="container-xl header-container" data-cy="editor-header-section">
          <div className="d-flex w-100 tw-h-9  tw-justify-between">
            <div
              className="header-inner-wrapper d-flex"
              style={{
                width: 'calc(100% - 348px)',
                background: '',
              }}
            >
              <div className="d-flex align-items-center">
                <div
                  className="p-0 m-0 d-flex align-items-center"
                  style={{
                    padding: '0px',
                    width: '100%',
                    justifyContent: 'space-between',
                  }}
                >
                  <div className="global-settings-app-wrapper p-0 m-0 ">
                    <h1 className="navbar-brand d-none-navbar-horizontal p-0 tw-shrink-0" data-cy="editor-page-logo">
                      <LogoNavDropdown darkMode={darkMode} />
                    </h1>
                    <div className="d-flex flex-row tw-mr-1">
                      {isModuleEditor && <ModuleEditorBanner showBeta={true} />}
                      <EditAppName />
                    </div>
                    <div>
                      <span
                        className={cx('autosave-indicator tj-text-xsm', {
                          'autosave-indicator-saving': isSaving,
                          'text-danger': saveError,
                          'd-none': isVersionReleased,
                        })}
                        data-cy="autosave-indicator"
                      >
                        <SaveIndicator isSaving={isSaving} saveError={saveError} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <HeaderActions darkMode={darkMode} />

            <div className="tw-flex tw-flex-row tw-items-center tw-justify-end tw-grow-1 tw-w-full">
              <div className="d-flex align-items-center p-0">
                <div className="d-flex version-manager-container p-0  align-items-center gap-0">
                  {!isModuleEditor && (
                    <>
                      <PreviewAndShareIcons />
                      {<BranchDropdown appId={appId} organizationId={organizationId} />}
                      {/* Hide version dropdown when on a feature branch (per-app or platform git sync) */}
                      {selectedVersion?.versionType !== 'branch' && !isOnWorkspaceFeatureBranch && (
                        <VersionManagerErrorBoundary>
                          <VersionManagerDropdown darkMode={darkMode} />
                        </VersionManagerErrorBoundary>
                      )}
                      <RightTopHeaderButtons isModuleEditor={isModuleEditor} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
