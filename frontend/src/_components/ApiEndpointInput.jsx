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
  patch: 'orange',
  options: 'purple',
  head: 'cyan',
  trace: 'pink',
};

const extractSchemaProperties = (schema) => {
  if (!schema) return {};

  if (schema.properties) {
    return schema.properties;
  }

  if (schema.allOf) {
    return schema.allOf.reduce((acc, subSchema) => {
      return { ...acc, ...extractSchemaProperties(subSchema) };
    }, {});
  }

  if (schema.oneOf) {
    return schema.oneOf.reduce((acc, subSchema) => {
      return { ...acc, ...extractSchemaProperties(subSchema) };
    }, {});
  }

  if (schema.anyOf) {
    return schema.anyOf.reduce((acc, subSchema) => {
      return { ...acc, ...extractSchemaProperties(subSchema) };
    }, {});
  }

  // Fallback: infer properties from example
  if (schema.example && typeof schema.example === 'object') {
    return Object.entries(schema.example).reduce((acc, [key, value]) => {
      acc[key] = {
        type: Array.isArray(value) ? 'array' : typeof value,
        example: value,
      };
      return acc;
    }, {});
  }

  return {};
};

const ApiEndpointInput = (props) => {
  const [loadingSpec, setLoadingSpec] = useState(true);
  const [options, setOptions] = useState(props.options);
  const [specJson, setSpecJson] = useState(null);
  const [operationParams, setOperationParams] = useState({});

  // Check if specUrl is an object (multiple specs) or string (single spec)
  const isMultiSpec = typeof props.specUrl === 'object' && !Array.isArray(props.specUrl);
  // Initialize selectedSpecType from props.options.specType if available
  const [selectedSpecType, setSelectedSpecType] = useState(
    isMultiSpec ? props.options?.specType || Object.keys(props.specUrl)[0] || '' : null
  );

  const fetchOpenApiSpec = (specUrlOrType) => {
    setLoadingSpec(true);

    const url = isMultiSpec ? props.specUrl[specUrlOrType] : props.specUrl;

    openapiService
      .fetchSpecFromUrl(url)
      .then((response) => response.text())
      .then((text) => {
        const format = url.endsWith('.json') ? 'json' : 'yaml';
        return openapiService.parseOpenapiSpec(text, format).then((data) => {
          setSpecJson(data);

          if (isMultiSpec) {
            // MODIFIED: Retain existing values instead of clearing them
            const currentParams = options?.params || {
              path: {},
              query: {},
              request: {},
            };

            // Keep existing values if the operation/path still exists in the new spec
            let newOperation = options?.operation;
            let newPath = options?.path;
            let newSelectedOperation = null;

            // Validate if the current operation/path exists in the new spec
            if (newPath && newOperation && data?.paths?.[newPath]?.[newOperation]) {
              newSelectedOperation = buildSelectedOperation(data, newPath, newOperation);
            } else {
              // Only clear if the operation/path doesn't exist in the new spec
              newOperation = null;
              newPath = null;
            }

            const newOptions = {
              ...options,
              operation: newOperation,
              path: newPath,
              selectedOperation: newSelectedOperation,
              params: currentParams, // Retain existing params
              specType: specUrlOrType,
            };

            setOptions(newOptions);
            props.optionsChanged(newOptions);
          }

          setLoadingSpec(false);
        });
      })
      .catch((err) => {
        console.error('Failed to load OpenAPI spec:', err);
        setLoadingSpec(false);
      });
  };

  const getOperationKey = (operation, path) => {
    return `${operation}_${path}`;
  };

  // Merge path-level parameters (shared across all operations on a path) with
  // operation-level parameters, so path params like {companyid} are always visible.
  const buildSelectedOperation = (spec, path, operation) => {
    const operationObj = spec?.paths?.[path]?.[operation];
    if (!operationObj) return operationObj;
    const pathLevelParams = spec.paths[path]?.parameters || [];
    const operationLevelParams = operationObj.parameters || [];
    const merged = [
      ...pathLevelParams.filter((p) => !operationLevelParams.some((op) => op.name === p.name && op.in === p.in)),
      ...operationLevelParams,
    ];
    return { ...operationObj, parameters: merged };
  };

  const changeOperation = (value) => {
    const operation = value.split('/', 2)[0];
    const path = value.substring(value.indexOf('/'));

    if (options.operation && options.path) {
      const currentOperationKey = getOperationKey(options.operation, options.path);
      setOperationParams((prevState) => ({
        ...prevState,
        [currentOperationKey]: options.params,
      }));
    }

    const newOperationKey = getOperationKey(operation, path);
    const savedParams = operationParams[newOperationKey] || {
      path: {},
      query: {},
      request: {},
    };

    // Merge path-level parameters into the operation per OpenAPI 3.0 spec.
    // The react-component-api-endpoint widget reads parameters from selectedOperation only,
    // so path-level params (specJson.paths[path].parameters) must be merged here.
    // Operation-level params with the same name+in override path-level ones.
    const operationObj = specJson.paths[path][operation];
    const pathLevelParams = specJson.paths[path].parameters;
    let mergedOperation = operationObj;
    if (Array.isArray(pathLevelParams) && pathLevelParams.length > 0) {
      const opParams = operationObj.parameters || [];
      const opParamKeys = new Set(opParams.map((p) => `${p.name}:${p.in}`));
      const inherited = pathLevelParams.filter((p) => !opParamKeys.has(`${p.name}:${p.in}`));
      if (inherited.length > 0) {
        mergedOperation = { ...operationObj, parameters: [...opParams, ...inherited] };
      }
    }

    const newOptions = {
      ...options,
      path,
      operation,
      selectedOperation: buildSelectedOperation(specJson, path, operation),
      params: savedParams,
      ...(isMultiSpec && { specType: selectedSpecType }), // Include specType if multiSpec
    };

    setOptions(newOptions);
    props.optionsChanged(newOptions);
  };

  const changeParam = (paramType, paramName, value) => {
    if (value === '') {
      removeParam(paramType, paramName);
    } else {
      // Store the value as-is for all param types
      const newOptions = {
        ...options,
        params: {
          ...options.params,
          [paramType]: {
            ...options.params[paramType],
            [paramName]: value,
          },
        },
        ...(isMultiSpec && { specType: selectedSpecType }),
      };
      setOptions(newOptions);
      props.optionsChanged(newOptions);
    }
  };

  const removeParam = (paramType, paramName) => {
    const newOptions = JSON.parse(JSON.stringify(options));
    const newParams = { ...newOptions.params };
    const newParamType = { ...newParams[paramType] };

    delete newParamType[paramName];

    newParams[paramType] = newParamType;
    newOptions.params = newParams;
    if (isMultiSpec) {
      newOptions.specType = selectedSpecType; // Include specType if multiSpec
    }
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
        <div>
          <div className="d-flex align-items-center">
            <span className={`badge bg-${operationColorMapping[operation]} me-2`}>{operation.toUpperCase()}</span>
            <span>{path}</span>
          </div>
          {summary && !isSelected && (
            <div>
              <small className="d-block" style={{ fontSize: '0.875em', color: '#a4a8ab', marginTop: '1px' }}>
                {summary}
              </small>
            </div>
          )}
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
  const VALID_HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace']);

  const computeOperationSelectionOptions = () => {
    const paths = specJson?.paths;
    if (isEmpty(paths)) return [];

    const pathGroups = Object.keys(paths).reduce((acc, path) => {
      const operations = Object.keys(paths[path]).filter((key) => VALID_HTTP_METHODS.has(key));
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
    if (contentTypes.length === 0) return {};

    const contentType = contentTypes.includes('application/json') ? 'application/json' : contentTypes[0];
    const contentData = options.selectedOperation.requestBody.content[contentType];
    const schema = contentData?.schema;

    // If there's no schema at all (e.g. text/plain with only examples),
    // expose a single "body" field and try to pull a default from examples
    if (!schema) {
      let exampleValue = '';
      if (contentData?.examples) {
        const firstExampleKey = Object.keys(contentData.examples)[0];
        exampleValue = contentData.examples[firstExampleKey]?.value ?? '';
      } else if (contentData?.example) {
        exampleValue = contentData.example;
      }
      return {
        body: {
          type: 'string',
          example: exampleValue ?? '',
          description: 'Request body',
        },
      };
    }

    const properties = extractSchemaProperties(schema);

    if (Object.keys(properties).length === 0 && schema) {
      return {
        body: {
          type: schema.type || 'string',
          description: 'Request body',
          example: schema.example ?? '',
        },
      };
    }

    return properties;
  };

  useEffect(() => {
    const queryParams = {
      path: props.options?.params?.path ?? {},
      query: props.options?.params?.query ?? {},
      request: props.options?.params?.request ?? {},
    };
    setLoadingSpec(true);

    // Initialize options with specType if multiSpec
    const initialOptions = {
      ...props.options,
      params: queryParams,
      ...(isMultiSpec && { specType: selectedSpecType }),
    };
    setOptions(initialOptions);

    if (!isMultiSpec) {
      fetchOpenApiSpec();
    }
  }, []);

  useEffect(() => {
    if (isMultiSpec && selectedSpecType) {
      fetchOpenApiSpec(selectedSpecType);
    }
  }, [selectedSpecType]);

  const handleSpecTypeChange = (val) => {
    setSelectedSpecType(val);
    // When spec type changes, immediately update options with new specType
    const newOptions = {
      ...options,
      specType: val,
      // Clear operation-specific data when changing spec type
      operation: null,
      path: null,
      selectedOperation: null,
      params: {
        path: {},
        query: {},
        request: {},
      },
    };
    setOptions(newOptions);
    props.optionsChanged(newOptions);
  };

  const specTypeOptions = isMultiSpec
    ? Object.keys(props.specUrl).map((key) => ({
        value: key,
        label: key
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
      }))
    : [];

  return (
    <div>
      {/* Render spec type dropdown only for multi-spec */}
      {isMultiSpec && (
        <div className="dropdown-container mb-3">
          <label className="form-label dropdown-label">{props.t('globals.specType', 'Entity')}</label>
          <div>
            <Select
              options={specTypeOptions}
              value={{
                value: selectedSpecType,
                label: selectedSpecType
                  .split('_')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' '),
              }}
              onChange={(val) => handleSpecTypeChange(val)}
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
          <div className="dropdown-container mb-3">
            <label className="form-label dropdown-label">{props.t('globals.operation', 'Operation')}</label>
            <div className="stripe-operation-options">
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
      <div className={`${type === 'request' ? 'request-body' : type}-fields`}>
        <h5 className="text-heading form-label mb-2">{label}</h5>
        <div className="input-group-parent-container">
          {filteredParams.map((param) => (
            <div className="input-group-wrapper" key={type === 'request' ? param : param.name}>
              <div className="input-group">
                {paramDetails(param)}
                <div
                  className="col field overflow-hidden code-hinter-borderless"
                  style={{
                    width: 'min-content',
                  }}
                >
                  {inputField(param)}
                </div>
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
