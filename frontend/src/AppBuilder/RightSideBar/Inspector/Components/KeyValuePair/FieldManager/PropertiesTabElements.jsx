import React from 'react';
import { resolveReferences } from '@/_helpers/utils';
import { useTranslation } from 'react-i18next';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { ProgramaticallyHandleProperties } from '../../Table/ProgramaticallyHandleProperties';
import { ValidationProperties } from '../../Table/ColumnManager/ValidationProperties';
import CustomSelect from '@/_ui/Select';
import defaultStyles from '@/_ui/Select/styles';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { getFieldIcon, FIELD_TYPE_OPTIONS } from '../utils';
import { components } from 'react-select';
import Check from '@/_ui/Icon/solidIcons/Check';

//TO-DO --> Update it to use resuable Table components
const CustomOption = (props) => {
  const FieldIcon = getFieldIcon(props.data.value);

  return (
    <components.Option {...props}>
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          {FieldIcon && <FieldIcon width="16" height="16" />}
          <span>{props.label}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {props.isSelected && (
            <span>
              <Check width={'20'} fill={'#3E63DD'} />
            </span>
          )}
        </div>
      </div>
    </components.Option>
  );
};

const CustomValueContainer = ({ data, ...props }) => {
  const Icon = getFieldIcon(data.value);
  return (
    <div className="d-flex align-items-center gap-2">
      {Icon && <Icon width="16" height="16" />}
      <span>{data.label}</span>
    </div>
  );
};

const DropdownIndicator = (props) => {
  return (
    <div {...props}>
      {props.selectProps.menuIsOpen ? (
        <SolidIcon name="arrowUpTriangle" width="16" height="16" fill={'#6A727C'} />
      ) : (
        <SolidIcon name="arrowDownTriangle" width="16" height="16" fill={'#6A727C'} />
      )}
    </div>
  );
};

export const PropertiesTabElements = ({
  field,
  index,
  darkMode,
  currentState,
  onFieldItemChange,
  getPopoverFieldSource,
  setFieldPopoverRootCloseBlocker,
  component,
  props,
  fieldEventChanged,
}) => {
  const { t } = useTranslation();

  const customStylesForSelect = {
    ...defaultStyles(darkMode, '100%'),
  };

  return (
    <>
      {/* Field Type Selector */}
      <div className="field px-3" data-cy={`dropdown-field-type`} onClick={(e) => e.stopPropagation()}>
        <label data-cy={`label-field-type`} className="form-label">
          {t('widget.KeyValuePair.fieldType', 'Field type')}
        </label>

        <CustomSelect
          options={FIELD_TYPE_OPTIONS}
          components={{
            DropdownIndicator,
            Option: CustomOption,
            SingleValue: CustomValueContainer,
          }}
          onChange={(value) => {
            onFieldItemChange(index, 'fieldType', value);
          }}
          value={field.fieldType}
          useCustomStyles={true}
          styles={customStylesForSelect}
          className={`column-type-table-inspector`}
        />
      </div>

      {/* Field Name */}
      <div className="field px-3" data-cy={`input-and-label-field-name`}>
        <label data-cy={`label-field-name`} className="form-label">
          {t('widget.KeyValuePair.fieldName', 'Field name')}
        </label>
        <CodeHinter
          currentState={currentState}
          initialValue={field.name}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder={field.name}
          onChange={(value) => onFieldItemChange(index, 'name', value)}
          componentName={getPopoverFieldSource(field.fieldType, 'name')}
          popOverCallback={(showing) => {
            setFieldPopoverRootCloseBlocker('name', showing);
          }}
        />
      </div>

      {/* Key */}
      <div data-cy={`input-and-label-key`} className="field px-3">
        <label className="form-label">{t('widget.KeyValuePair.key', 'Key')}</label>
        <CodeHinter
          currentState={currentState}
          initialValue={field.key}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder={field.name}
          onChange={(value) => onFieldItemChange(index, 'key', value)}
          componentName={getPopoverFieldSource(field.fieldType, 'key')}
          popOverCallback={(showing) => {
            setFieldPopoverRootCloseBlocker('fieldKey', showing);
          }}
        />
      </div>

      {/* Make Editable Toggle with Validation */}
      {!['image', 'link'].includes(field.fieldType) && (
        <div className="border mx-3 column-popover-card-ui" style={{ borderRadius: '6px' }}>
          <div style={{ background: 'var(--surfaces-surface-02)', padding: '8px 12px' }}>
            <ProgramaticallyHandleProperties
              label="make editable"
              currentState={currentState}
              index={index}
              darkMode={darkMode}
              callbackFunction={onFieldItemChange}
              property="isEditable"
              props={field}
              component={component}
              paramMeta={{ type: 'toggle', displayName: 'Make editable' }}
              paramType="properties"
            />
          </div>
          {(field?.fxActiveFields?.includes('isEditable') || resolveReferences(field?.isEditable)) && (
            <ValidationProperties
              column={field}
              index={index}
              darkMode={darkMode}
              currentState={currentState}
              onColumnItemChange={onFieldItemChange}
              getPopoverFieldSource={getPopoverFieldSource}
              setColumnPopoverRootCloseBlocker={setFieldPopoverRootCloseBlocker}
            />
          )}
        </div>
      )}

      {/* Visibility Toggle */}
      <div className="border mx-3 column-popover-card-ui" style={{ borderRadius: '6px', marginTop: '-8px' }}>
        <div style={{ background: 'var(--surfaces-surface-02)', padding: '8px 12px' }}>
          <ProgramaticallyHandleProperties
            label="Visibility"
            currentState={currentState}
            index={index}
            darkMode={darkMode}
            callbackFunction={onFieldItemChange}
            property="fieldVisibility"
            props={field}
            component={component}
            paramMeta={{ type: 'toggle', displayName: 'Visibility' }}
            paramType="properties"
          />
        </div>
      </div>
    </>
  );
};
