import React, { useEffect, useState } from 'react';
import { openapiService } from '@/_services';
import Select from '@/_ui/Select';
import { queryManagerSelectComponentStyle } from '@/_ui/Select/styles';
import DOMPurify from 'dompurify';
import { ToolTip } from '@/_components';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { withTranslation } from 'react-i18next';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import SolidIcons from '@/_ui/Icon/SolidIcons';

const operationColorMapping = {
  get: 'azure',
  post: 'green',
  delete: 'red',
  put: 'yellow',
};

const ApiEndpointInput = (props) => {
  const [loadingSpec, setLoadingSpec] = useState(true);
  const [options, setOptions] = useState(props.options);
  const [specJson, setSpecJson] = useState(null);

  const fetchOpenApiSpec = () => {
    setLoadingSpec(true);
    openapiService
      .fetchSpecFromUrl(props.specUrl)
      .then((response) => response.text())
      .then((text) => {
        const data = JSON.parse(text);
        setSpecJson(data);
        setLoadingSpec(false);
      });
  };

  const changeOperation = (value) => {
    const operation = value.split('/', 2)[0];
    const path = value.substring(value.indexOf('/'));
    const newOptions = { ...options, path, operation, selectedOperation: specJson.paths[path][operation] };
    setOptions(newOptions);
    props.optionsChanged(newOptions);
  };

  const changeParam = (paramType, paramName, value) => {
    if (value === '') {
      removeParam(paramType, paramName);
    } else {
      const newOptions = {
        ...options,
        params: {
          ...options.params,
          [paramType]: {
            ...options.params[paramType],
            [paramName]: value,
          },
        },
      };
      setOptions(newOptions);
      props.optionsChanged(newOptions);
    }
  };

  const removeParam = (paramType, paramName) => {
    const newOptions = JSON.parse(JSON.stringify(options));
    delete newOptions['params'][paramType][paramName];
    setOptions(newOptions);
    props.optionsChanged(newOptions);
  };

  const renderOperationOption = (data) => {
    const path = data.value.substring(data.value.indexOf('/'));
    const operation = data.operation;
    if (path && operation) {
      return (
        <div className="row">
          <div className="col-auto" style={{ width: '60px' }}>
            <span className={`badge bg-${operationColorMapping[operation]}`}>{operation}</span>
          </div>
          <div className="col">
            <span>{path}</span>
          </div>
        </div>
      );
    } else {
      return 'Select an operation';
    }
  };

  const categorizeOperations = (operation, path, acc, category) => {
    const option = {
      value: `${operation}${path}`,
      label: `${path}`,
      name: path,
      operation: operation,
    };
    const existingCategory = acc.find((obj) => obj.label === category);
    if (existingCategory) {
      existingCategory.options.push(option);
    } else {
      acc.push({
        label: category,
        options: [option],
      });
    }
  };

  const computeOperationSelectionOptions = () => {
    const paths = specJson?.paths;
    if (isEmpty(paths)) return [];

    const pathGroups = Object.keys(paths).reduce((acc, path) => {
      const operations = Object.keys(paths[path]).filter((op) => Object.keys(operationColorMapping).includes(op));
      const category = path.split('/')[2];
      operations.forEach((operation) => categorizeOperations(operation, path, acc, category));
      return acc;
    }, []);

    return pathGroups;
  };

  useEffect(() => {
    const queryParams = {
      path: props.options?.params?.path ?? {},
      query: props.options?.params?.query ?? {},
      request: props.options?.params?.request ?? {},
    };
    setLoadingSpec(true);
    setOptions({ ...props.options, params: queryParams });
    fetchOpenApiSpec();
  }, []);

  return (
    <div>
      {loadingSpec && (
        <div className="p-3">
          <div className="spinner-border spinner-border-sm text-azure mx-2" role="status"></div>
          <span>Please wait while we load the OpenAPI specification.</span>
        </div>
      )}
      {options && !loadingSpec && (
        <div>
          <div className="d-flex g-2">
            <div className="col-12 form-label">
              <label className="form-label">{props.t('globals.operation', 'Operation')}</label>
            </div>
            <div className="col stripe-operation-options flex-grow-1" style={{ width: '90px', marginTop: 0 }}>
              <Select
                options={computeOperationSelectionOptions()}
                value={{
                  operation: options?.operation,
                  value: `${options?.operation}${options?.path}`,
                }}
                onChange={(value) => changeOperation(value)}
                width={'100%'}
                useMenuPortal={true}
                customOption={renderOperationOption}
                styles={queryManagerSelectComponentStyle(props.darkMode, '100%')}
                useCustomStyles={true}
              />
              {options?.selectedOperation && (
                <small
                  style={{ margintTop: '10px' }}
                  className="my-2"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(options?.selectedOperation?.description) }}
                />
              )}
            </div>
          </div>
          {options?.selectedOperation && (
            <div className={`row stripe-fields-row ${props.darkMode && 'theme-dark'}`}>
              <RenderParameterFields
                parameters={options?.selectedOperation?.parameters}
                type="path"
                label={props.t('globals.path', 'PATH')}
                options={options}
                changeParam={changeParam}
                removeParam={removeParam}
                darkMode={props.darkMode}
              />
              <RenderParameterFields
                parameters={options?.selectedOperation?.parameters}
                type="query"
                label={props.t('globals.query'.toUpperCase(), 'Query')}
                options={options}
                changeParam={changeParam}
                removeParam={removeParam}
                darkMode={props.darkMode}
              />
              <RenderParameterFields
                parameters={
                  options?.selectedOperation?.requestBody?.content[
                    Object.keys(options?.selectedOperation?.requestBody?.content)[0]
                  ]?.schema?.properties ?? {}
                }
                type="request"
                label={props.t('globals.requestBody', 'REQUEST BODY')}
                options={options}
                changeParam={changeParam}
                removeParam={removeParam}
                darkMode={props.darkMode}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default withTranslation()(ApiEndpointInput);

ApiEndpointInput.propTypes = {
  options: PropTypes.object,
  specUrl: PropTypes.string,
  optionsChanged: PropTypes.func,
  darkMode: PropTypes.bool,
  t: PropTypes.func,
};

const RenderParameterFields = ({ parameters, type, label, options, changeParam, removeParam, darkMode }) => {
  let filteredParams;
  if (type === 'request') {
    filteredParams = Object.keys(parameters);
  } else {
    filteredParams = parameters?.filter((param) => param.in === type);
  }

  const paramLabelWithDescription = (param) => {
    const paramValue = type === 'request' ? param : param.name;
    const chWidth = paramValue.length + 1;
    return (
      <ToolTip message={type === 'request' ? DOMPurify.sanitize(parameters[param].description) : param.description}>
        <div className="cursor-help">
          <input
            type="text"
            value={type === 'request' ? param : param.name}
            className="form-control form-control-underline"
            placeholder="key"
            disabled
            style={{ width: `${chWidth}ch`, paddingRight: '0px' }}
          />
        </div>
      </ToolTip>
    );
  };

  const paramLabelWithoutDescription = (param) => {
    const paramValue = type === 'request' ? param : param.name;
    const chWidth = paramValue.length + 1;

    return (
      <input
        type="text"
        value={paramValue}
        className="form-control"
        placeholder="key"
        disabled
        style={{ width: `${chWidth}ch`, paddingRight: '0px' }}
      />
    );
  };

  const paramType = (param) => {
    return (
      <div className="p-2 text-muted">
        {type === 'query' &&
          param?.schema?.anyOf &&
          param?.schema?.anyOf.map((type, i) =>
            i < param.schema?.anyOf.length - 1
              ? type.type.substring(0, 3).toUpperCase() + '|'
              : type.type.substring(0, 3).toUpperCase()
          )}
        {(type === 'path' || (type === 'query' && !param?.schema?.anyOf)) &&
          param?.schema?.type?.substring(0, 3).toUpperCase()}
        {type === 'request' && parameters[param].type?.substring(0, 3).toUpperCase()}
      </div>
    );
  };

  const paramDetails = (param) => {
    return (
      <div className="col-auto d-flex field field-width-179 align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          {(type === 'request' && parameters[param].description) || param?.description
            ? paramLabelWithDescription(param)
            : paramLabelWithoutDescription(param)}
          {param.required && <span className="text-danger fw-bold">*</span>}
        </div>
        {paramType(param)}
      </div>
    );
  };

  const inputField = (param) => {
    return (
      <CodeHinter
        initialValue={(type === 'request' ? options?.params[type][param] : options?.params[type][param.name]) ?? ''}
        mode="text"
        placeholder={'Value'}
        theme={darkMode ? 'monokai' : 'duotone-light'}
        lineNumbers={false}
        onChange={(value) => {
          if (type === 'request') {
            changeParam(type, param, value);
          } else {
            changeParam(type, param.name, value);
          }
        }}
        height={'32px'}
      />
    );
  };

  const clearButton = (param) => {
    const handleClear = () => {
      if (type === 'request') {
        removeParam(type, param);
      } else {
        removeParam(type, param.name);
      }
    };

    return (
      <span
        className="code-hinter-clear-btn"
        role="button"
        onClick={handleClear}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleClear();
          }
        }}
        tabIndex="0"
      >
        <SolidIcons name="removerectangle" width="20" fill="#ACB2B9" />
      </span>
    );
  };

  return (
    filteredParams?.length > 0 && (
      <div className={`${type === 'request' ? 'request-body' : type}-fields d-flex`}>
        <h5 className="text-heading form-label">{label}</h5>
        <div className="flex-grow-1 input-group-parent-container">
          {filteredParams.map((param) => (
            <div className="input-group-wrapper" key={type === 'request' ? param : param.name}>
              <div className="input-group">
                {paramDetails(param)}
                <div className="col field overflow-hidden code-hinter-borderless">{inputField(param)}</div>
                {((type === 'request' && options['params'][type][param]) || options['params'][type][param.name]) &&
                  clearButton(param)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  );
};

RenderParameterFields.propTypes = {
  parameters: PropTypes.any,
  type: PropTypes.string,
  label: PropTypes.string,
  options: PropTypes.object,
  changeParam: PropTypes.func,
  removeParam: PropTypes.func,
  darkMode: PropTypes.bool,
};
