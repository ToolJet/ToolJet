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
    <div>
      <div>
        <label htmlFor="">{label}</label>
        <div>
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
            <input
              type="checkbox"
              checked={disabled}
              onChange={(e) => {
                e.stopPropagation();
                callbackFunction(index, property, e.target.checked);
                setEnabled(e.target.checked);
              }}
            />
          )}
        </div>
      </div>
      <div className={`fx-canvas ${!darkMode && 'fx-canvas-light'} `}>
        <FxButton
          active={!forceCodeBox ? true : false}
          onPress={() => {
            setForceCodeBox(!forceCodeBox);
          }}
        />
      </div>
    </div>
  );
};
