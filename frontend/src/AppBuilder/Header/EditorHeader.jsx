import React from 'react';
import EditAppName from './EditAppName';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';
import { LogoNavDropdown, AppEnvironments } from '@/modules/Appbuilder/components';
import HeaderActions from './HeaderActions';
import { AppVersionsManager } from './AppVersionsManager';
import useStore from '@/AppBuilder/_stores/store';
import RightTopHeaderButtons from './RightTopHeaderButtons/RightTopHeaderButtons';
import BuildSuggestions from './BuildSuggestions';
import { ModuleEditorBanner } from '@/modules/Modules/components';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

import Steps from './Steps';
import SaveIndicator from './SaveIndicator';
import { Tooltip } from 'react-tooltip';

export const EditorHeader = ({ darkMode, isUserInZeroToOneFlow }) => {
  const { moduleId, isModuleEditor } = useModuleContext();
  const { isSaving, saveError, isVersionReleased, aiGenerationMetadata } = useStore(
    (state) => ({
      isSaving: state.appStore.modules[moduleId].app.isSaving,
      saveError: state.appStore.modules[moduleId].app.saveError,
      isVersionReleased: state.isVersionReleased,
      aiGenerationMetadata: state.appStore.modules[moduleId].app?.aiGenerationMetadata,
    }),
    shallow
  );

  return (
    <div className={cx('header', { 'dark-theme theme-dark': darkMode })} style={{ width: '100%' }}>
      <header className="navbar navbar-expand-md d-print-none tw-h-12" style={{ zIndex: 12 }}>
        <div className="container-xl header-container">
          <div className="d-flex w-100 tw-h-9  tw-justify-between">
            <div className="header-inner-wrapper d-flex tw-grow-1 tw-w-full">
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
                    <h1 className="navbar-brand d-none-navbar-horizontal p-0" data-cy="editor-page-logo">
                      <LogoNavDropdown darkMode={darkMode} />
                    </h1>
                    <div className="d-flex flex-row">
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

                  {isUserInZeroToOneFlow && (
                    <Steps
                      steps={
                        aiGenerationMetadata?.steps?.map((step) => ({
                          label: step.name,
                          value: step.id,
                        })) ?? []
                      }
                      activeStep={aiGenerationMetadata?.active_step}
                    />
                  )}
                </div>
              </div>
            </div>

            {!isUserInZeroToOneFlow && <HeaderActions darkMode={darkMode} />}

            {!isUserInZeroToOneFlow && (
              <div className="tw-flex tw-flex-row tw-items-center tw-justify-end tw-grow-1 tw-w-full">
                <div className="d-flex align-items-center p-0">
                  <div className="d-flex version-manager-container p-0  align-items-center ">
                    {!isModuleEditor && (
                      <>
                        <AppEnvironments darkMode={darkMode} />
                        <div className="navbar-seperator" />
                        <AppVersionsManager darkMode={darkMode} />
                        <div className="navbar-seperator" />
                        <RightTopHeaderButtons isModuleEditor={isModuleEditor} />
                      </>
                    )}
                  </div>
                </div>

                <BuildSuggestions />
              </div>
            )}
          </div>
        </div>
      </header>
      <Tooltip
        id="editor-header-tooltip"
        className="tw-text-text-default tw-bg-background-inverse tw-p-3 tw-rounded-md tw-text-xs tw-font-medium"
      />
    </div>
  );
};
