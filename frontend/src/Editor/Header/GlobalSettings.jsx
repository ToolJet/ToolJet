import React from 'react';
import cx from 'classnames';
import { SketchPicker } from 'react-color';
import { Confirm } from '../Viewer/Confirm';
import { LeftSidebarItem } from '../LeftSidebar/SidebarItem';
import FxButton from '../CodeBuilder/Elements/FxButton';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { resolveReferences } from '@/_helpers/utils';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import Popover from '@/_ui/Popover';
import ExportAppModal from '../../HomePage/ExportAppModal';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';

export const GlobalSettings = ({
  globalSettings,
  globalSettingsChanged,
  darkMode,
  toggleAppMaintenance,
  is_maintenance_on,
  app,
}) => {
  const { t } = useTranslation();
  const { hideHeader, canvasMaxWidth, canvasMaxWidthType, canvasMaxHeight, canvasBackgroundColor, backgroundFxQuery } =
    globalSettings;
  const [showPicker, setShowPicker] = React.useState(false);
  const currentState = useCurrentState();
  const [forceCodeBox, setForceCodeBox] = React.useState(true);
  const [realState, setRealState] = React.useState(currentState);
  const [showConfirmation, setConfirmationShow] = React.useState(false);
  const [show, setShow] = React.useState('');
  const [isExportingApp, setIsExportingApp] = React.useState(false);
  const { isVersionReleased } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );

  const coverStyles = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  };

  React.useEffect(() => {
    setRealState(currentState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState.components]);

  React.useEffect(() => {
    backgroundFxQuery &&
      globalSettingsChanged('canvasBackgroundColor', resolveReferences(backgroundFxQuery, realState));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(resolveReferences(backgroundFxQuery, realState))]);

  const popoverContent = (
    <div id="global-settings-popover" className={cx({ 'theme-dark': darkMode, disabled: isVersionReleased })}>
      <div bsPrefix="global-settings-popover">
        <div>
          <div>
            <div className="d-flex justify-content-start">
              <span data-cy={`label-hide-header-for-launched-apps`}>
                {t('leftSidebar.Settings.hideHeader', 'Hide header for launched apps')}
              </span>
              <div className="form-check form-switch">
                <input
                  data-cy={`toggle-hide-header-for-launched-apps`}
                  className="form-check-input"
                  type="checkbox"
                  checked={hideHeader}
                  onChange={(e) => globalSettingsChanged('hideHeader', e.target.checked)}
                />
              </div>
              <span className="global-popover-text">
                {t('leftSidebar.Settings.hideHeader', 'Hide header for launched apps')}
              </span>
            </div>
            <div className="d-flex   justify-content-start">
              <span data-cy={`label-maintenance-mode`}>
                {t('leftSidebar.Settings.maintenanceMode', 'Maintenance mode')}
              </span>
              <div className="form-check form-switch">
                <input
                  data-cy={`toggle-maintenance-mode`}
                  className="form-check-input"
                  type="checkbox"
                  checked={is_maintenance_on}
                  onChange={() => setConfirmationShow(true)}
                />
              </div>
              <span className="global-popover-text">
                {t('leftSidebar.Settings.maintenanceMode', 'Maintenance mode')}
              </span>
            </div>
            <div className="d-flex mb-3 global-popover-div-wrap ">
              <span data-cy={`label-max-canvas-width`} className="w-full m-auto">
                {t('leftSidebar.Settings.maxWidthOfCanvas', 'Max width of canvas')}
              </span>
              <div className="global-popover-div-wrap global-popover-div-wrap-width">
                <div className="input-with-icon">
                  <input
                    data-cy="maximum-canvas-width-input-field"
                    type="text"
                    className={`form-control form-control-sm maximum-canvas-width-input-field`}
                    placeholder={'0'}
                    onChange={(e) => {
                      const width = e.target.value;
                      if (!Number.isNaN(width) && width >= 0) globalSettingsChanged('canvasMaxWidth', width);
                    }}
                    value={canvasMaxWidth}
                  />
                  <select
                    className="maximum-canvas-width-input-select"
                    data-cy={`dropdown-max-canvas-width-type`}
                    aria-label="Select canvas width type"
                    onChange={(event) => {
                      const newCanvasMaxWidthType = event.currentTarget.value;
                      globalSettingsChanged('canvasMaxWidthType', newCanvasMaxWidthType);
                      if (newCanvasMaxWidthType === '%') {
                        globalSettingsChanged('canvasMaxWidth', 100);
                      } else if (newCanvasMaxWidthType === 'px') {
                        globalSettingsChanged('canvasMaxWidth', 1292);
                      }
                    }}
                  >
                    <option value="%" selected={canvasMaxWidthType === '%'}>
                      %
                    </option>
                    <option value="px" selected={canvasMaxWidthType === 'px' || _.isUndefined(canvasMaxWidthType)}>
                      px
                    </option>
                  </select>
                </div>
              </div>
            </div>
            {/* <div className="d-flex mb-3">
              <span className="w-full m-auto" data-cy={`label-max-canvas-height`}>
                {t('leftSidebar.Settings.maxHeightOfCanvas', 'Max height of canvas')}
              </span>
              <div className="global-popover-div-wrap global-popover-div-wrap-width">
                <div className="input-with-icon">
                  <input
                    data-cy="maximum-canvas-height-input-field"
                    type="text"
                    className={`form-control form-control-sm maximum-canvas-height-input-field`}
                    placeholder={'0'}
                    onChange={(e) => {
                      const height = e.target.value;
                      if (!Number.isNaN(height) && height <= 2400) globalSettingsChanged('canvasMaxHeight', height);
                    }}
                    value={canvasMaxHeight}
                  />
                </div>
              </div>
            </div> */}
            <div className="d-flex align-items-center">
              <span className="w-full" data-cy={`label-bg-canvas`}>
                {t('leftSidebar.Settings.backgroundColorOfCanvas', 'Background color of canvas')}
              </span>
              <div className="canvas-codehinter-container">
                {showPicker && (
                  <div>
                    <div style={coverStyles} onClick={() => setShowPicker(false)} />
                    <SketchPicker
                      data-cy={`color-picker-canvas`}
                      className="canvas-background-picker"
                      onFocus={() => setShowPicker(true)}
                      color={canvasBackgroundColor}
                      onChangeComplete={(color) => {
                        globalSettingsChanged('canvasBackgroundColor', [color.hex, color.rgb]);
                        globalSettingsChanged('backgroundFxQuery', color.hex);
                      }}
                    />
                  </div>
                )}
                {forceCodeBox && (
                  <div
                    className="form-control form-control-sm canvas-background-holder"
                    onClick={() => setShowPicker(true)}
                  >
                    <div
                      data-cy={`canvas-bg-color-picker`}
                      className="col-auto"
                      style={{
                        float: 'right',
                        width: '13.33px',
                        height: '13.33px',
                        backgroundColor: canvasBackgroundColor,
                        borderRadius: '4px',
                      }}
                    ></div>
                    <div className="">{canvasBackgroundColor}</div>
                  </div>
                )}
                <div
                  className={`${!forceCodeBox && 'hinter-canvas-input'} ${!darkMode && 'hinter-canvas-input-light'} `}
                >
                  {!forceCodeBox && (
                    <CodeHinter
                      cyLabel={`canvas-bg-colour`}
                      currentState={realState}
                      initialValue={backgroundFxQuery ? backgroundFxQuery : canvasBackgroundColor}
                      value={backgroundFxQuery ? backgroundFxQuery : canvasBackgroundColor}
                      theme={darkMode ? 'monokai' : 'duotone-light'}
                      mode="javascript"
                      className="canvas-hinter-wrap"
                      lineNumbers={false}
                      onChange={(color) => {
                        globalSettingsChanged('canvasBackgroundColor', resolveReferences(color, realState));
                        globalSettingsChanged('backgroundFxQuery', color);
                      }}
                    />
                  )}
                  <div className={`fx-canvas ${!darkMode && 'fx-canvas-light'} `}>
                    <FxButton
                      dataCy={`canvas-bg-color`}
                      active={!forceCodeBox ? true : false}
                      onPress={() => {
                        setForceCodeBox(!forceCodeBox);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center  global-popover-div-wrap">
              <p className="global-popover-text">Export app</p>
              <button
                className="export-app-btn"
                onClick={() => {
                  setIsExportingApp(true);
                  document.getElementById('maintenance-app-modal').click();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M2.5 5.78906V17.2891V18.0391C2.5 19.834 3.98027 21.2891 5.77519 21.2891C7.5425 21.2891 9 19.8564 9 18.0891C9 17.6472 9.35817 17.2891 9.8 17.2891H18.5V5.78906C18.5 4.13221 17.1569 2.78906 15.5 2.78906H5.5C3.84315 2.78906 2.5 4.13221 2.5 5.78906ZM9.75 9.61723C9.70334 9.65231 9.65858 9.69108 9.61612 9.73355L8.03033 11.3193C7.73744 11.6122 7.26256 11.6122 6.96967 11.3193C6.67678 11.0264 6.67678 10.5516 6.96967 10.2587L8.55546 8.67289C9.6294 7.59895 11.3706 7.59895 12.4445 8.67289L14.0303 10.2587C14.3232 10.5516 14.3232 11.0264 14.0303 11.3193C13.7374 11.6122 13.2626 11.6122 12.9697 11.3193L11.3839 9.73355C11.3414 9.69108 11.2967 9.65231 11.25 9.61723V13.789C11.25 14.2032 10.9142 14.539 10.5 14.539C10.0858 14.539 9.75 14.2032 9.75 13.789V9.61723ZM22.3766 19.7789C21.9361 21.5093 20.3675 22.7891 18.5 22.7891H6.5C8.36748 22.7891 9.93606 21.5093 10.3766 19.7789C10.5128 19.2437 10.9477 18.7891 11.5 18.7891H21.5C22.0523 18.7891 22.5128 19.2437 22.3766 19.7789Z"
                    fill="#3E63DD"
                  />
                </svg>
                <span style={{ paddingLeft: '6px' }}>Export this app</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Confirm
        show={showConfirmation}
        message={
          is_maintenance_on
            ? 'Users will now be able to launch the released version of this app, do you wish to continue?'
            : 'Users will not be able to launch the app until maintenance mode is turned off, do you wish to continue?'
        }
        onConfirm={() => toggleAppMaintenance()}
        onCancel={() => setConfirmationShow(false)}
        darkMode={darkMode}
      />
      {isExportingApp && app.hasOwnProperty('id') && (
        <ExportAppModal
          show={isExportingApp}
          closeModal={() => {
            setIsExportingApp(false);
          }}
          customClassName="modal-version-lists"
          title={'Select a version to export'}
          app={app}
          darkMode={darkMode}
        />
      )}
      <Popover
        handleToggle={(show) => {
          if (show) setShow('settings');
          else {
            setShow('');
            setShowPicker(false);
          }
        }}
        popoverContentClassName="p-0 sidebar-h-100-popover global-settings-popover-content"
        side="bottom"
        popoverContent={popoverContent}
        popoverContentHeight="auto"
      >
        <LeftSidebarItem
          selectedSidebarItem={show}
          icon="settings"
          className={cx(`cursor-pointer sidebar-global-settings`)}
          tip="Settings"
        />
      </Popover>
    </>
  );
};
