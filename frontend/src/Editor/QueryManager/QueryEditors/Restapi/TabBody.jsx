import React from 'react';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
import GroupHeader from './GroupHeader';

export default ({
  options = [],
  currentState,
  theme,
  removeKeyValuePair,
  addNewKeyValuePair,
  onChange,
  darkMode,
  componentName,
}) => {
  return (
    <>
      <div className="row">
        <div className="col px-3">
          <GroupHeader darkMode={darkMode} />
        </div>
        <div className="col-auto px-2">
          <span onClick={() => addNewKeyValuePair('body')} className="btn-sm col-2 mt-1 color-primary" role="button">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13 0.75C9.76323 0.789051 6.67003 2.09221 4.38112 4.38112C2.09221 6.67003 0.789051 9.76323 0.75 13C0.789051 16.2368 2.09221 19.33 4.38112 21.6189C6.67003 23.9078 9.76323 25.2109 13 25.25C16.2368 25.2109 19.33 23.9078 21.6189 21.6189C23.9078 19.33 25.2109 16.2368 25.25 13C25.2109 9.76323 23.9078 6.67003 21.6189 4.38112C19.33 2.09221 16.2368 0.789051 13 0.75ZM20 13.875H13.875V20H12.125V13.875H6V12.125H12.125V6H13.875V12.125H20V13.875Z"
                fill="#4D72FA"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className="row px-2 pb-3">
        {options.map((option, index) => {
          return (
            <div className="row input-group my-1" key={index}>
              <div className="col-5 field">
                <CodeHinter
                  currentState={currentState}
                  initialValue={option[0]}
                  theme={theme}
                  height={'32px'}
                  width="80%"
                  placeholder="key"
                  onChange={onChange('body', 0, index)}
                  componentName={`${componentName}/body::key::${index}`}
                />
              </div>

              <div className="col-5 field tab-pane-body">
                <CodeHinter
                  currentState={currentState}
                  initialValue={option[1]}
                  theme={theme}
                  height={'32px'}
                  width="80%"
                  placeholder="value"
                  onChange={onChange('body', 1, index)}
                  componentName={`${componentName}/body::value::${index}`}
                />
              </div>
              {index > 0 && (
                <span
                  style={{ marginLeft: '-5%' }}
                  className="btn-sm col-2 mt-1 color-primary"
                  role="button"
                  onClick={() => {
                    removeKeyValuePair('body', index);
                  }}
                >
                  Remove
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};
