import React from 'react';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import CodeHinter from '@/AppBuilder/CodeEditor';
import EmptyTabContent from './EmptyTabContent';

export default ({
  options = [],
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
  onInputChange,
}) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className="tab-content-wrapper">
      {options.length === 0 && !bodyToggle && (
        <EmptyTabContent addNewKeyValuePair={addNewKeyValuePair} paramType={paramType} />
      )}
      {!bodyToggle &&
        options.map((option, index) => {
          return (
            <>
              <div className="row-container query-manager-border-color" key={index}>
                <div className="fields-container mb-1">
                  <div className="field col-4 rounded-start rest-api-codehinter-key-field">
                    <CodeHinter
                      type="basic"
                      initialValue={option[0]}
                      placeholder="Key"
                      onChange={onChange(paramType, 0, index)}
                      onInputChange={onInputChange(paramType, index)}
                      componentName={`${componentName}/${tabType}::key::${index}`}
                    />
                  </div>
                  <div className="field col rest-api-options-codehinter" style={{ width: '200px' }}>
                    <CodeHinter
                      type="basic"
                      initialValue={option[1]}
                      placeholder="Value"
                      onChange={onChange(paramType, 1, index)}
                      onInputChange={onInputChange(paramType, index)}
                      componentName={`${componentName}/${tabType}::value::${index}`}
                    />
                  </div>
                  <button
                    className={`d-flex justify-content-center align-items-center delete-field-option bg-transparent border-0 rounded-0 border-top border-bottom border-end rounded-end ${
                      darkMode ? 'delete-field-option-dark' : ''
                    }`}
                    role="button"
                    onClick={() => {
                      removeKeyValuePair(paramType, index);
                    }}
                  >
                    <Trash fill="var(--slate9)" style={{ height: '16px' }} />
                  </button>
                </div>
              </div>
            </>
          );
        })}
      {bodyToggle && (
        <div>
          <CodeHinter
            type="extendedSingleLine"
            initialValue={jsonBody ?? ''}
            lang="javascript"
            height={'300px'}
            className="query-hinter"
            onChange={(value) => onJsonBodyChange(value)}
            componentName={`${componentName}/${tabType}`}
          />
        </div>
      )}
    </div>
  );
};
