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

const FxSelect = ({
  label,
  paramName,
  initialValue,
  darkMode,
  paramUpdated,
  options,
  onValueChange,
  paramType = 'properties',
  isFxActive: _isFxActive,
}) => {
  const [isFxActive, setIsFxActive] = useState(_isFxActive || false);

  const handleFxButtonClick = () => {
    paramUpdated({ name: paramName }, 'fxActive', !isFxActive, paramType);
    setIsFxActive(!isFxActive);
  };

  return (
    <div
      data-cy={`input-date-display-format`}
      className="field mb-2 w-100 input-date-display-format"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="field mb-2" onClick={(e) => e.stopPropagation()}>
        <div className="d-flex justify-content-between mb-1">
          <label className="form-label">{label}</label>
          <div className={cx({ 'hide-fx': !isFxActive })}>
            <FxButton active={isFxActive} onPress={handleFxButtonClick} />
          </div>
        </div>
        {isFxActive ? (
          <CodeHinter
            initialValue={initialValue}
            theme={darkMode ? 'monokai' : 'default'}
            mode="javascript"
            lineNumbers={false}
            onChange={onValueChange}
          />
        ) : (
          <Select
            options={options}
            value={initialValue ?? '*/*'}
            search={true}
            closeOnSelect={true}
            onChange={onValueChange}
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

/** Remove minFileCount and maxFileCount validations if multiple file selection is disabled */
const getValidations = (componentMeta, component) => {
  const validations = Object.keys(componentMeta.validation || {});
  const enableMultipleValue = resolveReferences(component.component.definition.properties.enableMultiple?.value ?? false);
  const enableMultipleFxActive = component.component.definition.properties.enableMultiple?.fxActive;

  if (!enableMultipleValue && !enableMultipleFxActive) {
    return validations.filter((validation) => !['minFileCount', 'maxFileCount'].includes(validation));
  }
  return validations;
};

const getPropertiesBySection = (propertiesMeta) => {
  const properties = [];
  const additionalActions = [];
  const dataProperties = [];

  for (const [key, value] of Object.entries(propertiesMeta)) {
    if (value?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (value?.accordian === 'Data') {
      dataProperties.push(key);
    } else {
      properties.push(key);
    }
  }
  return { properties, additionalActions, dataProperties };
};

const getConditionalAccordionItems = (component, renderCustomElement) => {
  const parseContent = resolveReferences(component.component.definition.properties.parseContent?.value ?? false);
  const options = ['parseContent'];
  let renderOptions = options.map((option) => renderCustomElement(option));

  const conditionalOptions = [{ name: 'parseFileType', condition: parseContent }];
  conditionalOptions.forEach(({ name, condition }) => {
    if (condition) renderOptions.push(renderCustomElement(name));
  });
  return renderOptions;
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
  // const fileTypeValue = resolvedValidations?.fileType;
  const fileTypeValue = componentMeta?.definition?.validation?.fileType?.value;
  const isFileTypeFxActive = componentMeta?.definition?.validation?.fileType?.fxActive || false;

  const renderCustomElement = (param, paramType = 'properties') =>
    renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType, currentState);

  // Debug logs
  // console.log('component.component.definition', component.component.definition);

  const events = Object.keys(componentMeta.events);
  const validations = getValidations(componentMeta, component);

  // console.log('validations', validations, enableMultipleValue, component.component.definition.properties.enableMultiple?.value, enableMultipleFxActive);

  const { additionalActions, dataProperties } = getPropertiesBySection(componentMeta?.properties);
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

  // Insert conditional accordion items
  accordionItems[0].children.push(...getConditionalAccordionItems(component, renderCustomElement));

  // Insert FxSelect for file type
  accordionItems[2].children[1] = (
    <FxSelect
      label={'File type'}
      paramName="fileType"
      initialValue={fileTypeValue}
      darkMode={darkMode}
      paramUpdated={paramUpdated}
      options={FILE_TYPE_OPTIONS}
      paramType="validation"
      isFxActive={isFileTypeFxActive}
      onValueChange={(value) => paramUpdated({ name: 'fileType' }, 'value', value, 'validation')}
    />
  );

  return <Accordion items={accordionItems} />;
};
