import React from 'react';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';

export default ({ options = [], currentState, theme, removeKeyValuePair, onChange, darkMode, componentName }) => {
  return (
    <>
      <div className={`row py-2 border-bottom mb-1  mx-0 ${!darkMode && 'bg-light'}`}>
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
                  onChange={onChange('url_params', 0, index)}
                  componentName={`${componentName}/params::key::${index}`}
                />
              </div>
              <div className="col-6 field">
                <CodeHinter
                  currentState={currentState}
                  className="form-control codehinter-query-editor-input"
                  initialValue={option[1]}
                  theme={theme}
                  placeholder="value"
                  onChange={onChange('url_params', 1, index)}
                  componentName={`${componentName}/params::value::${index}`}
                />
              </div>
              {index > 0 && (
                <span
                  className="btn-sm col-2 my-2"
                  role="button"
                  onClick={() => {
                    removeKeyValuePair('url_params', index);
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
