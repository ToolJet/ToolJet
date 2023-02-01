import React, { useState } from 'react';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
import FxButton from '../../../CodeBuilder/Elements/FxButton';

export const DisableActionButtonComponent = ({
  label,
  currentState,
  index,
  darkMode,
  callbackFunction,
  property,
  action = {},
}) => {
  const [forceCodeBox, setForceCodeBox] = React.useState(true);
  const disable =
    action?.disableActionButton && action.disableActionButton === (true || false)
      ? action.disableActionButton
      : false ?? false;
  const [disabled, setEnabled] = useState(disable);
  return (
    <>
      <div className="field mb-3">
        <div className="d-flex justify-content-between">
          <div>
            <label className="form-label">{label}</label>
          </div>
          <div className="col-auto">
            <FxButton
              active={!forceCodeBox ? true : false}
              onPress={() => {
                setForceCodeBox(!forceCodeBox);
              }}
            />
          </div>
        </div>
        <div>
          <div className>
            {!forceCodeBox && (
              <CodeHinter
                currentState={currentState}
                initialValue={`${disabled}`}
                value={`${disabled}`}
                theme={darkMode ? 'monokai' : 'duotone-light'}
                mode="javascript"
                className="canvas-hinter-wrap"
                lineNumbers={false}
                onChange={(e) => {
                  callbackFunction(index, property, e.target.value);
                }}
              />
            )}
            {forceCodeBox && (
              <label className="form-check form-switch ">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={disabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    callbackFunction(index, property, e.target.checked);
                    setEnabled(e.target.checked);
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
