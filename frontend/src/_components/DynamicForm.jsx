import React from 'react';
import cx from 'classnames';
import Input from '@/_ui/Input';
import Textarea from '@/_ui/Textarea';
import Select from '@/_ui/Select';
import Headers from '@/_ui/HttpHeaders';
import Sort from '@/_ui/Sort';
import OAuth from '@/_ui/OAuth';
import Toggle from '@/_ui/Toggle';
import OpenApi from '@/_ui/OpenAPI';
import { Checkbox, CheckboxGroup } from '@/_ui/CheckBox';
import CodeHinter from '@/AppBuilder/CodeEditor';
import GoogleSheets from '@/_components/Googlesheets';
import Slack from '@/_components/Slack';
import Zendesk from '@/_components/Zendesk';
import ApiEndpointInput from '@/_components/ApiEndpointInput';
import { ConditionFilter, CondtionSort, MultiColumn } from '@/_components/MultiConditions';
import Salesforce from '@/_components/Salesforce';
import ToolJetDbOperations from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/ToolJetDbOperations';
import { orgEnvironmentVariableService, orgEnvironmentConstantService } from '../_services';
import { filter, find, isEmpty } from 'lodash';
import { ButtonSolid } from './AppButton';
import { useGlobalDataSourcesStatus } from '@/_stores/dataSourcesStore';
import { canDeleteDataSource, canUpdateDataSource } from '@/_helpers';
import { Constants } from '@/_helpers/utils';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Sharepoint from '@/_components/Sharepoint';
import AccordionForm from './AccordionForm';

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
  setDefaultOptions,
  disableMenuPortal = false,
  onBlur,
  layout = 'vertical',
}) => {
  const [computedProps, setComputedProps] = React.useState({});
  const isHorizontalLayout = layout === 'horizontal';
  const prevDataSourceIdRef = React.useRef(selectedDataSource?.id);

  const globalDataSourcesStatus = useGlobalDataSourcesStatus();
  const { isEditing: isDataSourceEditing } = globalDataSourcesStatus;

  const [workspaceVariables, setWorkspaceVariables] = React.useState([]);
  const [currentOrgEnvironmentConstants, setCurrentOrgEnvironmentConstants] = React.useState([]);

  // if(schema.properties)  todo add empty check
  React.useLayoutEffect(() => {
    if (!isEditMode || isEmpty(options)) {
      typeof setDefaultOptions === 'function' && setDefaultOptions(schema?.defaults);
      optionsChanged(schema?.defaults ?? {});
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const prevDataSourceId = prevDataSourceIdRef.current;
    prevDataSourceIdRef.current = selectedDataSource?.id;
    const { properties } = schema;
    if (!isEmpty(properties)) {
      let fields = {};
      let encryptedFieldsProps = {};
      const flipComponentDropdown = find(properties, ['type', 'dropdown-component-flip']);

      if (flipComponentDropdown) {
        const selector = options?.[flipComponentDropdown?.key]?.value;
        const commonFieldsFromSslCertificate = properties[selector]?.ssl_certificate?.commonFields;
        fields = { ...commonFieldsFromSslCertificate, ...flipComponentDropdown?.commonFields, ...properties[selector] };
      } else {
        fields = { ...properties };
      }

      const processFields = (fieldsObject) => {
        Object.keys(fieldsObject).forEach((key) => {
          const field = fieldsObject[key];
          const { type, encrypted, key: propertyKey } = field;

          if (!canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource()) {
            encryptedFieldsProps[propertyKey] = {
              disabled: !!selectedDataSource?.id,
            };
          } else if (!isDataSourceEditing) {
            if (type === 'password' || encrypted) {
              encryptedFieldsProps[propertyKey] = {
                disabled: true,
              };
            }
          } else {
            if ((type === 'password' || encrypted) && !(propertyKey in computedProps)) {
              encryptedFieldsProps[propertyKey] = {
                disabled: !!selectedDataSource?.id,
              };
            }
          }

          // To check for nested dropdown-component-flip
          if (type === 'dropdown-component-flip') {
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

      if (properties.renderForm) {
        Object.keys(properties.renderForm).forEach((sectionKey) => {
          const section = properties.renderForm[sectionKey];
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
      case 'react-component-sort':
        return Sort;
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
      case 'react-component-api-endpoint':
        return ApiEndpointInput;
      case 'react-component-salesforce':
        return Salesforce;
      case 'react-component-sharepoint':
        return Sharepoint;
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
    editorType = 'basic',
    specUrl = '',
    disabled = false,
    buttonText,
    text,
    subtext,
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
          className: `form-control${handleToggle(controller)} ${useEncrypted && 'dynamic-form-encrypted-field'}`,
          style: { marginBottom: '0px !important' },
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
          text,
          subtext,
        };
      case 'dropdown':
      case 'dropdown-component-flip':
        return {
          options: list,
          value: options?.[key]?.value || options?.[key],
          onChange: (value) => optionchanged(key, value),
          width: width || '100%',
          useMenuPortal: disableMenuPortal ? false : queryName ? true : false,
          styles: computeSelectStyles ? computeSelectStyles('100%') : {},
          useCustomStyles: computeSelectStyles ? true : false,
          isDisabled: !canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource(),
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
          optionchanged,
          isRenderedAsQueryEditor,
          workspaceConstants: currentOrgEnvironmentConstants,
          isDisabled: !canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource(),
          encrypted: options?.[key]?.encrypted,
          buttonText,
          width: width,
        };
      }
      case 'react-component-sort': {
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
          optionchanged,
          isRenderedAsQueryEditor,
          workspaceConstants: currentOrgEnvironmentConstants,
          isDisabled: !canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource(),
          encrypted: options?.[key]?.encrypted,
          buttonText,
          width: width,
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
          audience: options?.audience?.value,
          custom_auth_params: options?.custom_auth_params?.value,
          custom_query_params: options?.custom_query_params?.value,
          multiple_auth_enabled: options?.multiple_auth_enabled?.value,
          optionchanged,
          workspaceConstants: currentOrgEnvironmentConstants,
          isDisabled: !canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource(),
          options,
          optionsChanged,
          selectedDataSource,
        };
      case 'react-component-google-sheets':
      case 'react-component-slack':
      case 'react-component-zendesk':
      case 'react-component-salesforce':
      case 'react-component-sharepoint':
        return {
          optionchanged,
          createDataSource,
          options,
          isSaving,
          selectedDataSource,
          currentAppEnvironmentId,
          workspaceConstants: currentOrgEnvironmentConstants,
          isDisabled: !canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource(),
          optionsChanged,
        };
      case 'tooljetdb-operations':
        return {
          optionchanged,
          createDataSource,
          options,
          isSaving,
          selectedDataSource,
          darkMode,
          optionsChanged,
        };
      case 'codehinter': {
        let theme;
        if (darkMode) {
          theme = 'monokai';
        } else if (lineNumbers) {
          theme = 'duotone-light';
        } else {
          theme = 'default';
        }
        return {
          type: editorType,
          initialValue: options[key]
            ? typeof options[key] === 'string'
              ? options[key]
              : JSON.stringify(options[key])
            : initialValue,
          lang: mode,
          lineNumbers,
          className: className ? className : lineNumbers ? 'query-hinter' : 'codehinter-query-editor-input',
          onChange: (value) => optionchanged(key, value),
          theme: theme,
          placeholder,
          height,
          width,
          componentName: queryName ? `${queryName}::${key ?? ''}` : null,
          cyLabel: key ? `${String(key).toLocaleLowerCase().replace(/\s+/g, '-')}` : '',
          disabled,
          delayOnChange: false,
        };
      }
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
          isDisabled: !canUpdateDataSource(selectedDataSource?.id) && !canDeleteDataSource(),
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
      case 'react-component-api-endpoint':
        return {
          specUrl: specUrl,
          optionsChanged,
          options,
          darkMode,
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
          data-cy={`label-${String(label).toLowerCase().replace(/\s+/g, '-')}`}
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
        {Object.keys(obj).map((key) => {
          const { label, type, encrypted, className, key: propertyKey } = obj[key];
          const Element = getElement(type);
          const isSpecificComponent = ['tooljetdb-operations', 'react-component-api-endpoint'].includes(type);

          return (
            <div
              className={cx('my-2', {
                'col-md-12': !className && !isHorizontalLayout,
                [className]: !!className,
                'd-flex': isHorizontalLayout,
                'dynamic-form-row': isHorizontalLayout,
              })}
              data-cy={`${key.replace(/_/g, '-')}-section`}
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
                  {label && renderLabel(label, obj[key].tooltip)}

                  {(type === 'password' || encrypted) && selectedDataSource?.id && (
                    <div className="mx-1 col">
                      <ButtonSolid
                        className="datasource-edit-btn mb-2"
                        type="a"
                        variant="tertiary"
                        target="_blank"
                        rel="noreferrer"
                        disabled={!canUpdateDataSource() && !canDeleteDataSource()}
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
                className={cx(
                  {
                    'flex-grow-1': isHorizontalLayout && !isSpecificComponent,
                    'w-100': isHorizontalLayout && type !== 'codehinter',
                  },
                  'dynamic-form-element'
                )}
                style={{ width: '100%' }}
              >
                <Element
                  {...getElementProps(obj[key])}
                  {...computedProps[propertyKey]}
                  data-cy={`${String(label).toLocaleLowerCase().replace(/\s+/g, '-')}-text-field`}
                  dataCy={obj[key].key.replace(/_/g, '-')}
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

  const FlipComponentDropdown = (obj) => {
    const flipComponentDropdowns = filter(obj, ['type', 'dropdown-component-flip']);

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
                  data-cy={`${String(flipComponentDropdown.label)
                    .toLocaleLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')}-dropdown-label`}
                >
                  {flipComponentDropdown.label}
                </label>
              )}

              <div data-cy={`${String(flipComponentDropdown.label).toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')}-select-dropdown`} className={cx({ 'flex-grow-1': isHorizontalLayout })}>
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
        </div>
      );
    });

    const normalComponents = Object.keys(obj).map((key) => {
      const component = obj[key];

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

  const isFormComponent = (obj, getLayout) => {
    const formComponent = find(obj, ['type', 'react-form-component']);
    if (formComponent) {
      return <AccordionForm formComponent={formComponent} getLayout={getLayout} />;
    }
    return null;
  };

  const isFlipComponentDropdown = (obj) => {
    const checkFlipComponents = filter(obj, ['type', 'dropdown-component-flip']);
    if (checkFlipComponents.length > 0) {
      return FlipComponentDropdown(obj);
    } else {
      return null;
    }
  };

  const flipComponentDropdown = isFlipComponentDropdown(schema.properties);
  const formComponent = isFormComponent(schema.properties, getLayout);

  if (flipComponentDropdown) {
    return flipComponentDropdown;
  }
  if (formComponent) {
    return formComponent;
  }

  return getLayout(schema.properties);
};

export default DynamicForm;
