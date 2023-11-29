import React from 'react';
import { useTranslation } from 'react-i18next';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';

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
                      initialValue={option[0]}
                      theme={theme}
                      height={'32px'}
                      placeholder="Key"
                      onChange={onChange(paramType, 0, index)}
                      componentName={`${componentName}/${tabType}::key::${index}`}
                    />
                  </div>
                  <div className="field col overflow-hidden border ">
                    <CodeHinter
                      initialValue={option[1]}
                      theme={theme}
                      height={'32px'}
                      placeholder="Value"
                      onChange={onChange(paramType, 1, index)}
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
      {bodyToggle ? (
        <div>
          <CodeHinter
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
        <div className="d-flex mb-2" style={{ maxHeight: '32px' }}>
          <ButtonSolid variant="ghostBlue" size="sm" onClick={() => addNewKeyValuePair(paramType)}>
            <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
            &nbsp;&nbsp;{t('editor.inspector.eventManager.addKeyValueParam', 'Add more')}
          </ButtonSolid>
        </div>
      )}
    </div>
  );
};
