import React from 'react';
import cx from 'classnames';
import Input from '@/_ui/Input';
import Textarea from '@/_ui/Textarea';
import Select from '@/_ui/Select';
import Headers from '@/_ui/HttpHeaders';
import OAuth from '@/_ui/OAuth';
import Toggle from '@/_ui/Toggle';
import OpenApi from '@/_ui/OpenAPI';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';

import GoogleSheets from '@/_components/Googlesheets';
import Slack from '@/_components/Slack';

import { find, isEmpty } from 'lodash';

const DynamicForm = ({
  schema,
  optionchanged,
  createDataSource,
  options,
  isSaving,
  selectedDataSource,
  currentState,
  isEditMode,
  optionsChanged,
  queryName,
}) => {
  // if(schema.properties)  todo add empty check
  React.useLayoutEffect(() => {
    if (!isEditMode || isEmpty(options)) {
      optionsChanged(schema?.defaults ?? {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      default:
        return <div>Type is invalid</div>;
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
  }) => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    switch (type) {
      case 'password':
      case 'text':
      case 'textarea':
        return {
          type,
          placeholder: description,
          className: 'form-control',
          value: options?.[key]?.value,
          ...(type === 'textarea' && { rows: rows }),
          ...(helpText && { helpText }),
          onChange: (e) => optionchanged(key, e.target.value),
        };
      case 'toggle':
        return {
          defaultChecked: options[key],
          checked: options[key]?.value,
          onChange: (e) => optionchanged(key, e.target.checked),
        };
      case 'dropdown':
      case 'dropdown-component-flip':
        return {
          options: list,
          value: options[key]?.value || options[key],
          onChange: (value) => optionchanged(key, value),
          width: width || '100%',
          useMenuPortal: queryName ? true : false,
        };
      case 'react-component-headers':
        return {
          getter: key,
          options: options[key]?.value,
          optionchanged,
        };
      case 'react-component-oauth-authentication':
        return {
          grant_type: options.grant_type?.value,
          auth_type: options.auth_type?.value,
          add_token_to: options.add_token_to?.value,
          header_prefix: options.header_prefix?.value,
          access_token_url: options.access_token_url?.value,
          client_id: options.client_id?.value,
          client_secret: options.client_secret?.value,
          client_auth: options.client_auth?.value,
          scopes: options.scopes?.value,
          username: options.username?.value,
          password: options.password?.value,
          bearer_token: options.bearer_token?.value,
          auth_url: options.auth_url?.value,
          auth_key: options.auth_key?.value,
          custom_auth_params: options.custom_auth_params?.value,
          custom_query_params: options.custom_query_params?.value,
          optionchanged,
        };
      case 'react-component-google-sheets':
      case 'react-component-slack':
        return { optionchanged, createDataSource, options, isSaving, selectedDataSource };
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
          client_id: options.client_id?.value,
          client_secret: options.client_secret?.value,
          client_auth: options.client_auth?.value,
          scopes: options.scopes?.value,
          auth_url: options.auth_url?.value,
          custom_auth_params: options.custom_auth_params?.value,
          custom_query_params: options.custom_query_params?.value,
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

    return (
      <div className="row">
        {Object.keys(obj).map((key) => {
          const { label, type, encrypted, className } = obj[key];

          const Element = getElement(type);

          return (
            <div className={cx('my-2', { 'col-md-12': !className, [className]: !!className })} key={key}>
              {label && (
                <label className="form-label">
                  {label}
                  {(type === 'password' || encrypted) && (
                    <small className="text-green mx-2">
                      <img
                        className="mx-2 encrypted-icon"
                        src="/assets/images/icons/padlock.svg"
                        width="12"
                        height="12"
                      />
                      Encrypted
                    </small>
                  )}
                </label>
              )}
              <Element {...getElementProps(obj[key])} />
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
      const selector = options[flipComponentDropdown.key]?.value || options[flipComponentDropdown.key];

      return (
        <>
          <div className="row">
            {flipComponentDropdown.commonFields && getLayout(flipComponentDropdown.commonFields)}
            <div
              className={cx('my-2', {
                'col-md-12': !flipComponentDropdown.className,
                [flipComponentDropdown.className]: !!flipComponentDropdown.className,
              })}
            >
              {flipComponentDropdown.label && <label className="form-label">{flipComponentDropdown.label}</label>}
              <Select {...getElementProps(flipComponentDropdown)} />
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
