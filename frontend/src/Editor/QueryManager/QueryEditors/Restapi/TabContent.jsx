import React from 'react';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';

export default ({
  options = [],
  currentState,
  theme,
  onChange,
  jsonBody,
  onJsonBodyChange,
  componentName,
  removeKeyValuePair,
  paramType,
  tabType,
  bodyToggle,
  addNewKeyValuePair,
}) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <>
      <div className="tab-content-wrapper ">
        {!bodyToggle &&
          options.map((option, index) => {
            return (
              <>
                <div className="row-container" key={index}>
                  <div className="fields-container">
                    <div
                      className="border px-3 d-flex align-items-center"
                      style={{ maxHeight: '32px', background: darkMode ? '' : '#F8F9FA' }}
                    >
                      {index + 1}
                    </div>
                    <div className="field" style={{ width: '100%' }}>
                      <CodeHinter
                        currentState={currentState}
                        initialValue={option[0]}
                        theme={theme}
                        height={'32px'}
                        placeholder="key"
                        onChange={onChange(paramType, 0, index)}
                        componentName={`${componentName}/${tabType}::key::${index}`}
                      />
                    </div>
                    <div className="field" style={{ width: '100%' }}>
                      <CodeHinter
                        currentState={currentState}
                        initialValue={option[1]}
                        theme={theme}
                        height={'32px'}
                        placeholder="value"
                        onChange={onChange(paramType, 1, index)}
                        componentName={`${componentName}/${tabType}::value::${index}`}
                      />
                    </div>
                    <div
                      className="border px-2 d-flex align-items-center"
                      role="button"
                      onClick={() => {
                        removeKeyValuePair(paramType, index);
                      }}
                      style={{ maxHeight: '32px' }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="icon icon-tabler icon-tabler-trash"
                        width="36"
                        height="36"
                        viewBox="0 0 25 25"
                        strokeWidth="1.5"
                        stroke="#ff2825"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <line x1="4" y1="7" x2="20" y2="7" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                        <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                        <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </>
            );
          })}
        {bodyToggle && (
          <div>
            <CodeHinter
              currentState={currentState}
              initialValue={jsonBody}
              mode="javascript"
              theme={darkMode ? 'monokai' : 'base16-light'}
              height={'300px'}
              className="query-hinter"
              ignoreBraces={false}
              onChange={(value) => onJsonBodyChange(value)}
              componentName={`${componentName}/${tabType}`}
            />
          </div>
        )}
        {!bodyToggle && (
          <div className="border">
            <div
              className="col-1 p-2"
              style={{ width: '17.867px' }}
              onClick={() => addNewKeyValuePair(paramType)}
              role="button"
            >
              <svg width="15" height="15" viewBox="0 0 24 25" fill="#5677E1" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 4.5C12.5523 4.5 13 4.94772 13 5.5V11.5H19C19.5523 11.5 20 11.9477 20 12.5C20 13.0523 19.5523 13.5 19 13.5H13V19.5C13 20.0523 12.5523 20.5 12 20.5C11.4477 20.5 11 20.0523 11 19.5V13.5H5C4.44772 13.5 4 13.0523 4 12.5C4 11.9477 4.44772 11.5 5 11.5H11V5.5C11 4.94772 11.4477 4.5 12 4.5Z"
                  fill="#5677E1"
                />
              </svg>
            </div>
            <div className="col"></div>
          </div>
        )}
      </div>
    </>
  );
};
