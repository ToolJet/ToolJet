import React from 'react';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';

export default ({
  options = [],
  currentState,
  theme,
  onChange,
  componentName,
  removeKeyValuePair,
  paramType,
  tabType,
}) => {
  return (
    <>
      <div className="row">
        {options.map((option, index) => {
          return (
            <div className="row input-group mt-1" key={index}>
              <div className="row">
                <div className="col-6 field">
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
                <div className="col"></div>
                <div className="col-6 field tab-pane-body">
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
              </div>
              {index > 0 && (
                <span
                  className="btn-sm col mt-1 color-primary"
                  role="button"
                  style={{ marginLeft: '-5px' }}
                  onClick={() => {
                    removeKeyValuePair(paramType, index);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon icon-tabler icon-tabler-trash"
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
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
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};
