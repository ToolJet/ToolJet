import React from 'react';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';

export default ({ options = [], currentState, theme, removeKeyValuePair, onChange, darkMode }) => {
  return (
    <>
      <div className={`row py-2 border-bottom mb-1  mx-0`} style={{ background: darkMode ? '#1C252E' : '#F4F6FA' }}>
        <div className="col-4">
          <span className=" col-4 text-uppercase small strong" style={{ fontSize: '10px' }}>
            Key
          </span>
        </div>
        <div className="col-6">
          <span className="text-uppercase small strong" style={{ fontSize: '10px' }}>
            Value
          </span>
        </div>
      </div>

      <div className="row">
        {options.map((option, index) => {
          return (
            <div className="row input-group my-1" key={index}>
              <div className="col-4 field">
                <CodeHinter
                  currentState={currentState}
                  initialValue={option[0]}
                  theme={theme}
                  placeholder="key"
                  className="form-control codehinter-query-editor-input"
                  onChange={onChange('headers', 0, index)}
                />
              </div>
              <div className="col-6 field">
                <CodeHinter
                  currentState={currentState}
                  className="form-control codehinter-query-editor-input"
                  initialValue={option[1]}
                  theme={theme}
                  placeholder="value"
                  onChange={onChange('headers', 1, index)}
                />
              </div>
              {index > 0 && (
                <span
                  className="btn-sm col-2 my-2"
                  role="button"
                  onClick={() => {
                    removeKeyValuePair('headers', index);
                  }}
                >
                  x
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};
