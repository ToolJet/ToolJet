import React from 'react';
import cx from 'classnames';
import Input from '@/_ui/Input';
import Textarea from '@/_ui/Textarea';
import Select from '@/_ui/Select';
import Headers from '@/_ui/HttpHeaders';
import OAuth from '@/_ui/OAuth';
import Toggle from '@/_ui/Toggle';
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
    ignoreBraces = false,
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
          value: options[key]?.value,
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
          auth_url: options.auth_url?.value,
          custom_auth_params: options.custom_auth_params?.value,
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
          className: lineNumbers ? 'query-hinter' : 'codehinter-query-editor-input',
          onChange: (value) => optionchanged(key, value),
          theme: darkMode ? 'monokai' : lineNumbers ? 'duotone-light' : 'default',
          placeholder,
          height,
          componentName: queryName ? `${queryName}::${key ?? ''}` : null,
          ignoreBraces,
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
            <div className="col-md-12 my-2">
              {flipComponentDropdown.label && <label className="form-label">{flipComponentDropdown.label}</label>}
              <Select {...getElementProps(flipComponentDropdown)} />
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
