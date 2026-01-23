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
import { useGlobalDataSourcesStatus } from '@/_stores/dataSourcesStore';
import { canDeleteDataSource, canUpdateDataSource } from '@/_helpers';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { orgEnvironmentConstantService } from '../_services';
import { Constants } from '@/_helpers/utils';
import { generateCypressDataCy } from '../modules/common/helpers/cypressHelpers.js';
import { Checkbox, CheckboxGroup } from '@/_ui/CheckBox';
import { validateMongoDBConnectionString, parseMongoDBConnectionString, detectConnectionStringChange } from '../_helpers/mongoDbHelpers.js'


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
  elementsProps = null,
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

  const lastAutoFilledConnRef = React.useRef('');
  const autoFillTimeoutRef = React.useRef(null);
  const manuallyEditedFieldsRef = React.useRef(new Set());
  const skipNextAutoFillRef = React.useRef(false);
  React.useEffect(() => {
    const isMongoDBDataSource =
      schema['tj:source']?.kind === 'mongodb' ||
      schema['tj:source']?.name === 'MongoDB';

    if (!isMongoDBDataSource) {
      return;
    }

    const connectionType = options?.connection_type?.value;
    if (connectionType !== 'string') {
      return;
    }

    const connString = options?.connection_string?.value;

    if (autoFillTimeoutRef.current) {
      clearTimeout(autoFillTimeoutRef.current);
      autoFillTimeoutRef.current = null;
    }

    if (!connString) {
      lastAutoFilledConnRef.current = '';
      manuallyEditedFieldsRef.current.clear();
      return;
    }

    if (skipNextAutoFillRef.current) {
      skipNextAutoFillRef.current = false;
      lastAutoFilledConnRef.current = connString;
      return;
    }

    const isNewConnectionString = connString !== lastAutoFilledConnRef.current;

    if (!isNewConnectionString) {
      return;
    }

    const isLoadingExistingDataSource =
      !lastAutoFilledConnRef.current &&
      selectedDataSource?.id &&
      selectedDataSource?.options?.connection_string?.value === connString;

    if (isLoadingExistingDataSource) {
      lastAutoFilledConnRef.current = connString;
      return;
    }
    autoFillTimeoutRef.current = setTimeout(() => {
      const changeDetection = detectConnectionStringChange(lastAutoFilledConnRef.current, connString);

      if (!changeDetection) {
        const parsed = parseMongoDBConnectionString(connString);
        if (!parsed) return;

        const updatedOptions = { ...options };
        if (parsed.connection_format !== undefined && !manuallyEditedFieldsRef.current.has('connection_format')) {
          updatedOptions.connection_format = { value: parsed.connection_format };
        }
        if (parsed.host !== undefined) {
          updatedOptions.host = { value: parsed.host };
        }
        if (parsed.port !== undefined) {
          updatedOptions.port = { value: parsed.port };
        }
        if (parsed.username !== undefined) {
          updatedOptions.username = { value: parsed.username };
        }
        if (parsed.password !== undefined) {
          updatedOptions.password = { value: parsed.password };
        }
        if (parsed.database !== undefined) {
          updatedOptions.database = { value: parsed.database };
        }
        if (parsed.use_ssl !== undefined) {
          updatedOptions.use_ssl = { value: parsed.use_ssl };
        }
        if (parsed.query_params !== undefined) {
          updatedOptions.query_params = { value: parsed.query_params };
        }
        optionsChanged(updatedOptions);
        lastAutoFilledConnRef.current = connString;
        return;
      }

      const { changes, newParsed } = changeDetection;
      const updatedOptions = { ...options };

      if (changes.protocol && !manuallyEditedFieldsRef.current.has('connection_format')) {
        updatedOptions.connection_format = { value: newParsed.connection_format };
      }
      if (changes.host && !manuallyEditedFieldsRef.current.has('host')) {
        updatedOptions.host = { value: newParsed.host };
      }
      if (changes.port && !manuallyEditedFieldsRef.current.has('port')) {
        updatedOptions.port = { value: newParsed.port };
      }
      if (changes.username && !manuallyEditedFieldsRef.current.has('username')) {
        updatedOptions.username = { value: newParsed.username };
      }
      if (changes.password && !manuallyEditedFieldsRef.current.has('password')) {
        updatedOptions.password = { value: newParsed.password };
      }
      if (changes.database && !manuallyEditedFieldsRef.current.has('database')) {
        updatedOptions.database = { value: newParsed.database };
      }
      if (changes.ssl && !manuallyEditedFieldsRef.current.has('use_ssl')) {
        updatedOptions.use_ssl = { value: newParsed.use_ssl };
      }
      if (changes.query && !manuallyEditedFieldsRef.current.has('query_params')) {
        updatedOptions.query_params = { value: newParsed.query_params };
      }

      optionsChanged(updatedOptions);
      lastAutoFilledConnRef.current = connString;
    }, 100);

    return () => {
      if (autoFillTimeoutRef.current) {
        clearTimeout(autoFillTimeoutRef.current);
      }
    };
  }, [options?.connection_string?.value, options?.connection_type?.value, optionchanged, selectedDataSource?.id, schema]);

  React.useEffect(() => {
    const isMongoDBDataSource =
      schema['tj:source']?.kind === 'mongodb' ||
      schema['tj:source']?.name === 'MongoDB';

    if (!isMongoDBDataSource) {
      return;
    }
    const prevDataSourceId = prevDataSourceIdRef.current;

    if (prevDataSourceId !== selectedDataSource?.id) {
      manuallyEditedFieldsRef.current.clear();
      lastAutoFilledConnRef.current = '';
      skipNextAutoFillRef.current = false;

      const connString = options?.connection_string?.value;
      if (connString) {
        lastAutoFilledConnRef.current = connString;
      }
    }
  }, [selectedDataSource?.id, options?.connection_string?.value, schema]);

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

      const isMongoDBDataSource =
        schema['tj:source']?.kind === 'mongodb' ||
        schema['tj:source']?.name === 'MongoDB';

      let finalErrors = [...errors];

      if (isMongoDBDataSource) {
        const connectionType = options?.connection_type?.value;

        finalErrors = finalErrors.filter(err => {
          if (connectionType === 'string' && err.keyword === 'if') {
            return false;
          }
          if (connectionType === 'string' &&
            err.dataPath === '.connection_string' &&
            err.keyword === 'required' &&
            err.schemaPath.includes('allOf')) {
            return false;
          }

          if (connectionType === 'manual' && err.dataPath.includes('connection_string')) {
            return false;
          }

          return true;
        });

        if (connectionType === 'string' && options.connection_string?.value) {
          const selectedFormat = options.connection_format?.value;
          const validation = validateMongoDBConnectionString(
            options.connection_string.value,
            selectedFormat
          );

          if (!validation.valid) {
            finalErrors.push({
              dataPath: ".connection_string",
              keyword: "custom",
              message: validation.error,
              params: {},
              schemaPath: "#/properties/connection_string"
            });
          }
        }
      }

      if (finalErrors.length === 0) {
        clearValidationMessages();
        clearValidationErrorBanner();
      } else {
        setValidationMessages(finalErrors, schema, interactedFields);
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
        const processNestedField = (field, propertyKey) => {
          const { widget, encrypted } = field;

          const isEncryptedField =
            widget === 'password-v3' ||
            widget === 'password-v3-textarea' ||
            widget === 'password' ||
            encrypted ||
            encryptedProperties.includes(propertyKey);

          if (isEncryptedField) {
            if (computedProps[propertyKey] !== undefined && computedProps[propertyKey].disabled === false) {
              encryptedFieldsProps[propertyKey] = { disabled: false };
            } else if (!isDataSourceEditing) {
              encryptedFieldsProps[propertyKey] = { disabled: true };
            } else if (!(propertyKey in computedProps)) {
              encryptedFieldsProps[propertyKey] = {
                disabled: !!selectedDataSource?.id,
              };
            }
          }
        };

        Object.keys(fieldsObject).forEach((key) => {
          const field = fieldsObject[key];

          if (field.key) {
            processNestedField(field, field.key);
          }

          // Check for nested structures and recursively process them
          if (typeof field === 'object') {
            if (field.widget === 'dropdown-component-flip') {
              const selectedOption = options?.[field.key]?.value;

              if (field.commonFields) {
                Object.keys(field.commonFields).forEach((commonKey) => {
                  const commonField = field.commonFields[commonKey];
                  processNestedField(commonField, commonField.key);
                });
              }

              if (selectedOption && fieldsObject[selectedOption]) {
                processFields(fieldsObject[selectedOption]);
              }
            }

            // For other nested objects, recursively process them
            Object.keys(field).forEach((subKey) => {
              if (typeof field[subKey] === 'object' && field[subKey] !== null) {
                if (field[subKey].widget || field[subKey].key) {
                  processNestedField(field[subKey], field[subKey].key);
                } else {
                  processFields({ [subKey]: field[subKey] });
                }
              }
            });
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

  React.useEffect(() => {
    const requiredFields = processAllOfConditions(schema, options);
    setConditionallyRequiredProperties(requiredFields);
  }, [options, processAllOfConditions, schema, selectedDataSource.id]);

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
      case 'checkbox':
        return Checkbox;
      case 'checkbox-group':
        return CheckboxGroup;
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
    const workspaceConstant = options?.[key]?.workspace_constant;
    const isEditing = computedProps[key] && computedProps[key].disabled === false;
    const handleOptionChange = (key, value, flag = true) => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
      }
      setInteractedFields((prev) => new Set(prev).add(key));

      const isMongoDBDataSource =
        schema['tj:source']?.kind === 'mongodb' ||
        schema['tj:source']?.name === 'MongoDB';

      if (isMongoDBDataSource) {
        const autoFilledFields = ['host', 'port', 'username', 'password', 'database', 'connection_format', 'use_ssl', 'query_params'];

        if (autoFilledFields.includes(key)) {
          if (key === 'connection_format') {
            manuallyEditedFieldsRef.current.add(key);
          }
          optionchanged(key, value, flag);
          return;
        }

        if (key === 'connection_string') {
          if (!value || value.trim() === '') {
            manuallyEditedFieldsRef.current.clear();
            lastAutoFilledConnRef.current = '';
          } else {
            const currentConnString = lastAutoFilledConnRef.current;
            if (!currentConnString ||
              (currentConnString.includes('mongodb+srv://') !== value.includes('mongodb+srv://'))) {
              manuallyEditedFieldsRef.current.delete('connection_format');
            } else {
              const connectionFormatWasEdited = manuallyEditedFieldsRef.current.has('connection_format');
              manuallyEditedFieldsRef.current.clear();
              if (connectionFormatWasEdited) {
                manuallyEditedFieldsRef.current.add('connection_format');
              }
            }
          }
        }
      }

      optionchanged(key, value, flag);
    };
    switch (widget) {
      case 'password':
      case 'text':
      case 'textarea': {
        return {
          propertyKey: key,
          widget,
          label,
          placeholder: workspaceConstant ? workspaceConstant : isEncrypted ? '**************' : description,
          className: cx('form-control', {
            'dynamic-form-encrypted-field': isEncrypted,
          }),
          style: { marginBottom: '0px !important' },
          helpText: helpText,
          value: currentValue || '',
          onChange: (e) => handleOptionChange(key, e.target.value, true),
          isGDS: true,
          encrypted: isEncrypted,
          onBlur,
          workspaceVariables,
          workspaceConstants: currentOrgEnvironmentConstants,
        };
      }
      case 'password-v3':
      case 'password-v3-textarea':
      case 'text-v3': {
        const isMongoDBDataSource =
          schema['tj:source']?.kind === 'mongodb' ||
          schema['tj:source']?.name === 'MongoDB';

        let customValidation = { valid: null, message: '' };

        if (isMongoDBDataSource && key === 'connection_string' && currentValue && !skipValidation) {
          const selectedFormat = options.connection_format?.value;
          const validation = validateMongoDBConnectionString(currentValue, selectedFormat);
          if (!validation.valid) {
            customValidation = { valid: false, message: validation.error };
          } else {
            customValidation = { valid: true, message: '' };
          }
        }
        const validationStatus =
          (isMongoDBDataSource && key === 'connection_string' && customValidation.valid !== null)
            ? customValidation
            : skipValidation
              ? { valid: null, message: '' }
              : validationMessages[key]
                ? { valid: false, message: validationMessages[key] }
                : isRequired
                  ? { valid: true, message: '' }
                  : { valid: null, message: '' };
        return {
          propertyKey: key,
          widget,
          label,
          placeholder: workspaceConstant ? workspaceConstant : isEncrypted ? '**************' : description,
          className: cx('form-control', {
            'dynamic-form-encrypted-field': isEncrypted,
          }),
          style: { marginBottom: '0px !important' },
          helpText: helpText,
          value: currentValue || '',
          onChange: (e) => handleOptionChange(key, e.target.value, true),
          isGDS: true,
          encrypted: isEncrypted,
          onBlur,
          isRequired: isRequired,
          isValidatedMessages: validationStatus,
          isDisabled: !canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource(),
          workspaceVariables,
          workspaceConstants: currentOrgEnvironmentConstants,
          isEditing: isEditing,
          labelDisabled: false,
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
          ...elementsProps?.[key],
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
      case 'checkbox':
        return {
          propertyKey: key,
          widget,
          label,
          isChecked: currentValue || false,
          onChange: (e) => handleOptionChange(key, e.target.checked, true),
          helpText: helpText,
          isRequired: isRequired,
          isDisabled: !canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource(),
        };
      case 'checkbox-group':
        return {
          options: list,
          values: options?.[key] ?? [],
          onChange: (value) => {
            optionchanged(key, [...value]);
          },
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
      const workspaceConstant = options?.[field]?.workspace_constant;
      const isWorkspaceConstant = !!workspaceConstant;

      if (isEditing) {
        if (isWorkspaceConstant) {
          optionchanged(field, workspaceConstant);
        } else {
          optionchanged(field, '');
        }
      } else {
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

    const renderLabel = (label, tooltip, fieldType) => {
      const labelElement = (
        <label
          className="form-label"
          data-cy={fieldType === 'dropdown' ? `${generateCypressDataCy(label)}-dropdown-label` : `label-${generateCypressDataCy(label)}`}
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
              data-cy={`${generateCypressDataCy(label ?? key)}-section`}
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
                    widget !== 'checkbox' &&
                    widget !== 'checkbox-group' &&
                    renderLabel(label, uiProperties[key].tooltip, type)}
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
                data-cy={type === 'dropdown' || type === 'dropdown-component-flip' ? `${generateCypressDataCy(label ?? key)}-select-dropdown` : `${generateCypressDataCy(label ?? key)}-${generateCypressDataCy(type ?? key)}-element`}
              >
                <Element
                  {...getElementProps(uiProperties[key])}
                  {...computedProps[propertyKey]}
                  data-cy={`${generateCypressDataCy(label)}-text-field`}
                  dataCy={generateCypressDataCy(uiProperties[key].label ?? key)}
                  //to be removed after whole ui is same
                  isHorizontalLayout={isHorizontalLayout}
                  handleEncryptedFieldsToggle={handleEncryptedFieldsToggle}
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
              data-cy={`${generateCypressDataCy(flipComponentDropdown.label)}-section`}
            >
              {(flipComponentDropdown.label || isHorizontalLayout) && (
                <label
                  className={cx('form-label')}
                  data-cy={`${generateCypressDataCy(flipComponentDropdown.label)}-dropdown-label`}
                >
                  {flipComponentDropdown.label}
                </label>
              )}

              <div
                data-cy={`${generateCypressDataCy(flipComponentDropdown.label)}-select-dropdown`}
                className={cx({ 'flex-grow-1': isHorizontalLayout })}
              >
                <Select {...getElementProps(flipComponentDropdown)} styles={{}} useCustomStyles={false}
                  dataCy={generateCypressDataCy(flipComponentDropdown.label)} />
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
