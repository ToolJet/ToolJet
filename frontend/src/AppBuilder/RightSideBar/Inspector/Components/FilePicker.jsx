import React, { useState } from 'react';
import Accordion from '@/_ui/Accordion';
import { renderElement } from '../Utils';
import { baseComponentProperties } from './DefaultComponent';
import { resolveReferences } from '@/_helpers/utils';
import cx from 'classnames';
import styles from '@/_ui/Select/styles';
import useStore from '@/AppBuilder/_stores/store';

import Select from '@/_ui/Select';
import CodeHinter from '@/AppBuilder/CodeEditor';
import FxButton from '@/AppBuilder/CodeBuilder/Elements/FxButton';

const FILE_TYPE_OPTIONS = [
  { value: '*/*', label: 'Any Files' },
  { value: 'image/*', label: 'Image files' },
  { value: '.pdf,.doc,.docx,.ppt,.pptx', label: 'Document files' },
  { value: '.xls,.xlsx,.csv,.ods', label: 'Spreadsheet files' },
  { value: 'text/*,.md,.json,.xml,.yaml', label: 'Text files' },
  { value: 'audio/*', label: 'Audio files' },
  { value: 'video/*', label: 'Video files' },
  { value: '.zip,.rar,.7z,.tar,.gz', label: 'Archive/Compressed files' },
];

const FxSelect = ({ label, paramName, initialValue, darkMode, paramUpdated, options, onValueChange }) => {
  const [isFxActive, setIsFxActive] = useState(false);
  return (
    <div
      data-cy={`input-date-display-format`}
      className="field mb-2 w-100 input-date-display-format"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="field mb-2" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-content-between mb-1">
          <label className="form-label">{label}</label>
          <div
            className={cx({
              'hide-fx': !isFxActive,
            })}
          >
            <FxButton
              active={isFxActive}
              onPress={() => {
                paramUpdated({ name: paramName }, 'fxActive', !isFxActive, 'properties');
                setIsFxActive(!isFxActive);
              }}
            />
          </div>
        </div>
        {isFxActive ? (
          <CodeHinter
            initialValue={initialValue}
            theme={darkMode ? 'monokai' : 'default'}
            mode="javascript"
            lineNumbers={false}
            onChange={(value) => onValueChange(value)}
          />
        ) : (
          <Select
            options={options}
            value={initialValue ?? 'image/*'}
            search={true}
            closeOnSelect={true}
            onChange={(value) => onValueChange(value)}
            fuzzySearch
            placeholder="Select.."
            useCustomStyles={true}
            styles={styles(darkMode, '100%', 32, { fontSize: '12px' })}
          />
        )}
      </div>
    </div>
  );
};

export const FilePicker = ({ componentMeta, darkMode, ...restProps }) => {
  const {
    layoutPropertyChanged,
    component,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
  } = restProps;

  const resolvedValidations = useStore((state) => state.getResolvedComponent(component.id)?.validation);
  const fileTypeValue = resolvedValidations?.fileType;

  const renderCustomElement = (param, paramType = 'properties') => {
    return renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType, currentState);
  };

  const conditionalAccordionItems = (component) => {
    const parseContent = resolveReferences(component.component.definition.properties.parseContent?.value ?? false);
    const options = ['parseContent'];

    let renderOptions = [];

    options.map((option) => renderOptions.push(renderCustomElement(option)));
    const conditionalOptions = [{ name: 'parseFileType', condition: parseContent }];

    conditionalOptions.map(({ name, condition }) => {
      if (condition) renderOptions.push(renderCustomElement(name));
    });
    return renderOptions;
  };

  let properties = [];
  let additionalActions = [];
  let dataProperties = [];

  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.accordian === 'Data') {
      dataProperties.push(key);
    } else {
      properties.push(key);
    }
  }
  const filteredProperties = [...dataProperties];

  const accordionItems = baseComponentProperties(
    filteredProperties,
    events,
    component,
    componentMeta,
    layoutPropertyChanged,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    validations,
    darkMode,
    [],
    additionalActions
  );
  // accordionItems.splice(1, 0, ...conditionalAccordionItems(component));

  accordionItems[0].children.push(...conditionalAccordionItems(component));
  accordionItems[2].children[1] = (
    <FxSelect
      label={'File type'}
      paramName="fileType"
      initialValue={fileTypeValue}
      darkMode={darkMode}
      paramUpdated={paramUpdated}
      options={FILE_TYPE_OPTIONS}
      onValueChange={(value) => paramUpdated({ name: 'fileType' }, 'value', value, 'validation')}
    />
  );

  return <Accordion items={accordionItems} />;
};
