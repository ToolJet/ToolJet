import React, { useEffect, useRef, useState } from 'react';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import FxButton from '@/Editor/CodeBuilder/Elements/FxButton';
import { resolveReferences } from '@/_helpers/utils';

export const ProgramaticallyEnableOrDisableToggleSwitch = ({
  label,
  currentState,
  index,
  darkMode,
  callbackFunction,
  property,
  props = {},
}) => {
  const [forceCodeBox, setForceCodeBox] = useState(props.forceCodeBox ?? true);
  const [checked, setChecked] = useState(
    (property === 'isEditable' ? props.isEditable : props.disableActionButton) ?? false
  );
  const codeHinterValue = useRef(props.codeHinterValue ?? null);

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
                initialValue={codeHinterValue?.current ?? `{{${checked}}}`}
                theme={darkMode ? 'monokai' : 'default'}
                mode="javascript"
                className="codehinter-default-input"
                lineNumbers={false}
                onChange={(value) => {
                  codeHinterValue.current = value;
                  callbackFunction(index, property, resolveReferences(value, currentState), value);
                  setChecked(resolveReferences(value, currentState) ? true : false);
                }}
              />
            </div>
          )}
          {forceCodeBox && (
            <label className="form-check form-switch ">
              <input
                className="form-check-input"
                type="checkbox"
                checked={checked ? true : false}
                onChange={(e) => {
                  e.stopPropagation();
                  callbackFunction(index, property, e.target.checked);
                  setChecked(e.target.checked);
                }}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};
