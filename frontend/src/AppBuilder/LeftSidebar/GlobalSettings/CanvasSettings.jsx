// components/CanvasSettings.js
import React, { useState } from 'react';
import { SketchPicker } from 'react-color';
import _ from 'lodash';
import SwitchComponent from '@/components/ui/Switch/Index';
import useStore from '@/AppBuilder/_stores/store';
import { useEditorStore } from '@/_stores/editorStore';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/_helpers/utils';
import FxButton from '@/Editor/CodeBuilder/Elements/FxButton';
import { useTranslation } from 'react-i18next';
import { Confirm } from '@/Editor/Viewer/Confirm';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

const CanvasSettings = ({ darkMode }) => {
  const { moduleId } = useModuleContext();
  const { globalSettings, globalSettingsChanged, resolveOthers, getCanvasBackgroundColor } = useStore(
    (state) => ({
      globalSettings: state.globalSettings,
      isMaintenanceOn: state.appStore.modules[moduleId].app.isMaintenanceOn,
      globalSettingsChanged: state.globalSettingsChanged,
      resolveOthers: state.resolveOthers,
      getCanvasBackgroundColor: state.getCanvasBackgroundColor,
    }),
    shallow
  );
  const canvasBackgroundColor = getCanvasBackgroundColor('canvas', darkMode);
  // const { canvasBackgroundColor, backgroundFxQuery } = useEditorStore(
  //   (state) => ({
  //     canvasBackgroundColor: state.canvasBackground?.canvasBackgroundColor,
  //     backgroundFxQuery: state.canvasBackground?.backgroundFxQuery,
  //   }),
  //   shallow
  // );
  const [showPicker, setShowPicker] = useState(false);
  const [forceCodeBox, setForceCodeBox] = useState(true);
  const [showConfirmation, setConfirmationShow] = useState(false);
  const { t } = useTranslation();

  const handleColorChange = (color) => {
    // updateGlobalSettings({
    //   canvasBackgroundColor: [color.hex, color.rgb],
    //   backgroundFxQuery: '',
    // });
  };

  const coverStyles = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  };

  const outerStyles = {
    width: '142px',
    height: '32px',
    borderRadius: ' 6px',
    display: 'flex',
    paddingLeft: '4px',
    alignItems: 'center',
    gap: '4px',
    background: showPicker && 'var(--indigo2)',
    outline: showPicker && '1px solid var(--indigo9)',
    boxShadow: showPicker && '0px 0px 0px 1px #C6D4F9',
  };

  const { canvasMaxWidth, canvasMaxWidthType, backgroundFxQuery } = globalSettings ?? {};

  return (
    <>
      <div className="d-flex mb-3">
        <span data-cy={`label-max-canvas-width`} className="w-full m-auto">
          {t('leftSidebar.Settings.maxWidthOfCanvas', 'Max width of canvas')}
        </span>
        <div className="position-relative">
          <div className="global-settings-width-input-container">
            <input
              style={{ width: '103px', borderRight: 'none' }}
              data-cy="maximum-canvas-width-input-field"
              type="text"
              className={`form-control`}
              placeholder={'0'}
              onChange={(e) => {
                const width = e.target.value;
                if (!Number.isNaN(width) && width >= 0) globalSettingsChanged({ canvasMaxWidth: width });
              }}
              value={canvasMaxWidth}
            />
            <select
              data-cy={`dropdown-max-canvas-width-type`}
              className="dropdown-max-canvas-width-type"
              aria-label="Select canvas width type"
              onChange={(event) => {
                const newCanvasMaxWidthType = event.currentTarget.value;
                const options = {
                  canvasMaxWidthType: newCanvasMaxWidthType,
                };

                if (newCanvasMaxWidthType === '%') {
                  options.canvasMaxWidth = 100;
                } else if (newCanvasMaxWidthType === 'px') {
                  options.canvasMaxWidth = 1292;
                }
                globalSettingsChanged(options);
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

      <div className="d-flex justify-content-between mb-3">
        <span className="pt-2" data-cy={`label-bg-canvas`}>
          {t('leftSidebar.Settings.backgroundColorOfCanvas', 'Canvas bavkground')}
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
                  const options = {
                    canvasBackgroundColor: [color.hex, color.rgb],
                    backgroundFxQuery: '',
                  };
                  globalSettingsChanged(options);
                  resolveOthers('canvas', true, { canvasBackgroundColor: [color.hex, color.rgb] });
                }}
              />
            </div>
          )}
          {forceCodeBox && (
            <div className="row mx-0 color-picker-input d-flex" onClick={() => setShowPicker(true)} style={outerStyles}>
              <div
                data-cy={`canvas-bg-color-picker`}
                className="col-auto"
                style={{
                  float: 'right',
                  width: '24px',
                  height: '24px',
                  backgroundColor: canvasBackgroundColor,
                  borderRadius: ' 6px',
                  border: `1px solid var(--slate7, #D7DBDF)`,
                  boxShadow: `0px 1px 2px 0px rgba(16, 24, 40, 0.05)`,
                }}
              ></div>
              <div style={{ height: '20px' }} className="col">
                {canvasBackgroundColor}
              </div>
            </div>
          )}
          <div className={`${!forceCodeBox && 'hinter-canvas-input'} `}>
            {!forceCodeBox && (
              <CodeHinter
                cyLabel={`canvas-bg-colour`}
                initialValue={backgroundFxQuery ? backgroundFxQuery : canvasBackgroundColor}
                lang="javascript"
                className="canvas-hinter-wrap"
                lineNumbers={false}
                onChange={(color) => {
                  const options = {
                    canvasBackgroundColor: resolveReferences(color),
                    backgroundFxQuery: color,
                  };
                  globalSettingsChanged(options);
                  resolveOthers('canvas', true, { canvasBackgroundColor: color });
                }}
              />
            )}
            <div className={`fx-canvas `}>
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
    </>
  );
};

export default CanvasSettings;
