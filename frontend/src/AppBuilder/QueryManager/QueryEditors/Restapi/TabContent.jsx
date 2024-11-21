import React from 'react';
import { useTranslation } from 'react-i18next';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import CodeHinter from '@/AppBuilder/CodeEditor';
import InfoIcon from '@assets/images/icons/info.svg';
import PlusRectangle from '@/_ui/Icon/solidIcons/PlusRectangle';
import Warning from '@/_ui/Icon/solidIcons/Warning';

export default ({
  options = [],
  theme,
  onChange,
  jsonBody, // FIXME: Remove this once data migration to raw_body is complete
  rawBody,
  onRawBodyChange,
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
      {options.length === 0 && (
        <div
          className="empty-paramlist w-100"
          style={{
            background: darkMode && 'var(--interactive-default)',
            height: '69px',
            position: 'relative',
            top: '-8px',
          }}
        >
          <span style={{ marginBottom: '3px' }}>
            <Warning fill="#6A727C" width={'20px'} />
          </span>
          <span style={{ fontSize: '12px' }}>No key value pairs added</span>
        </div>
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
                      componentName={`${componentName}/${tabType}::key::${index}`}
                    />
                  </div>
                  <div className="field col rest-api-options-codehinter" style={{ width: '200px' }}>
                    <CodeHinter
                      type="basic"
                      initialValue={option[1]}
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
            type="extendedSingleLine"
            initialValue={(rawBody || jsonBody) ?? ''} // If raw_body is not set, set initial value to legacy json_body if present
            height={'300px'}
            className="query-hinter"
            onChange={(value) => onRawBodyChange(value)}
            componentName={`${componentName}/${tabType}`}
          />
        </div>
      ) : (
        <button
          onClick={() => addNewKeyValuePair(paramType)}
          className="add-params-btn"
          id="runjs-param-add-btn"
          data-cy={`runjs-add-param-button`}
          style={{ background: 'none', border: 'none', width: '100px' }}
        >
          <p className="m-0 text-default">
            <PlusRectangle fill={'var(--icons-default)'} width={15} />
            <span style={{ marginLeft: '6px' }}>{t('editor.inspector.eventManager.addKeyValueParam', 'Add more')}</span>
          </p>
        </button>
      )}
    </div>
  );
};
