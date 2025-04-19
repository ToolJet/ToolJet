import React from 'react';
import EditAppName from './EditAppName';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import { LogoNavDropdown, AppEnvironments } from '@/modules/Appbuilder/components';
import HeaderActions from './HeaderActions';
import { AppVersionsManager } from './AppVersionsManager';
import RealtimeAvatars from '@/Editor/RealtimeAvatars';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import useStore from '@/AppBuilder/_stores/store';
import RightTopHeaderButtons from './RightTopHeaderButtons/RightTopHeaderButtons';
import BuildSuggestions from './BuildSuggestions';
import GitSyncManager from './GitSyncManager';
import UpdatePresenceMultiPlayer from './UpdatePresenceMultiPlayer';
import { ModuleEditorBanner } from '@/modules/Modules/components';
export const EditorHeader = ({ darkMode, isModuleEditor }) => {
  const { isSaving, saveError, isVersionReleased } = useStore(
    (state) => ({
      isSaving: state.app.isSaving,
      saveError: state.app.saveError,
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );
  const shouldEnableMultiplayer = window.public_config?.ENABLE_MULTIPLAYER_EDITING === 'true';

  const getSaveIndicator = () => {
    if (isSaving) {
      return 'Saving...';
    } else if (saveError) {
      return (
        <div className="d-flex align-items-center" style={{ gap: '4px' }}>
          <SolidIcon name="cloudinvalid" width="14" />
          <p className="mb-0 text-center tj-text-xxsm">Could not save changes</p>
        </div>
      );
    } else {
      return (
        <div className="d-flex align-items-center" style={{ gap: '4px' }}>
          <SolidIcon name="cloudvalid" width="14" />
          <p className="mb-0 text-center">Changes saved</p>
        </div>
      );
    }
  };

  return (
    <div className={cx('header', { 'dark-theme theme-dark': darkMode })} style={{ width: '100%' }}>
      <header className="navbar navbar-expand-md d-print-none" style={{ zIndex: 12 }}>
        <div className="container-xl header-container">
          <div className="d-flex w-100">
            <h1 className="navbar-brand d-none-navbar-horizontal p-0" data-cy="editor-page-logo">
              <LogoNavDropdown darkMode={darkMode} />
            </h1>
            <div className="header-inner-wrapper d-flex" style={{ width: 'calc(100% - 348px)', background: '' }}>
              <div
                style={{
                  maxHeight: '48px',
                  margin: '0px',
                  padding: '0px',
                  width: 'calc(100% - 348px)',
                  justifyContent: 'space-between',
                }}
                className="flex-grow-1 d-flex align-items-center"
              >
                <div
                  className="p-0 m-0 d-flex align-items-center"
                  style={{
                    padding: '0px',
                    width: '100%',
                    justifyContent: 'space-between',
                  }}
                >
                  <div className="global-settings-app-wrapper p-0 m-0 ">
                    <div className="d-flex flex-row">
                      {isModuleEditor && <ModuleEditorBanner />}
                      <EditAppName />
                    </div>
                  </div>
                  <HeaderActions darkMode={darkMode} />
                  <div className="d-flex align-items-center">
                    <div style={{ width: '100px' }}>
                      <span
                        className={cx('autosave-indicator tj-text-xsm', {
                          'autosave-indicator-saving': isSaving,
                          'text-danger': saveError,
                          'd-none': isVersionReleased,
                        })}
                        data-cy="autosave-indicator"
                      >
                        {getSaveIndicator()}
                      </span>
                    </div>
                    {shouldEnableMultiplayer && (
                      <div className="mx-2 p-2">
                        <RealtimeAvatars />
                      </div>
                    )}
                    {shouldEnableMultiplayer && <UpdatePresenceMultiPlayer />}
                  </div>
                </div>
                {!isModuleEditor && <div className="navbar-seperator"></div>}
              </div>
              <div className="d-flex align-items-center p-0">
                <div className="d-flex version-manager-container p-0 mx-2  align-items-center ">
                  {!isModuleEditor && (
                    <>
                      <AppEnvironments darkMode={darkMode} />
                      <AppVersionsManager darkMode={darkMode} />
                    </>
                  )}
                  <GitSyncManager />
                </div>
              </div>
            </div>
            <RightTopHeaderButtons isModuleEditor={isModuleEditor} />
            <BuildSuggestions />
          </div>
        </div>
      </header>
    </div>
  );
};
