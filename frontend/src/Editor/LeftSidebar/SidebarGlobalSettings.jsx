import React from 'react';
import usePopover from '@/_hooks/use-popover';
import { SketchPicker } from 'react-color';
import { Confirm } from '../Viewer/Confirm';

import { LeftSidebarItem } from './SidebarItem';
import FxButton from '../CodeBuilder/Elements/FxButton';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { resolveReferences } from '@/_helpers/utils';

export const LeftSidebarGlobalSettings = ({
  globalSettings,
  globalSettingsChanged,
  darkMode,
  toggleAppMaintenance,
  is_maintenance_on,
  currentState,
}) => {
  const [open, trigger, content] = usePopover(false);
  const { hideHeader, canvasMaxWidth, canvasMaxHeight, canvasBackgroundColor, backgroundFxQuery } = globalSettings;
  const [showPicker, setShowPicker] = React.useState(false);
  const [forceCodeBox, setForceCodeBox] = React.useState(true);
  const [realState, setRealState] = React.useState(currentState);
  const [showConfirmation, setConfirmationShow] = React.useState(false);
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
      <LeftSidebarItem
        tip="Global settings"
        {...trigger}
        icon="settings"
        className={`left-sidebar-item  left-sidebar-layout ${open && 'active'}`}
        text={'Settings'}
      />
      <div {...content} className={`card popover global-settings-popover ${open ? 'show' : 'hide'}`}>
        <div style={{ marginTop: '1rem' }} className="card-body">
          <div>
            <div className="d-flex mb-3">
              <span>Hide header for launched apps</span>
              <div className="ms-auto form-check form-switch position-relative">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={hideHeader}
                  onChange={(e) => globalSettingsChanged('hideHeader', e.target.checked)}
                />
              </div>
            </div>
            <div className="d-flex mb-3">
              <span>Maintenance mode</span>
              <div className="ms-auto form-check form-switch position-relative">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={is_maintenance_on}
                  onChange={() => setConfirmationShow(true)}
                />
              </div>
            </div>
            <div className="d-flex mb-3">
              <span className="w-full m-auto">Max width of canvas</span>
              <div className="position-relative">
                <div className="input-with-icon">
                  <input
                    type="text"
                    className={`form-control form-control-sm`}
                    placeholder={'0'}
                    onChange={(e) => {
                      globalSettingsChanged('canvasMaxWidth', e.target.value);
                    }}
                    value={canvasMaxWidth}
                  />
                  <span className="input-group-text">px</span>
                </div>
              </div>
            </div>
            <div className="d-flex mb-3">
              <span className="w-full m-auto">Max height of canvas</span>
              <div className="position-relative">
                <div className="input-with-icon">
                  <input
                    type="text"
                    className={`form-control form-control-sm`}
                    placeholder={'0'}
                    onChange={(e) => {
                      const height = e.target.value;
                      if (!Number.isNaN(height) && height <= 2400) globalSettingsChanged('canvasMaxHeight', height);
                    }}
                    value={canvasMaxHeight}
                  />
                  <span className="input-group-text">px</span>
                </div>
              </div>
            </div>
            <div className="d-flex">
              <span className="w-full">Background color of canvas</span>
              <div className="canvas-codehinter-container">
                {showPicker && (
                  <div>
                    <div style={coverStyles} onClick={() => setShowPicker(false)} />
                    <SketchPicker
                      className="canvas-background-picker"
                      onFocus={() => setShowPicker(true)}
                      color={canvasBackgroundColor}
                      onChangeComplete={(color) => {
                        globalSettingsChanged('canvasBackgroundColor', [color.hex, color.rgb]);
                        globalSettingsChanged('backgroundFxQuery', null);
                      }}
                    />
                  </div>
                )}
                {forceCodeBox && (
                  <div
                    className="row mx-0 form-control form-control-sm canvas-background-holder"
                    onClick={() => setShowPicker(true)}
                  >
                    <div
                      className="col-auto"
                      style={{
                        float: 'right',
                        width: '20px',
                        height: '20px',
                        backgroundColor: canvasBackgroundColor,
                        border: `0.25px solid ${
                          ['#ffffff', '#fff', '#1f2936'].includes(canvasBackgroundColor) && '#c5c8c9'
                        }`,
                      }}
                    ></div>
                    <div className="col">{canvasBackgroundColor}</div>
                  </div>
                )}
                <div
                  className={`${!forceCodeBox && 'hinter-canvas-input'} ${!darkMode && 'hinter-canvas-input-light'} `}
                >
                  {!forceCodeBox && (
                    <CodeHinter
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
                      active={!forceCodeBox ? true : false}
                      onPress={() => {
                        setForceCodeBox(!forceCodeBox);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
