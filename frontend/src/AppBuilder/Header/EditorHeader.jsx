import React from 'react';
import EditAppName from './EditAppName';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import LogoNavDropdown from '@/modules/Appbuilder/components/LogoNavDropdown';
import HeaderActions from './HeaderActions';
import { VersionManagerDropdown, VersionManagerErrorBoundary } from './VersionManager';
import useStore from '@/AppBuilder/_stores/store';
import RightTopHeaderButtons from './RightTopHeaderButtons/RightTopHeaderButtons';

import { ModuleEditorBanner } from '@/modules/Modules/components';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import './styles/style.scss';

import SaveIndicator from './SaveIndicator';

export const EditorHeader = ({ darkMode }) => {
  const { moduleId, isModuleEditor } = useModuleContext();
  const { isSaving, saveError, isVersionReleased } = useStore(
    (state) => ({
      isSaving: state.appStore.modules[moduleId].app.isSaving,
      saveError: state.appStore.modules[moduleId].app.saveError,
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );

  return (
    <div className={cx('header', { 'dark-theme theme-dark': darkMode })} style={{ width: '100%' }}>
      <header className="navbar navbar-expand-md d-print-none tw-h-12" style={{ zIndex: 12 }}>
        <div className="container-xl header-container">
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
                      {isModuleEditor && <ModuleEditorBanner />}
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
                      <VersionManagerErrorBoundary>
                        <VersionManagerDropdown darkMode={darkMode} />
                      </VersionManagerErrorBoundary>
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
