import React from 'react';
import { useTranslation } from 'react-i18next';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
import AddRectangle from '../../../../_ui/Icon/bulkIcons/AddRectangle';
import Remove from '../../../../_ui/Icon/solidIcons/Remove';

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
  const { t } = useTranslation();
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className="tab-content-wrapper">
      {!bodyToggle &&
        options.map((option, index) => {
          return (
            <>
              <div className="row-container query-manager-border-color" key={index}>
                <div className="fields-container mb-2">
                  <div className="field col-4 overflow-hidden border-top border-bottom border-start rounded-start">
                    <CodeHinter
                      currentState={currentState}
                      initialValue={option[0]}
                      theme={theme}
                      height={'32px'}
                      placeholder="Key"
                      onChange={onChange(paramType, 0, index)}
                      componentName={`${componentName}/${tabType}::key::${index}`}
                    />
                  </div>
                  <div className="field col overflow-hidden border rounded-end">
                    <CodeHinter
                      currentState={currentState}
                      initialValue={option[1]}
                      theme={theme}
                      height={'32px'}
                      placeholder="Value"
                      onChange={onChange(paramType, 1, index)}
                      componentName={`${componentName}/${tabType}::value::${index}`}
                    />
                  </div>
                  <button
                    className="d-flex justify-content-center align-items-center delete-field-option bg-transparent border-0"
                    role="button"
                    onClick={() => {
                      removeKeyValuePair(paramType, index);
                    }}
                  >
                    <Remove fill="#11181C" />
                  </button>
                </div>
              </div>
            </>
          );
        })}
      {bodyToggle ? (
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
      ) : (
        <div className="d-flex" style={{ maxHeight: '32px' }}>
          <button
            className={`d-flex align-items-center justify-content-center add-tabs bg-transparent border-0 color-light-indigo-09`}
            style={{ background: darkMode ? 'inherit' : '#F8F9FA', height: '32px' }}
            onClick={() => addNewKeyValuePair(paramType)}
            role="button"
          >
            <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
            &nbsp;&nbsp;{t('editor.inspector.eventManager.addKeyValueParam', 'Add more')}
          </button>
          <div className="col" style={{ flex: '1', background: darkMode ? '' : '#ffffff' }}></div>
        </div>
      )}
    </div>
  );
};
