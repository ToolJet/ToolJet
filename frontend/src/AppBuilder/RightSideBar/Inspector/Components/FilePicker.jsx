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



const getPropertiesBySection = (propertiesMeta) => {
  const properties = [];
  const additionalActions = [];
  const dataProperties = [];

  for (const [key, value] of Object.entries(propertiesMeta)) {
    if (value?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (value?.accordian === 'Data' || key === 'parseContent') {
      dataProperties.push(key);
    } else {
      properties.push(key);
    }
  }
  return { properties, additionalActions, dataProperties };
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

  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  const { additionalActions, dataProperties } = getPropertiesBySection(componentMeta?.properties);

  const accordionItems = baseComponentProperties(
    dataProperties,
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

  // Insert FxSelect for file type
  // Note: Adjusting index if necessary, assuming properties is always first index 0.
  // Properties -> 0, Events -> 1, Validation -> 2
  // We need to double check where the fileType is located. 
  // It is properly located in Validation section which is usually 3rd if Events exist.
  // baseComponentProperties returns [Properties, Events, Validation, ...].
  // Safe way is to find the Validation section.

  const validationSection = accordionItems.find(item => item.title === 'Validation');
  if (validationSection) {
    // Find the index of fileType
    // This part is a bit brittle in original code too: accordionItems[2].children[1]
    // Let's keep it simple as before, but safer?
    // Original code: accordionItems[2].children[1] = ...
    // We will look for 3rd item which is likely validation.

    // However, we removed the "conditional accordion items" injection which was modifying accordionItems[0] (Properties).
    // So indexes might be stable.

    if (accordionItems[2] && accordionItems[2].title === 'Validation') {
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
    }
  }

  return <Accordion items={accordionItems} />;
};
