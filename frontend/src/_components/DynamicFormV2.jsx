import React from 'react';
import cx from 'classnames';
import DataSourceSchemaManager from '@/_helpers/dataSourceSchemaManager';
import Textarea from '@/_ui/Textarea';
import Input from '@/_ui/Input';
import Select from '@/_ui/Select';
import Headers from '@/_ui/HttpHeaders';
import Toggle from '@/_ui/Toggle';
import InputV3 from '@/_ui/Input-V3';
import { filter, find, isEmpty } from 'lodash';
import { ButtonSolid } from './AppButton';
import { useGlobalDataSourcesStatus } from '@/_stores/dataSourcesStore';
import { canDeleteDataSource, canUpdateDataSource } from '@/_helpers';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { orgEnvironmentVariableService, orgEnvironmentConstantService } from '../_services';
import { Constants } from '@/_helpers/utils';
import {generateCypressDataCy} from '../modules/common/helpers/cypressHelpers.js';

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
  currentAppEnvironmentId,
  isGDS,
  validationMessages,
  setValidationMessages,
  clearValidationMessages,
  showValidationErrors,
  clearValidationErrorBanner,
}) => {
  const uiProperties = schema['tj:ui:properties'] || {};
  const dsm = React.useMemo(() => new DataSourceSchemaManager(schema), [schema]);
  const encryptedProperties = React.useMemo(() => dsm.getEncryptedProperties(), [dsm]);
  const [conditionallyRequiredProperties, setConditionallyRequiredProperties] = React.useState([]);
  const [workspaceVariables, setWorkspaceVariables] = React.useState([]);
  const [currentOrgEnvironmentConstants, setCurrentOrgEnvironmentConstants] = React.useState([]);
  const [computedProps, setComputedProps] = React.useState({});
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);
  const [interactedFields, setInteractedFields] = React.useState(new Set());

  const isHorizontalLayout = layout === 'horizontal';
  const prevDataSourceIdRef = React.useRef(selectedDataSource?.id);

  const globalDataSourcesStatus = useGlobalDataSourcesStatus();
  const { isEditing: isDataSourceEditing } = globalDataSourcesStatus;

  React.useEffect(() => {
    if (isGDS) {
      orgEnvironmentConstantService.getConstantsFromEnvironment(currentAppEnvironmentId).then((data) => {
        const constants = {
          globals: {},
          secrets: {},
        };
        data.constants.forEach((constant) => {
          if (constant.type === Constants.Secret) {
            constants.secrets[constant.name] = constant.value;
          } else {
            constants.globals[constant.name] = constant.value;
          }
        });

        setCurrentOrgEnvironmentConstants(constants);
      });

      orgEnvironmentVariableService.getVariables().then((data) => {
        const client_variables = {};
        const server_variables = {};
        data.variables.map((variable) => {
          if (variable.variable_type === 'server') {
            server_variables[variable.variable_name] = 'HiddenEnvironmentVariable';
          } else {
            client_variables[variable.variable_name] = variable.value;
          }
        });

        setWorkspaceVariables({ client: client_variables, server: server_variables });
      });
    }

    return () => {
      setWorkspaceVariables([]);
      setCurrentOrgEnvironmentConstants([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAppEnvironmentId]);

  React.useEffect(() => {
    if (!hasUserInteracted) return;

    const timeout = setTimeout(() => {
      validateOptions();
    }, 300);

    return () => clearTimeout(timeout);
  }, [options, hasUserInteracted, validateOptions]);

  const validateOptions = React.useCallback(async () => {
    try {
      const { valid, errors } = await dsm.validateData(options);

      const conditionallyRequiredFields = processAllOfConditions(schema, options);
      setConditionallyRequiredProperties(conditionallyRequiredFields);

      if (valid) {
        clearValidationMessages();
        clearValidationErrorBanner();
      } else {
        setValidationMessages(errors, schema, interactedFields);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  }, [
    dsm,
    options,
    processAllOfConditions,
    schema,
    clearValidationMessages,
    clearValidationErrorBanner,
    setValidationMessages,
    interactedFields,
  ]);

  const processAllOfConditions = React.useCallback((schema, options, path = []) => {
    let requiredFields = [];

    if (schema.allOf) {
      schema.allOf.forEach((condition) => {
        if (condition.if && condition.then) {
          const conditionMatches = Object.entries(condition.if.properties || {}).every(([propName, propCondition]) => {
            const propertyPath = [...path, propName];

            let currentValue = options;
            for (const segment of propertyPath) {
              if (!currentValue || typeof currentValue !== 'object') {
                return false;
              }
              currentValue = currentValue[segment]?.value;
            }

            return propCondition.const === currentValue;
          });

          if (conditionMatches) {
            if (condition.then.required) {
              requiredFields = [...requiredFields, ...condition.then.required];
            }

            if (condition.then.allOf) {
              const nestedRequired = processAllOfConditions({ allOf: condition.then.allOf }, options, path);
              requiredFields = [...requiredFields, ...nestedRequired];
            }

            if (condition.then.properties) {
              Object.entries(condition.then.properties).forEach(([propName, propSchema]) => {
                if (propSchema.allOf) {
                  const nestedRequired = processAllOfConditions({ allOf: propSchema.allOf }, options, [
                    ...path,
                    propName,
                  ]);
                  requiredFields = [...requiredFields, ...nestedRequired];
                }
              });
            }
          }
        }
      });
    }

    return requiredFields;
  }, []);

  React.useEffect(() => {
    if (showValidationErrors) {
      setHasUserInteracted(true);
      const allFieldKeys = Object.keys(options);
      setInteractedFields(new Set(allFieldKeys));
    }
  }, [showValidationErrors, options]);

  React.useEffect(() => {
    const prevDataSourceId = prevDataSourceIdRef.current;
    prevDataSourceIdRef.current = selectedDataSource?.id;
    const uiProperties = schema['tj:ui:properties'];
    if (!isEmpty(uiProperties)) {
      let fields = {};
      let encryptedFieldsProps = {};
      const flipComponentDropdown = find(uiProperties, ['widget', 'dropdown-component-flip']);

      if (flipComponentDropdown) {
        const selector = options?.[flipComponentDropdown?.key]?.value;
        const commonFieldsFromSslCertificate = uiProperties[selector]?.ssl_certificate?.commonFields;
        fields = {
          ...commonFieldsFromSslCertificate,
          ...flipComponentDropdown?.commonFields,
          ...uiProperties[selector],
        };
      } else {
        fields = { ...uiProperties };
      }

      const processFields = (fieldsObject) => {
        Object.keys(fieldsObject).forEach((key) => {
          const field = fieldsObject[key];
          const { widget, encrypted, key: propertyKey } = field;

          if (!canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource()) {
            encryptedFieldsProps[propertyKey] = {
              disabled: !!selectedDataSource?.id,
            };
          } else if (!isDataSourceEditing) {
            if (widget === 'password' || encrypted) {
              encryptedFieldsProps[propertyKey] = {
                disabled: true,
              };
            }
          } else {
            if ((widget === 'password' || encrypted) && !(propertyKey in computedProps)) {
              encryptedFieldsProps[propertyKey] = {
                disabled: !!selectedDataSource?.id,
              };
            }
          }

          // To check for nested dropdown-component-flip
          if (widget === 'dropdown-component-flip') {
            const selectedOption = options?.[field.key]?.value;

            if (field.commonFields) {
              processFields(field.commonFields);
            }

            if (selectedOption && fieldsObject[selectedOption]) {
              processFields(fieldsObject[selectedOption]);
            }
          }
        });
      };

      processFields(fields);

      if (uiProperties.renderForm) {
        Object.keys(uiProperties.renderForm).forEach((sectionKey) => {
          const section = uiProperties.renderForm[sectionKey];
          const { inputs } = section;
          if (inputs) {
            processFields(inputs);
          }
        });
      }

      if (prevDataSourceId !== selectedDataSource?.id) {
        setComputedProps({ ...encryptedFieldsProps });
      } else {
        setComputedProps({ ...computedProps, ...encryptedFieldsProps });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDataSource?.id, options, isDataSourceEditing]);

  const getElement = (type) => {
    switch (type) {
      case 'password':
      case 'text':
        return Input;
      case 'password-v3':
      case 'text-v3':
      case 'password-v3-textarea':
        return InputV3;
      case 'textarea':
        return Textarea;
      case 'toggle':
        return Toggle;
      case 'react-component-headers':
        return Headers;
      // TODO: Move dropdown component flip logic to be handled here
      // case 'dropdown-component-flip':
      //   return Select;
      default:
        return <div>Type is invalid</div>;
    }
  };

  const getElementProps = (uiProperties) => {
    const { label, description, widget, required, width, key, help_text: helpText, list, buttonText } = uiProperties;

    const isRequired = required || conditionallyRequiredProperties.includes(key);
    const isEncrypted = widget === 'password-v3' || encryptedProperties.includes(key);
    const currentValue = options?.[key]?.value;
    const skipValidation =
      (!hasUserInteracted && !showValidationErrors) || (!interactedFields.has(key) && !showValidationErrors);

    const handleOptionChange = (key, value, flag = true) => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
      }
      setInteractedFields((prev) => new Set(prev).add(key));
      optionchanged(key, value, flag);
    };

    switch (widget) {
      case 'password':
      case 'text':
      case 'textarea': {
        return {
          key,
          widget,
          label,
          placeholder: isEncrypted ? '**************' : description,
          className: cx('form-control', {
            'dynamic-form-encrypted-field': isEncrypted,
          }),
          style: { marginBottom: '0px !important' },
          helpText: helpText,
          value: currentValue || '',
          onChange: (e) => optionchanged(key, e.target.value, true),
          isGDS: true,
          workspaceVariables: [],
          workspaceConstants: [],
          encrypted: isEncrypted,
          onBlur,
        };
      }
      case 'password-v3':
      case 'password-v3-textarea':
      case 'text-v3': {
        return {
          key,
          widget,
          label,
          placeholder: isEncrypted ? '**************' : description,
          className: cx('form-control', {
            'dynamic-form-encrypted-field': isEncrypted,
          }),
          style: { marginBottom: '0px !important' },
          helpText: helpText,
          value: currentValue || '',
          onChange: (e) => handleOptionChange(key, e.target.value, true),
          isGDS: true,
          workspaceVariables: [],
          workspaceConstants: [],
          encrypted: isEncrypted,
          onBlur,
          isRequired: isRequired,
          isValidatedMessages: skipValidation
            ? { valid: null, message: '' } // skip validation for initial render and untouched elements
            : validationMessages[key]
            ? { valid: false, message: validationMessages[key] }
            : isRequired
            ? { valid: true, message: '' }
            : { valid: null, message: '' }, // handle optional && encrypted fields
          isDisabled: !canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource(),
        };
      }
      case 'react-component-headers': {
        let isRenderedAsQueryEditor;
        if (isGDS) {
          isRenderedAsQueryEditor = false;
        } else {
          isRenderedAsQueryEditor = !isGDS;
        }
        return {
          getter: key,
          options: isRenderedAsQueryEditor
            ? options?.[key] ?? schema?.defaults?.[key]
            : options?.[key]?.value ?? schema?.defaults?.[key]?.value,
          handleOptionChange,
          isRenderedAsQueryEditor,
          workspaceConstants: currentOrgEnvironmentConstants,
          isDisabled: !canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource(),
          encrypted: isEncrypted,
          buttonText,
          width: width,
        };
      }
      case 'toggle':
        return {
          defaultChecked: currentValue,
          checked: currentValue,
          onChange: (e) => handleOptionChange(key, e.target.checked, true),
        };
      case 'dropdown':
      case 'dropdown-component-flip':
        return {
          options: list,
          value: options?.[key]?.value || options?.[key],
          onChange: (value) => handleOptionChange(key, value, true),
          width: width || '100%',
          encrypted: options?.[key]?.encrypted,
        };
      default:
        return {};
    }
  };

  const getLayout = (uiProperties) => {
    if (isEmpty(uiProperties)) return null;
    const flipComponentDropdown = isFlipComponentDropdown(uiProperties);

    if (flipComponentDropdown) {
      return flipComponentDropdown;
    }

    const handleEncryptedFieldsToggle = (event, field) => {
      if (!canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource()) {
        return;
      }
      const isEditing = computedProps[field]['disabled'];
      if (isEditing) {
        optionchanged(field, '');
      } else {
        //Send old field value if editing mode disabled for encrypted fields
        const newOptions = { ...options };
        const oldFieldValue = selectedDataSource?.['options']?.[field];
        if (oldFieldValue) {
          optionsChanged({ ...newOptions, [field]: oldFieldValue });
        } else {
          delete newOptions[field];
          optionsChanged({ ...newOptions });
        }
      }
      setComputedProps({
        ...computedProps,
        [field]: {
          ...computedProps[field],
          disabled: !isEditing,
        },
      });
    };

    const renderLabel = (label, tooltip) => {
      const labelElement = (
        <label
          className="form-label"
          data-cy={`label-${generateCypressDataCy(label)}`}
          style={{ textDecoration: tooltip ? 'underline 2px dashed' : 'none', textDecorationColor: 'var(--slate8)' }}
        >
          {label}
        </label>
      );

      if (tooltip) {
        return (
          <OverlayTrigger
            placement="top"
            trigger="click"
            rootClose
            overlay={<Tooltip id={`tooltip-${label}`}>{tooltip}</Tooltip>}
          >
            {labelElement}
          </OverlayTrigger>
        );
      }

      return labelElement;
    };

    return (
      <div className={`${isHorizontalLayout ? '' : 'row'}`}>
        {Object.keys(uiProperties).map((key) => {
          const { label, widget, encrypted, className, key: propertyKey } = uiProperties[key];
          const Element = getElement(widget);
          const isSpecificComponent = ['tooljetdb-operations', 'react-component-api-endpoint'].includes(widget);

          return (
            <div
              className={cx('my-2', {
                'col-md-12': !className && !isHorizontalLayout,
                [className]: !!className,
                'd-flex': isHorizontalLayout,
                'dynamic-form-row': isHorizontalLayout,
              })}
              data-cy={`${generateCypressDataCy(key)}-section`}
              key={key}
            >
              {!isSpecificComponent && (
                <div
                  className={cx('d-flex', {
                    'form-label': isHorizontalLayout,
                    'align-items-center': !isHorizontalLayout,
                  })}
                  style={{ minWidth: '100px' }}
                >
                  {label &&
                    widget !== 'text-v3' &&
                    widget !== 'password-v3' &&
                    widget !== 'password-v3-textarea' &&
                    renderLabel(label, uiProperties[key].tooltip)}
                </div>
              )}
              <div
                className={cx(
                  {
                    'flex-grow-1': isHorizontalLayout && !isSpecificComponent,
                    'w-100': isHorizontalLayout && widget !== 'codehinter',
                  },
                  'dynamic-form-element'
                )}
                style={{ width: '100%' }}
              >
                <Element
                  {...getElementProps(uiProperties[key])}
                  {...computedProps[propertyKey]}
                  data-cy={`${generateCypressDataCy(label)}-text-field`}
                  dataCy={uiProperties[key].key.replace(/_/g, '-')}
                  //to be removed after whole ui is same
                  isHorizontalLayout={isHorizontalLayout}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const FlipComponentDropdown = (uiProperties) => {
    const flipComponentDropdowns = filter(uiProperties, ['widget', 'dropdown-component-flip']);

    const dropdownComponents = flipComponentDropdowns.map((flipComponentDropdown) => {
      const selector = options?.[flipComponentDropdown?.key]?.value || options?.[flipComponentDropdown?.key];

      return (
        <div key={flipComponentDropdown.key}>
          <div className={isHorizontalLayout ? '' : 'row'}>
            {flipComponentDropdown.commonFields && getLayout(flipComponentDropdown.commonFields)}

            <div
              className={cx('my-2', {
                'col-md-12': !flipComponentDropdown.className && !isHorizontalLayout,
                'd-flex': isHorizontalLayout,
                'dynamic-form-row': isHorizontalLayout,
                [flipComponentDropdown.className]: !!flipComponentDropdown.className,
              })}
            >
              {(flipComponentDropdown.label || isHorizontalLayout) && (
                <label
                  className={cx('form-label')}
                  data-cy={`${generateCypressDataCy(flipComponentDropdown.label)}-dropdown-label`}
                >
                  {flipComponentDropdown.label}
                </label>
              )}

              <div data-cy={`${generateCypressDataCy(flipComponentDropdown.label)}-select-dropdown`} className={cx({ 'flex-grow-1': isHorizontalLayout })}>
                <Select {...getElementProps(flipComponentDropdown)} styles={{}} useCustomStyles={false} />
              </div>
              {flipComponentDropdown.helpText && (
                <span className="flip-dropdown-help-text">{flipComponentDropdown.helpText}</span>
              )}
            </div>
          </div>

          {getLayout(uiProperties[selector])}
        </div>
      );
    });

    const normalComponents = Object.keys(uiProperties).map((key) => {
      const component = uiProperties[key];

      if (component.type && component.type !== 'dropdown-component-flip') {
        return <div key={key}>{getLayout({ [key]: component })}</div>;
      }
      return null;
    });

    return (
      <>
        {normalComponents}
        {dropdownComponents}
      </>
    );
  };

  const isFlipComponentDropdown = (uiProperties) => {
    const checkFlipComponents = filter(uiProperties, ['widget', 'dropdown-component-flip']);
    if (checkFlipComponents.length > 0) {
      return FlipComponentDropdown(uiProperties);
    } else {
      return null;
    }
  };

  const flipComponentDropdown = isFlipComponentDropdown(uiProperties);
  if (flipComponentDropdown) return flipComponentDropdown;
  return getLayout(uiProperties);
};

export default DynamicFormV2;
