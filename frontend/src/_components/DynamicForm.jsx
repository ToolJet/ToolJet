import React from 'react';
import cx from 'classnames';
import Input from '@/_ui/Input';
import Textarea from '@/_ui/Textarea';
import Select from '@/_ui/Select';
import Headers from '@/_ui/HttpHeaders';
import OAuth from '@/_ui/OAuth';
import Toggle from '@/_ui/Toggle';
import OpenApi from '@/_ui/OpenAPI';
import { Checkbox, CheckboxGroup } from '@/_ui/CheckBox';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import GoogleSheets from '@/_components/Googlesheets';
import Slack from '@/_components/Slack';
import Zendesk from '@/_components/Zendesk';
import { ConditionFilter, CondtionSort, MultiColumn } from '@/_components/MultiConditions';
import ToolJetDbOperations from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/ToolJetDbOperations';
import { orgEnvironmentVariableService, orgEnvironmentConstantService } from '../_services';

import { find, isEmpty } from 'lodash';
import { ButtonSolid } from './AppButton';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';

const DynamicForm = ({
  schema,
  isGDS,
  optionchanged,
  createDataSource,
  options,
  isSaving,
  selectedDataSource,
  isEditMode,
  optionsChanged,
  queryName,
  computeSelectStyles = false,
  currentAppEnvironmentId,
  onBlur,
  layout = 'vertical',
}) => {
  const [computedProps, setComputedProps] = React.useState({});
  const isHorizontalLayout = layout === 'horizontal';
  const currentState = useCurrentState();

  const [workspaceVariables, setWorkspaceVariables] = React.useState([]);
  const [currentOrgEnvironmentConstants, setCurrentOrgEnvironmentConstants] = React.useState([]);
  const { isEditorActive } = useEditorStore(
    (state) => ({
      isEditorActive: state?.isEditorActive,
    }),
    shallow
  );

  // if(schema.properties)  todo add empty check
  React.useLayoutEffect(() => {
    if (!isEditMode || isEmpty(options)) {
      optionsChanged(schema?.defaults ?? {});
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (isGDS) {
      orgEnvironmentConstantService.getConstantsFromEnvironment(currentAppEnvironmentId).then((data) => {
        const constants = {};
        data.constants.map((constant) => {
          constants[constant.name] = constant.value;
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
    const { properties } = schema;
    if (!isEmpty(properties)) {
      let fields = {};
      let encrpytedFieldsProps = {};
      const flipComponentDropdown = find(properties, ['type', 'dropdown-component-flip']);

      if (flipComponentDropdown) {
        const selector = options?.[flipComponentDropdown?.key]?.value;
        fields = { ...flipComponentDropdown?.commonFields, ...properties[selector] };
      } else {
        fields = { ...properties };
      }

      Object.keys(fields).length > 0 &&
        Object.keys(fields).map((key) => {
          const { type, encrypted, key: propertyKey } = fields[key];
          if ((type === 'password' || encrypted) && !(propertyKey in computedProps)) {
            //Editable encrypted fields only if datasource doesn't exists
            encrpytedFieldsProps[propertyKey] = {
              disabled: !!selectedDataSource?.id,
            };
          }
        });
      setComputedProps({ ...computedProps, ...encrpytedFieldsProps });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const getElement = (type) => {
    switch (type) {
      case 'password':
      case 'text':
        return Input;
      case 'textarea':
        return Textarea;
      case 'dropdown':
        return Select;
      case 'toggle':
        return Toggle;
      case 'checkbox':
        return Checkbox;
      case 'checkbox-group':
        return CheckboxGroup;
      case 'tooljetdb-operations':
        return ToolJetDbOperations;
      case 'react-component-headers':
        return Headers;
      case 'react-component-oauth-authentication':
        return OAuth;
      case 'react-component-google-sheets':
        return GoogleSheets;
      case 'react-component-slack':
        return Slack;
      case 'codehinter':
        return CodeHinter;
      case 'react-component-openapi-validator':
        return OpenApi;
      case 'react-component-zendesk':
        return Zendesk;
      case 'columns':
        return MultiColumn;
      case 'filters':
        return ConditionFilter;
      case 'sorts':
        return CondtionSort;
      default:
        return <div>Type is invalid</div>;
    }
  };

  const handleToggle = (controller) => {
    if (controller) {
      return !options?.[controller]?.value ? ' d-none' : '';
    } else {
      return '';
    }
  };

  const getElementProps = ({
    key,
    list,
    rows = 5,
    helpText,
    description,
    type,
    placeholder = '',
    mode = 'sql',
    lineNumbers = true,
    initialValue,
    height = 'auto',
    width,
    ignoreBraces = false,
    className,
    controller,
    encrypted,
    placeholders = {},
  }) => {
    const source = schema?.source?.kind;
    const darkMode = localStorage.getItem('darkMode') === 'true';

    if (!options) return;

    switch (type) {
      case 'password':
      case 'text':
      case 'textarea': {
        const useEncrypted =
          (options?.[key]?.encrypted !== undefined ? options?.[key].encrypted : encrypted) || type === 'password';
        return {
          type,
          placeholder: useEncrypted ? '**************' : description,
          className: `form-control${handleToggle(controller)}`,
          value: options?.[key]?.value || '',
          ...(type === 'textarea' && { rows: rows }),
          ...(helpText && { helpText }),
          onChange: (e) => optionchanged(key, e.target.value, true), //shouldNotAutoSave is true because autosave should occur during onBlur, not after each character change (in optionchanged).
          onblur: () => onBlur(),
          isGDS,
          workspaceVariables,
          workspaceConstants: currentOrgEnvironmentConstants,
          encrypted: useEncrypted,
        };
      }
      case 'toggle':
        return {
          defaultChecked: options?.[key],
          checked: options?.[key]?.value,
          onChange: (e) => optionchanged(key, e.target.checked),
        };
      case 'dropdown':
      case 'dropdown-component-flip':
        return {
          options: list,
          value: options?.[key]?.value || options?.[key],
          onChange: (value) => optionchanged(key, value),
          width: width || '100%',
          useMenuPortal: queryName ? true : false,
          styles: computeSelectStyles ? computeSelectStyles('100%') : {},
          useCustomStyles: computeSelectStyles ? true : false,
          encrypted: options?.[key]?.encrypted,
        };

      case 'checkbox-group':
        return {
          options: list,
          values: options?.[key] ?? [],
          onChange: (value) => {
            optionchanged(key, [...value]);
          },
        };

      case 'react-component-headers': {
        let isRenderedAsQueryEditor;
        if (!isEditorActive || isGDS) {
          isRenderedAsQueryEditor = false;
        } else {
          isRenderedAsQueryEditor = !isGDS && currentState != null;
        }
        return {
          getter: key,
          options: isRenderedAsQueryEditor
            ? options?.[key] ?? schema?.defaults?.[key]
            : options?.[key]?.value ?? schema?.defaults?.[key]?.value,
          optionchanged,
          currentState,
          isRenderedAsQueryEditor,
          workspaceConstants: currentOrgEnvironmentConstants,
          encrypted: options?.[key]?.encrypted,
        };
      }
      case 'react-component-oauth-authentication':
        return {
          isGrpc: source === 'grpc',
          grant_type: options?.grant_type?.value,
          auth_type: options?.auth_type?.value,
          add_token_to: options?.add_token_to?.value,
          header_prefix: options?.header_prefix?.value,
          access_token_url: options?.access_token_url?.value,
          access_token_custom_headers: options?.access_token_custom_headers?.value,
          client_id: options?.client_id?.value,
          client_secret: options?.client_secret?.value,
          client_auth: options?.client_auth?.value,
          scopes: options?.scopes?.value,
          username: options?.username?.value,
          password: options?.password?.value,
          grpc_apiKey_key: options?.grpc_apikey_key?.value,
          grpc_apiKey_value: options?.grpc_apikey_value?.value,
          bearer_token: options?.bearer_token?.value,
          auth_url: options?.auth_url?.value,
          auth_key: options?.auth_key?.value,
          custom_auth_params: options?.custom_auth_params?.value,
          custom_query_params: options?.custom_query_params?.value,
          multiple_auth_enabled: options?.multiple_auth_enabled?.value,
          optionchanged,
          workspaceConstants: currentOrgEnvironmentConstants,
          options,
          optionsChanged,
          selectedDataSource,
        };
      case 'react-component-google-sheets':
      case 'react-component-slack':
      case 'react-component-zendesk':
        return {
          optionchanged,
          createDataSource,
          options,
          isSaving,
          selectedDataSource,
          workspaceConstants: currentOrgEnvironmentConstants,
          optionsChanged,
        };
      case 'tooljetdb-operations':
        return {
          currentState,
          optionchanged,
          createDataSource,
          options,
          isSaving,
          selectedDataSource,
          darkMode,
        };
      case 'codehinter':
        return {
          currentState,
          initialValue: options[key]
            ? typeof options[key] === 'string'
              ? options[key]
              : JSON.stringify(options[key])
            : initialValue,
          mode,
          lineNumbers,
          className: className ? className : lineNumbers ? 'query-hinter' : 'codehinter-query-editor-input',
          onChange: (value) => optionchanged(key, value),
          theme: darkMode ? 'monokai' : lineNumbers ? 'duotone-light' : 'default',
          placeholder,
          height,
          width,
          componentName: queryName ? `${queryName}::${key ?? ''}` : null,
          ignoreBraces,
          cyLabel: key ? `${String(key).toLocaleLowerCase().replace(/\s+/g, '-')}` : '',
        };
      case 'react-component-openapi-validator':
        return {
          format: options.format?.value,
          definition: options.definition?.value,
          auth_type: options.auth_type?.value,
          auth_key: options.auth_key?.value,
          username: options.username?.value,
          password: options.password?.value,
          bearer_token: options.bearer_token?.value,
          api_keys: options.api_keys?.value,
          optionchanged,
          grant_type: options.grant_type?.value,
          add_token_to: options.add_token_to?.value,
          header_prefix: options.header_prefix?.value,
          access_token_url: options.access_token_url?.value,
          access_token_custom_headers: options.access_token_custom_headers?.value,
          client_id: options.client_id?.value,
          client_secret: options.client_secret?.value,
          client_auth: options.client_auth?.value,
          scopes: options.scopes?.value,
          auth_url: options.auth_url?.value,
          custom_auth_params: options.custom_auth_params?.value,
          custom_query_params: options.custom_query_params?.value,
          spec: options.spec?.value,
          workspaceConstants: currentOrgEnvironmentConstants,
        };
      case 'filters':
        return {
          operators: list || [],
          value: options?.[key] ?? {},
          onChange: (value) => optionchanged(key, value),
          placeholders,
        };
      case 'sorts':
        return {
          orders: list || [],
          value: options?.[key] ?? {},
          onChange: (value) => optionchanged(key, value),
          placeholders,
        };
      case 'columns':
        return {
          value: options?.[key] ?? {},
          onChange: (value) => optionchanged(key, value),
          placeholders,
        };
      default:
        return {};
    }
  };

  const getLayout = (obj) => {
    if (isEmpty(obj)) return null;
    const flipComponentDropdown = isFlipComponentDropdown(obj);

    if (flipComponentDropdown) {
      return flipComponentDropdown;
    }

    const handleEncryptedFieldsToggle = (event, field) => {
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

    return (
      <div className={`${isHorizontalLayout ? '' : 'row'}`}>
        {Object.keys(obj).map((key) => {
          const { label, type, encrypted, className, key: propertyKey } = obj[key];
          const Element = getElement(type);
          const isSpecificComponent = ['tooljetdb-operations'].includes(type);

          return (
            <div
              className={cx('my-2', {
                'col-md-12': !className && !isHorizontalLayout,
                [className]: !!className,
                'd-flex': isHorizontalLayout,
                'dynamic-form-row': isHorizontalLayout,
              })}
              key={key}
            >
              {!isSpecificComponent && (
                <div
                  className={cx('d-flex', {
                    'form-label': isHorizontalLayout,
                    'align-items-center': !isHorizontalLayout,
                  })}
                >
                  {label && (
                    <label
                      className="form-label"
                      data-cy={`label-${String(label).toLocaleLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {label}
                    </label>
                  )}
                  {(type === 'password' || encrypted) && selectedDataSource?.id && (
                    <div className="mx-1 col">
                      <ButtonSolid
                        className="datasource-edit-btn mb-2"
                        type="a"
                        variant="tertiary"
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => handleEncryptedFieldsToggle(event, propertyKey)}
                      >
                        {computedProps?.[propertyKey]?.['disabled'] ? 'Edit' : 'Cancel'}
                      </ButtonSolid>
                    </div>
                  )}
                  {(type === 'password' || encrypted) && (
                    <div className="col-auto mb-2">
                      <small className="text-green">
                        <img
                          className="mx-2 encrypted-icon"
                          src="assets/images/icons/padlock.svg"
                          width="12"
                          height="12"
                        />
                        Encrypted
                      </small>
                    </div>
                  )}
                </div>
              )}
              <div
                className={cx({
                  'flex-grow-1': isHorizontalLayout && !isSpecificComponent,
                  'w-100': isHorizontalLayout && type !== 'codehinter',
                })}
              >
                <Element
                  {...getElementProps(obj[key])}
                  {...computedProps[propertyKey]}
                  data-cy={`${String(label).toLocaleLowerCase().replace(/\s+/g, '-')}-text-field`}
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

  const isFlipComponentDropdown = (obj) => {
    const flipComponentDropdown = find(obj, ['type', 'dropdown-component-flip']);
    if (flipComponentDropdown) {
      // options[key].value for datasource
      // options[key] for dataquery
      const selector = options?.[flipComponentDropdown?.key]?.value || options?.[flipComponentDropdown?.key];
      return (
        <>
          <div className={`${isHorizontalLayout ? '' : 'row'}`}>
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
                  data-cy={`${String(flipComponentDropdown.label)
                    .toLocaleLowerCase()
                    .replace(/\s+/g, '-')}-dropdown-label`}
                >
                  {flipComponentDropdown.label}
                </label>
              )}
              <div data-cy={'query-select-dropdown'} className={cx({ 'flex-grow-1': isHorizontalLayout })}>
                <Select
                  {...getElementProps(flipComponentDropdown)}
                  styles={computeSelectStyles ? computeSelectStyles('100%') : {}}
                  useCustomStyles={computeSelectStyles ? true : false}
                />
              </div>
              {flipComponentDropdown.helpText && (
                <span className="flip-dropdown-help-text">{flipComponentDropdown.helpText}</span>
              )}
            </div>
          </div>
          {getLayout(obj[selector])}
        </>
      );
    }
  };

  const flipComponentDropdown = isFlipComponentDropdown(schema.properties);

  if (flipComponentDropdown) {
    return flipComponentDropdown;
  }

  return getLayout(schema.properties);
};

export default DynamicForm;
