import React from 'react';
import Input from '@/_ui/Input';
import Select from '@/_ui/Select';
import Headers from '@/_ui/HttpHeaders';
import OAuth from '@/_ui/OAuth';
import Toggle from '@/_ui/Toggle';

import GoogleSheets from '@/_components/Googlesheets';
import Slack from '@/_components/Slack';

import { find } from 'lodash';

const DynamicForm = ({ schema, optionchanged, createDataSource, options, isSaving, selectedDataSource }) => {
  // if(schema.properties)  todo add empty check

  const getElement = (type) => {
    switch (type) {
      case 'password':
      case 'text':
      case 'textarea':
        return Input;
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
      default:
        return <div>Type is invalid</div>;
    }
  };

  const getElementProps = ({ $key, $options, $rows = 5, $hasSearch, helpText, description, type }) => {
    switch (type) {
      case 'password':
      case 'text':
      case 'textarea':
        return {
          type,
          placeholder: description,
          className: 'form-control',
          value: options[$key].value,
          ...(type === 'textarea' && { rows: $rows }),
          ...(helpText && { helpText }),
          onChange: (e) => optionchanged($key, e.target.value),
        };
      case 'toggle':
        return {
          defaultChecked: options[$key],
          onChange: () => optionchanged($key, !options[$key]),
        };
      case 'dropdown':
      case 'dropdown-component-flip':
        return {
          options: $options,
          value: options[$key]?.value,
          hasSearch: $hasSearch,
          onChange: (value) => optionchanged($key, value),
        };
      case 'react-component-headers':
        return {
          getter: $key,
          options: options[$key].value,
          optionchanged,
        };
      case 'react-component-oauth-authentication':
        return {
          grant_type: options.grant_type.value,
          auth_type: options.auth_type.value,
          add_token_to: options.add_token_to.value,
          header_prefix: options.header_prefix.value,
          access_token_url: options.access_token_url.value,
          client_id: options.client_id.value,
          client_secret: options.client_secret.value,
          client_auth: options.client_auth.value,
          scopes: options.scopes.value,
          auth_url: options.auth_url.value,
          custom_auth_params: options.custom_auth_params.value,
          optionchanged,
        };
      case 'react-component-google-sheets':
      case 'react-component-slack':
        return { optionchanged, createDataSource, options, isSaving, selectedDataSource };
      default:
        return {};
    }
  };

  const getLayout = (obj) => {
    return (
      <div className="row">
        {Object.keys(obj).map((key) => {
          const { $label, type } = obj[key];

          const Element = getElement(type);

          return (
            <div className="col-md-12 my-2" key={key}>
              {$label && (
                <label className="form-label">
                  {$label}
                  {type === 'password' && (
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

  const flipComponentDropdown = find(schema.properties, ['type', 'dropdown-component-flip']);

  if (flipComponentDropdown) {
    return (
      <div className="row">
        <div className="col-md-12 my-2">
          {flipComponentDropdown.$label && <label className="form-label">{flipComponentDropdown.$label}</label>}
          <Select {...getElementProps(flipComponentDropdown)} />
        </div>
        {getLayout(schema.properties[options[flipComponentDropdown.$key].value])}
      </div>
    );
  }

  return getLayout(schema.properties);
};

export default DynamicForm;
