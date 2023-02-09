import React, { useEffect, useRef, useState } from 'react';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import FxButton from '@/Editor/CodeBuilder/Elements/FxButton';
import { resolveReferences } from '@/_helpers/utils';

export const DisableActionButtonComponent = ({
  label,
  currentState,
  index,
  darkMode,
  callbackFunction,
  property,
  action = {},
}) => {
  const [forceCodeBox, setForceCodeBox] = useState(action.forceCodeBox ?? true);
  const [disabled, setDisabled] = useState(action.disableActionButton ?? false);
  const codeHinterValue = useRef(action.codeHinterValue ?? null);

  useEffect(() => {
    callbackFunction(index, 'forceCodeBox', forceCodeBox);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceCodeBox]);

  return (
    <div className="field mb-3">
      <div className="d-flex justify-content-between">
        <div>
          <label className="form-label">{label}</label>
        </div>
        <div className="col-auto">
          <FxButton
            active={forceCodeBox ? false : true}
            onPress={() => {
              setForceCodeBox(!forceCodeBox);
            }}
          />
        </div>
      </div>
      <div>
        <div className>
          {!forceCodeBox && (
            <div className="field">
              <CodeHinter
                currentState={currentState}
                initialValue={codeHinterValue?.current ?? `{{${disabled}}}`}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                className="codehinter-default-input"
                lineNumbers={false}
                onChange={(value) => {
                  codeHinterValue.current = value;
                  callbackFunction(index, property, resolveReferences(value, currentState), value);
                  setDisabled(value ? true : false);
                }}
              />
            </div>
          )}
          {forceCodeBox && (
            <label className="form-check form-switch ">
              <input
                className="form-check-input"
                type="checkbox"
                checked={disabled ? true : false}
                onChange={(e) => {
                  e.stopPropagation();
                  callbackFunction(index, property, e.target.checked);
                  setDisabled(e.target.checked);
                }}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};
