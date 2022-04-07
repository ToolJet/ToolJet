import React from 'react';
import usePopover from '@/_hooks/use-popover';
import { SketchPicker } from 'react-color';

import { LeftSidebarItem } from './SidebarItem';
import FxButton from '../CodeBuilder/Elements/FxButton';
import { Code } from '../Inspector/Elements/Code';
import { CodeHinter } from '../CodeBuilder/CodeHinter';

export const LeftSidebarGlobalSettings = ({ globalSettings, globalSettingsChanged, currentState }) => {
  const [open, trigger, content] = usePopover(false);
  const { hideHeader, canvasMaxWidth, canvasBackgroundColor } = globalSettings;
  const [showPicker, setShowPicker] = React.useState(false);
  const [forceCodeBox, setForceCodeBox] = React.useState(true);

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const coverStyles = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  };
  return (
    <>
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
              <span className="w-full m-auto">Max width of canvas</span>
              <div className="position-relative">
                <div className="input-with-icon">
                  <input
                    type="text"
                    className={`form-control form-control-sm`}
                    placeholder={'Enter canvas max-width'}
                    onChange={(e) => {
                      globalSettingsChanged('canvasMaxWidth', e.target.value);
                    }}
                    value={canvasMaxWidth}
                  />
                  <span className="input-group-text">px</span>
                </div>
              </div>
            </div>
            <div className="d-flex">
              <span className="w-full m-auto">Background color of canvas</span>
              <div>
                {showPicker && (
                  <div>
                    <div style={coverStyles} onClick={() => setShowPicker(false)} />
                    <SketchPicker
                      className="canvas-background-picker"
                      onFocus={() => setShowPicker(true)}
                      color={canvasBackgroundColor}
                      onChangeComplete={(color) =>
                        globalSettingsChanged('canvasBackgroundColor', [color.hex, color.rgb])
                      }
                    />
                  </div>
                )}
                {!forceCodeBox && (
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
                {forceCodeBox && (
                  <CodeHinter
                    currentState={currentState}
                    initialValue={canvasBackgroundColor ?? {}}
                    theme={darkMode ? 'monokai' : 'duotone-light'}
                    mode="javascript"
                    lineNumbers={false}
                    className="hinter-canvas-input"
                    onChange={(color) => globalSettingsChanged('canvasBackgroundColor', color)}
                    // onChange={(value) => this.props.paramUpdated({ name: 'jsonDescription' }, 'value', value, 'properties')}
                    // componentName={`widget/${this.props.component.component.name}::${chartType}`}
                  />
                )}
                <div className="col-auto fx-canvas">
                  <FxButton
                    active={forceCodeBox ? true : false}
                    onPress={() => {
                      setForceCodeBox(!forceCodeBox);
                      // setShowPicker(!showPicker);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
