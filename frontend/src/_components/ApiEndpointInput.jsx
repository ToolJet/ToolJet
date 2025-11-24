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

const extractSchemaProperties = (schema) => {
  if (!schema) return {};

  if (schema.properties) {
    return schema.properties;
  }

  // Handle allOf - merge all properties
  if (schema.allOf) {
    return schema.allOf.reduce((acc, subSchema) => {
      const props = extractSchemaProperties(subSchema);
      return { ...acc, ...props };
    }, {});
  }

  if (schema.oneOf) {
    return schema.oneOf.reduce((acc, subSchema) => {
      const props = extractSchemaProperties(subSchema);
      return { ...acc, ...props };
    }, {});
  }

  // Handle anyOf - similar to oneOf
  if (schema.anyOf) {
    return schema.anyOf.reduce((acc, subSchema) => {
      const props = extractSchemaProperties(subSchema);
      return { ...acc, ...props };
    }, {});
  }

  if (schema.$ref) {
    console.warn('$ref found in schema, which may need to be resolved:', schema.$ref);
    return {};
  }

  return {};
};

const ApiEndpointInput = (props) => {
  const [loadingSpec, setLoadingSpec] = useState(true);
  const [options, setOptions] = useState(props.options);
  const [specJson, setSpecJson] = useState(null);

  // Check if specUrl is an object (multiple specs) or string (single spec)
  const isMultiSpec = typeof props.specUrl === 'object' && !Array.isArray(props.specUrl);
  const [selectedSpecType, setSelectedSpecType] = useState(isMultiSpec ? Object.keys(props.specUrl)[0] || '' : null);

  const fetchOpenApiSpec = (specUrlOrType) => {
    setLoadingSpec(true);

    const url = isMultiSpec ? props.specUrl[specUrlOrType] : props.specUrl;

    openapiService
      .fetchSpecFromUrl(url)
      .then((response) => response.text())
      .then((text) => {
        const format = url.endsWith('.json') ? 'json' : 'yaml';
        openapiService.parseOpenapiSpec(text, format).then((data) => {
          setSpecJson(data);

          if (isMultiSpec) {
            // Clear all parameters when switching specs
            const queryParams = {
              path: {},
              query: {},
              request: {},
            };

            let newOperation = null;
            let newPath = null;
            let newSelectedOperation = null;

            if (options?.path && options?.operation && data?.paths?.[options.path]?.[options.operation]) {
              newOperation = options.operation;
              newPath = options.path;
              newSelectedOperation = data.paths[options.path][options.operation];
            }

            const newOptions = {
              ...options,
              operation: newOperation,
              path: newPath,
              selectedOperation: newSelectedOperation,
              params: queryParams,
            };

            setOptions(newOptions);
            props.optionsChanged(newOptions);
          }

          setLoadingSpec(false);
        });
      });
  };

  const changeOperation = (value) => {
    const operation = value.split('/', 2)[0];
    const path = value.substring(value.indexOf('/'));

    // Clear all params when changing operation
    const queryParams = {
      path: {},
      query: {},
      request: {},
    };

    const newOptions = {
      ...options,
      path,
      operation,
      selectedOperation: specJson.paths[path][operation],
      params: queryParams,
    };

    setOptions(newOptions);
    props.optionsChanged(newOptions);
  };

  const changeParam = (paramType, paramName, value) => {
    if (value === '') {
      removeParam(paramType, paramName);
    } else {
      let parsedValue = value;

      if (paramType === 'request') {
        try {
          parsedValue = JSON.parse(value);
        } catch (e) {
          console.error(`Invalid JSON for request param "${paramName}":`, e);
          parsedValue = value;
        }
      }

      const newOptions = {
        ...options,
        params: {
          ...options.params,
          [paramType]: {
            ...options.params[paramType],
            [paramName]: parsedValue,
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
    const path = data.displayLabel || data.value.substring(data.value.indexOf('/'));
    const operation = data.operation;
    const summary = data.summary;
    const isSelected = data.isSelected;

    if (path && operation) {
      return (
        <div className="d-flex align-items-start">
          <div className="me-2" style={{ minWidth: '60px' }}>
            <span className={`badge bg-${operationColorMapping[operation]}`}>{operation.toUpperCase()}</span>
          </div>
          <div className="flex-grow-1">
            <div>{path}</div>
            {summary && !isSelected && (
              <small className="text-muted d-block" style={{ fontSize: '0.875em' }}>
                {summary}
              </small>
            )}
          </div>
        </div>
      );
    } else {
      return 'Select an operation';
    }
  };

  const categorizeOperations = (operation, path, acc, category) => {
    const operationData = specJson.paths[path][operation];
    const summary = operationData?.summary || '';

    // Create searchable label that includes both path and summary
    const searchableLabel = summary ? `${path} ${summary}` : path;

    const option = {
      value: `${operation}${path}`,
      label: searchableLabel,
      name: path,
      operation: operation,
      summary: summary || null,
      displayLabel: path, // Keep original path for display
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
      const operations = Object.keys(paths[path]);
      const category = path.split('/')[2];
      operations.forEach((operation) => categorizeOperations(operation, path, acc, category));
      return acc;
    }, []);

    return pathGroups;
  };

  const getRequestBodyProperties = () => {
    if (!options?.selectedOperation?.requestBody?.content) {
      return {};
    }

    const contentTypes = Object.keys(options.selectedOperation.requestBody.content);
    if (contentTypes.length === 0) {
      return {};
    }

    const contentType = contentTypes.includes('application/json') ? 'application/json' : contentTypes[0];

    const schema = options.selectedOperation.requestBody.content[contentType]?.schema;
    return extractSchemaProperties(schema);
  };

  useEffect(() => {
    const queryParams = {
      path: props.options?.params?.path ?? {},
      query: props.options?.params?.query ?? {},
      request: props.options?.params?.request ?? {},
    };
    setLoadingSpec(true);
    setOptions({ ...props.options, params: queryParams });

    if (!isMultiSpec) {
      fetchOpenApiSpec();
    }
  }, []);

  useEffect(() => {
    if (isMultiSpec && selectedSpecType) {
      fetchOpenApiSpec(selectedSpecType);
    }
  }, [selectedSpecType]);

  const specTypeOptions = isMultiSpec
    ? Object.keys(props.specUrl).map((key) => ({
        value: key,
        label: key,
      }))
    : [];

  return (
    <div>
      {/* Render spec type dropdown only for multi-spec */}
      {isMultiSpec && (
        <div className="d-flex g-2 mb-3">
          <div className="col-3 form-label">
            <label className="form-label">{props.t('globals.specType', 'Spec Type')}</label>
          </div>
          <div className="col flex-grow-1">
            <Select
              options={specTypeOptions}
              value={{ value: selectedSpecType, label: selectedSpecType }}
              onChange={(val) => setSelectedSpecType(val)}
              width={'100%'}
              styles={queryManagerSelectComponentStyle(props.darkMode, '100%')}
            />
          </div>
        </div>
      )}

      {loadingSpec && (
        <div className="p-3">
          <div className="spinner-border spinner-border-sm text-azure mx-2" role="status"></div>
          {props.t('', 'Please wait while we load the OpenAPI specification.')}
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
                value={
                  options?.operation && options?.path
                    ? {
                        operation: options?.operation,
                        value: `${options?.operation}${options?.path}`,
                        summary: options?.selectedOperation?.summary || null,
                        isSelected: true,
                        displayLabel: options?.path,
                        label: options?.selectedOperation?.summary
                          ? `${options?.path} ${options?.selectedOperation?.summary}`
                          : options?.path,
                      }
                    : null
                }
                onChange={(value) => changeOperation(value)}
                width={'100%'}
                useMenuPortal={true}
                customOption={renderOperationOption}
                styles={queryManagerSelectComponentStyle(props.darkMode, '100%')}
                useCustomStyles={true}
                filterOption={(option, inputValue) => {
                  if (!inputValue) return true;
                  const searchValue = inputValue.toLowerCase();
                  const pathMatch = option.data.displayLabel?.toLowerCase().includes(searchValue);
                  const summaryMatch = option.data.summary?.toLowerCase().includes(searchValue);
                  return pathMatch || summaryMatch;
                }}
              />
              {options?.selectedOperation && (
                <small
                  style={{ marginTop: '10px' }}
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
                parameters={getRequestBodyProperties()}
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
  specUrl: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  optionsChanged: PropTypes.func,
  darkMode: PropTypes.bool,
  t: PropTypes.func,
};

const RenderParameterFields = ({ parameters, type, label, options, changeParam, removeParam, darkMode }) => {
  let filteredParams;
  if (type === 'request') {
    filteredParams = Object.keys(parameters || {});
  } else {
    filteredParams = parameters?.filter((param) => param.in === type);
  }

  const paramLabelWithDescription = (param) => {
    return (
      <ToolTip
        message={type === 'request' ? DOMPurify.sanitize(parameters[param]?.description || '') : param.description}
      >
        <div className="cursor-help">
          <input
            type="text"
            value={type === 'request' ? param : param.name}
            className="form-control form-control-underline"
            placeholder="key"
            disabled
          />
        </div>
      </ToolTip>
    );
  };

  const paramLabelWithoutDescription = (param) => {
    return (
      <input
        type="text"
        value={type === 'request' ? param : param.name}
        className="form-control"
        placeholder="key"
        disabled
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
        {type === 'request' && parameters[param]?.type?.substring(0, 3).toUpperCase()}
      </div>
    );
  };

  const paramDetails = (param) => {
    return (
      <div className="col-auto d-flex field field-width-179 align-items-center">
        {(type === 'request' && parameters[param]?.description) || param?.description
          ? paramLabelWithDescription(param)
          : paramLabelWithoutDescription(param)}
        {(type === 'request' ? parameters[param]?.required : param.required) && (
          <span className="text-danger fw-bold">*</span>
        )}
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
                {((type === 'request' && options['params'][type][param]) || options['params'][type][param?.name]) &&
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
