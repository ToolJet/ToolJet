import React from 'react';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import CodeHinter from '@/AppBuilder/CodeEditor';
import EmptyTabContent from '../Restapi/EmptyTabContent';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';

export default function GraphqlTabContent({
  options = [],
  onChange,
  removeKeyValuePair,
  addNewKeyValuePair,
  componentName,
  tabType,
  paramType,
  onInputChange,
}) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className="tab-content-wrapper" data-cy={`${generateCypressDataCy(tabType)}-tab-content`}>
      {options.length === 0 && (
        <EmptyTabContent addNewKeyValuePair={addNewKeyValuePair} paramType={paramType} />
      )}
      {options.map((option, index) => (
        <div
          className="row-container query-manager-border-color"
          key={index}
          data-cy={`${generateCypressDataCy(tabType)}-row-${index}`}
        >
          <div className="fields-container mb-1 graphql-key-value">
            <div className="field col-4 rounded-start graphql-codehinter-key-field">
              <CodeHinter
                type="basic"
                initialValue={option[0]}
                placeholder="Key"
                onChange={(val) => onChange(paramType, 0, index)(val)}
                onInputChange={onInputChange ? onInputChange(paramType, index) : undefined}
                componentName={`${componentName}/${tabType}::key::${index}`}
                cyLabel={`${tabType}-key-${index}`}
              />
            </div>
            <div className="field col graphql-options-codehinter" style={{ width: '200px' }}>
              <CodeHinter
                type="basic"
                initialValue={option[1]}
                placeholder="Value"
                onChange={(val) => onChange(paramType, 1, index)(val)}
                onInputChange={onInputChange ? onInputChange(paramType, index) : undefined}
                componentName={`${componentName}/${tabType}::value::${index}`}
                cyLabel={`${tabType}-value-${index}`}
              />
            </div>
            <button
              className={`d-flex justify-content-center align-items-center delete-field-option bg-transparent border-0 rounded-0 border-top border-bottom border-end rounded-end qm-delete-btn ${
                darkMode ? 'delete-field-option-dark' : ''
              }`}
              role="button"
              onClick={() => removeKeyValuePair(paramType, index)}
              data-cy={`${generateCypressDataCy(tabType)}-delete-${index}`}
            >
              <Trash fill="var(--slate9)" style={{ height: '16px' }} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}