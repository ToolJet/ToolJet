import React from 'react';
import cx from 'classnames';
import { get, isEmpty } from 'lodash';
import Input from '@/_ui/Input';
import InputV3 from '@/_ui/Input-V3';
import Textarea from '@/_ui/Textarea';
import Select from '@/_ui/Select';
import Headers from '@/_ui/HttpHeaders';
import Toggle from '@/_ui/Toggle';
import { ButtonSolid } from './AppButton';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const DynamicFormV2 = ({
  schema,
  options,
  optionchanged,
  optionsChanged,
  selectedDataSource,
  isEditMode,
  layout = 'vertical',
  onBlur,
  setDefaultOptions,
  setValidationFailed,
}) => {
  const [computedProps, setComputedProps] = React.useState({});
  const isHorizontalLayout = layout === 'horizontal';


  const ajv = React.useMemo(() => {
    try {
      const instance = new Ajv({
        allErrors: true,
        strict: false,
        coerceTypes: true,
      });
      addFormats(instance);
      return instance;
    } catch (error) {
      return new Ajv();
    }
  }, []);

  React.useLayoutEffect(() => {
    if (!isEditMode || isEmpty(options)) {
      const defaults = {};
      Object.entries(schema.properties).forEach(([key, property]) => {
        if ('default' in property) {
          defaults[key] = property.default;
        }
      });
  
      if (!isEmpty(defaults)) {
        optionsChanged(defaults ?? {});
        typeof setDefaultOptions === 'function' && setDefaultOptions(defaults);
      }
    }
  }, [schema, isEditMode]);

  const getElement = (property) => {
    const { ui_widget } = property;
    switch (ui_widget) {
      case 'text':
        return Input;
      case 'password-v3':
      case 'text-v3':
        return InputV3;
      case 'textarea':
        return Textarea;
      case 'toggle':
        return Toggle;
      case 'dropdown-component-flip':
        return Select;
      case 'react-component-headers':
        return Headers;
      default:
        return Input;
    }
  };

  const getElementProps = (property, key) => {
    const { title, description, ui_widget, encrypted, enum: enumValues, enumNames, width } = property;

    const isRequired = getRequiredFields().includes(key);
    const currentValue = options?.[key]?.value !== undefined ? options[key].value : options?.[key];

    switch (ui_widget) {
      case 'password':
      case 'text':
      case 'textarea': {
        const useEncrypted = encrypted || ui_widget === 'password';
        return {
          key,
          ui_widget,
          ui_label: title,
          placeholder: useEncrypted ? '**************' : description,
          className: cx('form-control', {
            'dynamic-form-encrypted-field': useEncrypted,
          }),
          style: { marginBottom: '0px !important' },
          helpText: property.helpText,
          value: currentValue || '',
          onChange: (e) => optionchanged(key, e.target.value, true),
          isGDS: true,
          workspaceVariables: [],
          workspaceConstants: [],
          encrypted: useEncrypted,
          onBlur,
        };
      }
      case 'password-v3':
      case 'text-v3': {
        const useEncrypted = encrypted || ui_widget === 'password-v3';
        return {
          key,
          ui_widget,
          ui_label: title,
          placeholder: useEncrypted ? '**************' : description,
          className: cx('form-control', {
            'dynamic-form-encrypted-field': useEncrypted,
          }),
          style: { marginBottom: '0px !important' },
          helpText: property.helpText,
          value: currentValue || '',
          onChange: (e) => optionchanged(key, e.target.value, true),
          validate: (e) => checkValidation(key, isRequired, e.target.value),
          isGDS: true,
          workspaceVariables: [],
          workspaceConstants: [],
          encrypted: useEncrypted,
          onBlur,
          isRequired: isRequired,
        };
      }
      case 'dropdown-component-flip': {
        const dropdownOptions = enumValues?.map((value, index) => ({
          value,
          name: enumNames?.[index] ?? value,
        }));

        return {
          options: dropdownOptions,
          value: currentValue,
          onChange: (value) => optionchanged(key, value),
          width: width || '100%',
          defaultValue: property.default,
        };
      }
      case 'toggle':
        return {
          defaultChecked: currentValue,
          checked: currentValue,
          onChange: (e) => optionchanged(key, e.target.checked),
        };

      default:
        return {};
    }
  };

  const processFieldConditions = (fieldName, fieldSchema, values) => {
    const fieldValue = options?.[fieldName]?.value !== undefined
      ? options[fieldName].value
      : options?.[fieldName] !== undefined
        ? options[fieldName]
        : values?.[fieldName] !== undefined
          ? values[fieldName]
          : fieldSchema.default;

    if (fieldValue === undefined) return;

    schema.allOf?.forEach(condition => {
      if (condition.if?.properties?.[fieldName]?.const === fieldValue) {
        condition.then?.required?.forEach(requiredField => {
          const requiredFieldSchema = schema.properties[requiredField];
          if (requiredFieldSchema?.default !== undefined) {
            values[requiredField] = requiredFieldSchema.default;
          }
        });

        condition.then?.allOf?.forEach(nestedCondition => {
          Object.keys(nestedCondition.if?.properties || {}).forEach(nestedField => {
            if (values[nestedField] !== undefined) {
              processFieldConditions(nestedField, schema.properties[nestedField], values);
            }
          });
        });
      }
    });
  };

  const checkValidation = (key, isRequired, fieldValue) => {

    const fieldSchema = schema?.properties?.[key];
    if (!fieldSchema) {
      setValidationFailed(false);
      return { valid: true, message: `${key} is valid` };
    }
    if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
      if (isRequired) {
        setValidationFailed(true);
        return { valid: false, message: `${key} is required` };
      }
      setValidationFailed(false);
      return { valid: true, message: `${key} is empty, validation skipped` };
    }

    let valueToValidate = fieldValue;
    if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
      valueToValidate = Number(fieldValue);
      if (isNaN(valueToValidate)) {
        setValidationFailed(true);
        return { valid: false, message: 'Please enter a valid number' };
      }
    }
    if (fieldSchema.type === 'string' && !isNaN(fieldValue)) {
      setValidationFailed(true);
      return { valid: false, message: 'Should not be a number' };
    }

    const validationSchema = {
      type: 'object',
      properties: {
        [key]: fieldSchema,
      },
      ...(isRequired && { required: [key] }),
    };

    const validate = ajv.compile(validationSchema);
    const isValid = validate({ [key]: valueToValidate });

    if (!isValid) {
      setValidationFailed(true);
      const errors = validate.errors;

      if (errors?.[0]) {
        const errorMessages = {
          type: `Invalid type. Expected ${fieldSchema.type}`,
          format: 'Invalid format',
          pattern: 'Invalid pattern',
          minimum: `Must be greater than or equal to ${fieldSchema.minimum}`,
          maximum: `Must be less than or equal to ${fieldSchema.maximum}`,
          minLength: `Must be at least ${fieldSchema.minLength} characters`,
          maxLength: `Must not exceed ${fieldSchema.maxLength} characters`,
          enum: 'Value must be one of the allowed options'
        };

        return {
          valid: false,
          message: errorMessages[errors[0].keyword] || errors[0].message || 'Invalid value'
        };
      }
    }

    setValidationFailed(false);
    return { valid: true, message: `${key} is valid` };
  };

  const getRequiredFields = () => {
    const requiredFields = [...(schema.required || [])];

    schema.allOf?.forEach(condition => {
      const ifProps = condition.if?.properties || {};
      const matches = Object.entries(ifProps).every(([key, constraint]) => {
        const value = options?.[key]?.value !== undefined
          ? options[key].value
          : options?.[key] !== undefined
            ? options[key]
            : schema.properties[key]?.default;

        return value === constraint.const;
      });

      if (matches) {
        requiredFields.push(...(condition.then?.required || []));

        condition.then?.allOf?.forEach(nestedCondition => {
          const nestedMatches = Object.entries(nestedCondition.if?.properties || {}).every(
            ([key, constraint]) => {
              const value = options?.[key]?.value !== undefined
                ? options[key].value
                : options?.[key];
              return value === constraint.const;
            }
          );

          if (nestedMatches) {
            requiredFields.push(...(nestedCondition.then?.required || []));
          }
        });
      }
    });

    return [...new Set(requiredFields)].filter(
      field => !schema.properties[field]?.optional || 
      (options[field]?.value && options[field].value !== schema.properties[field].default)
    );
  };

  const getVisibleFields = () => {
    const fields = new Set(schema.required || []);

    schema.allOf?.forEach(condition => {
      const ifProps = condition.if?.properties || {};
      const matches = Object.entries(ifProps).every(([key, constraint]) => {
        const value = options?.[key]?.value !== undefined
          ? options[key].value
          : options?.[key];
        return value === constraint.const;
      });

      if (matches) {
        condition.then?.required?.forEach(field => fields.add(field));

        condition.then?.allOf?.forEach(nestedCondition => {
          const nestedIfProps = nestedCondition.if?.properties || {};
          const nestedMatches = Object.entries(nestedIfProps).every(
            ([key, constraint]) => {
              const value = options?.[key]?.value !== undefined
                ? options[key].value
                : options?.[key];
              return value === constraint.const;
            }
          );

          if (nestedMatches) {
            nestedCondition.then?.required?.forEach(field => fields.add(field));
          }
        });
      }
    });

    return Array.from(fields);
  };

  const renderFields = () => {
    const visibleFields = getVisibleFields();
    const requiredFields = getRequiredFields();

    return visibleFields.map(fieldName => {
      const fieldSchema = schema.properties[fieldName];
      if (!fieldSchema) return null;

      const Element = getElement(fieldSchema);
      const elementProps = getElementProps(fieldSchema, fieldName);
      const isSpecificComponent = ['tooljetdb-operations'].includes(fieldSchema.ui_widget);

      return (
        <div className={`${isHorizontalLayout ? '' : 'row'} my-2`}>
          <div
            key={fieldName}
            className={(
              {
                'flex-grow-1': isHorizontalLayout && !isSpecificComponent,
                'w-100': isHorizontalLayout && fieldSchema.ui_widget !== 'codehinter',
              },
              'dynamic-form-element'
            )}
            style={{ width: '100%' }}
          >
            {fieldSchema.ui_widget !== 'text-v3' && fieldSchema.ui_widget !== 'password-v3' && (
              <label className="form-label">{fieldSchema.title}</label>
            )}
              <Element {...elementProps} isHorizontalLayout={isHorizontalLayout} />
          </div>
        </div>
      );
    });
  };

  return (
    <form className={cx('dynamic-form', { 'horizontal-layout': isHorizontalLayout })}>
      {renderFields()}
    </form>
  );
};

export default DynamicFormV2;