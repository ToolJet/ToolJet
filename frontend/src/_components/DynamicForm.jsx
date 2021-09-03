import React from 'react';
import Input from '@/_ui/Input';
import Headers from '@/_ui/Headers';
import OAuth from '@/_ui/OAuth';

import GoogleSheets from '@/_components/GoogleSheets';
import Slack from '@/_components/Slack';

const DynamicForm = ({ schema, optionchanged, createDataSource, options, isSaving, selectedDataSource }) => {
  // if(schema.properties)  todo add empty check

  const getElement = (type) => {
    switch (type) {
      case 'password':
      case 'text':
        return Input;
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

  const getElementProps = ({ $key, description, type }) => {
    switch (type) {
      case 'password':
      case 'text':
        return {
          type,
          placeholder: description,
          className: 'form-control',
          value: options[$key].value,
        };
      case 'react-component-headers':
        return {
          getter: $key,
          options: options.headers.value,
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

  return (
    <div className="row">
      {Object.keys(schema.properties).map((key) => {
        const { $label, type } = schema.properties[key];
        const Element = getElement(type);
        return (
          <div className="col-md-12 my-2">
            {$label && <label className="form-label">{$label}</label>}
            <Element {...getElementProps(schema.properties[key])} />
          </div>
        );
      })}
    </div>
  );
};

export default DynamicForm;
