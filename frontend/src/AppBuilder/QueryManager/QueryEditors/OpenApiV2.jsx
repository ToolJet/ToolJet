import React, { useEffect, useMemo, useState } from 'react';
import Select from '@/_ui/Select';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';
import { queryManagerSelectComponentStyle } from '@/_ui/Select/styles';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { openApiSpecService } from '@/_services';
import { useOpenApiSpecStatus } from '@/_hooks/use-openapi-spec-status';

const operationColorMapping = {
  get: 'azure',
  post: 'green',
  delete: 'red',
  put: 'yellow',
  patch: 'orange',
  head: 'blue',
};

// Mirrors the same pattern used by GRPCv2.jsx's operation dropdown - debounces the raw input
// so a server round-trip isn't fired on every keystroke.
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const DeleteIcon = ({ onClick }) => (
  <span className="col-auto field-width-28 d-flex" role="button" onClick={onClick}>
    <svg width="100%" height="100%" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.99931 6.97508L11.0242 12.0014L12 11.027L6.9737 6.00069L12 0.975767L11.0256 0L5.99931 5.0263L0.974388 0L0 0.975767L5.02492 6.00069L0 11.0256L0.974388 12.0014L5.99931 6.97508Z"
        fill="#11181C"
      />
    </svg>
  </span>
);

// One labelled group of param rows (HEADER / PATH / QUERY / REQUEST BODY), mirroring the
// legacy Openapi.jsx layout so this reads consistently in the query editor, but sourced from
// the fetched operation detail instead of a client-side walk of the whole spec.
const ParamFieldGroup = ({ title, paramNames, values, onChange, onRemove }) => {
  if (!paramNames.length) return null;
  return (
    <div className="path-fields">
      <h5 className="text-heading">{title}</h5>
      <div className="input-group-parent-container">
        {paramNames.map((name) => (
          <div className="input-group-wrapper" key={name}>
            <div className="input-group">
              <div className="col-auto field field-width-179">
                <input type="text" value={name} className="form-control border-0" placeholder="key" disabled />
              </div>
              <div className="col field overflow-hidden">
                <CodeHinter
                  type="basic"
                  initialValue={values[name] ?? ''}
                  placeholder="Value"
                  onChange={(value) => onChange(name, value)}
                />
              </div>
              <DeleteIcon onClick={() => onRemove(name)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OpenApiV2 = ({ selectedDataSource, options = {}, optionsChanged, darkMode, currentEnvironment }) => {
  const { t } = useTranslation();
  const dataSourceId = selectedDataSource?.id;
  const environmentId = currentEnvironment?.id;

  const { isReady, isPending, isFailed, error: specError } = useOpenApiSpecStatus(dataSourceId, environmentId);

  const [metadata, setMetadata] = useState(null);
  const [operations, setOperations] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [operationDetail, setOperationDetail] = useState(null);
  const [loadingOperations, setLoadingOperations] = useState(false);
  const [operationSearchInput, setOperationSearchInput] = useState('');
  const debouncedOperationSearch = useDebounce(operationSearchInput, 300);

  const localOptions = {
    path: options?.path,
    operation: options?.operation,
    host: options?.host,
    // References the openapi_spec_operation row's own `id`, not the spec's operationId -
    // operationId is optional in the spec (and not unique-constrained even when present), so
    // the backend uses the row id as the identity for the metadata index and the detail fetch.
    operationRecordId: options?.operationRecordId,
    params: {
      path: options?.params?.path || {},
      query: options?.params?.query || {},
      header: options?.params?.header || {},
      request: options?.params?.request || {},
    },
  };

  // Tier 1: services - fetched once the spec is ready.
  useEffect(() => {
    if (!isReady || !dataSourceId || !environmentId) return;
    openApiSpecService
      .getMetadata(dataSourceId, environmentId)
      .then(setMetadata)
      .catch(() => setMetadata(null));
  }, [isReady, dataSourceId, environmentId]);

  // Tier 2: operations for the selected (or default) service - lightweight, no schema yet.
  // Search is server-side: typing in the dropdown updates operationSearchInput, debounced here,
  // and re-fetches against the backend's search param (path/name/tag - see
  // listOpenApiSpecOperations) rather than filtering a client-side list. perPage is generous
  // (1000) for the common no-search case, but the search itself is what keeps a spec with more
  // operations than that usable, not the page size.
  useEffect(() => {
    if (!isReady || !dataSourceId || !environmentId) return;
    setLoadingOperations(true);
    openApiSpecService
      .getOperations(dataSourceId, environmentId, {
        service: selectedService,
        search: debouncedOperationSearch || undefined,
        perPage: 1000,
      })
      .then((result) => setOperations(result?.operations || []))
      .catch(() => setOperations([]))
      .finally(() => setLoadingOperations(false));
  }, [isReady, dataSourceId, environmentId, selectedService, debouncedOperationSearch]);

  // Tier 3: full schema for the selected operation - fetched only on selection.
  useEffect(() => {
    if (!isReady || !dataSourceId || !environmentId || !localOptions.operationRecordId) {
      setOperationDetail(null);
      return;
    }
    openApiSpecService
      .getOperation(dataSourceId, environmentId, localOptions.operationRecordId)
      .then(setOperationDetail)
      .catch(() => setOperationDetail(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, dataSourceId, environmentId, localOptions.operationRecordId]);

  const hostOptions = useMemo(() => {
    if (selectedDataSource?.options?.host?.value) return [selectedDataSource.options.host.value];
    return metadata?.servers || [];
  }, [selectedDataSource?.options?.host?.value, metadata?.servers]);

  const serviceOptions = useMemo(
    () => (metadata?.services || []).map((service) => ({ name: service.name, value: service.id })),
    [metadata?.services]
  );

  const operationOptions = useMemo(
    () =>
      operations.map((operation) => ({
        value: operation.id,
        // SelectComponent collapses every non-`value` key into a single `label` UNLESS one is
        // already present - explicitly setting `label` here is what lets method/path/summary
        // survive as separate fields for renderOperationOption below, instead of being
        // silently discarded. `label` itself doubles as the default search text (method + path
        // + human-readable summary), so typing either the path or the summary words filters it.
        label: `${operation.method.toUpperCase()} ${operation.path} ${operation.name || ''}`.trim(),
        method: operation.method,
        path: operation.path,
        summary: operation.name,
      })),
    [operations]
  );

  const renderOperationOption = (props) => {
    const method = props.method;
    return (
      <div className="row align-items-center">
        <div className="col-auto" style={{ width: '60px' }}>
          <span className={`badge bg-${operationColorMapping[method] || 'azure'}`}>{method}</span>
        </div>
        <div className="col">
          <span>{props.path}</span>
          {props.summary && <span className="text-muted mx-1">- {props.summary}</span>}
        </div>
      </div>
    );
  };

  const changeHost = (host) => {
    optionsChanged({ ...localOptions, host });
  };

  const changeOperation = (operationRecordId) => {
    const operation = operations.find((op) => op.id === operationRecordId);
    optionsChanged({
      ...localOptions,
      operationRecordId,
      path: operation?.path,
      operation: operation?.method,
      params: { path: {}, query: {}, header: {}, request: {} },
    });
  };

  const changeParam = (paramType, paramName, value) => {
    const newOptions = {
      ...localOptions,
      params: {
        ...localOptions.params,
        [paramType]: { ...localOptions.params[paramType], [paramName]: value },
      },
    };
    optionsChanged(newOptions);
  };

  const removeParam = (paramType, paramName) => {
    const newParamType = { ...localOptions.params[paramType] };
    delete newParamType[paramName];
    optionsChanged({
      ...localOptions,
      params: { ...localOptions.params, [paramType]: newParamType },
    });
  };

  if (isFailed) {
    return (
      <div className="p-3" style={{ color: 'red' }}>
        {t('openApiV2.processingFailed', 'OpenAPI spec processing failed')}
        {specError ? `: ${specError}` : ''}
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="p-3">
        <div className="spinner-border spinner-border-sm text-azure mx-2" role="status"></div>
        {t('openApiV2.processing', 'The OpenAPI spec for this datasource is still being processed. Please wait.')}
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="p-3">
        {t('openApiV2.noSpec', 'Upload an OpenAPI spec on the datasource to start building queries.')}
      </div>
    );
  }

  const pathParamNames = (operationDetail?.parameters || []).filter((p) => p.in === 'path').map((p) => p.name);
  const queryParamNames = (operationDetail?.parameters || []).filter((p) => p.in === 'query').map((p) => p.name);
  const headerParamNames = (operationDetail?.parameters || []).filter((p) => p.in === 'header').map((p) => p.name);
  const requestBodyParamNames = Object.keys(operationDetail?.requestBodySchema?.properties || {});

  return (
    <div>
      {hostOptions.length > 0 && (
        <div className="row">
          <div className="col-12">
            <label className="form-label">{t('globals.host', 'Host')}</label>
          </div>
          <div className="col openapi-operation-options">
            <Select
              options={hostOptions.map((url) => ({ name: url, value: url }))}
              value={selectedDataSource?.options?.host?.value || localOptions.host}
              onChange={changeHost}
              width="100%"
              placeholder={t('openApi.selectHost', 'Select a host')}
              styles={queryManagerSelectComponentStyle(darkMode, '100%')}
              useCustomStyles={true}
              isDisabled={!!selectedDataSource?.options?.host?.value}
            />
          </div>
        </div>
      )}

      {serviceOptions.length > 0 && (
        <div className="row" style={{ marginTop: '20px' }}>
          <div className="col-12">
            <label className="form-label">{t('openApiV2.service', 'Service')}</label>
          </div>
          <div className="col openapi-operation-options">
            <Select
              options={serviceOptions}
              value={selectedService}
              onChange={setSelectedService}
              width="100%"
              placeholder={t('openApiV2.selectService', 'Select a service')}
              styles={queryManagerSelectComponentStyle(darkMode, '100%')}
              useCustomStyles={true}
            />
          </div>
        </div>
      )}

      <div className="row" style={{ marginTop: '20px' }}>
        <div className="col-12">
          <label className="form-label">{t('globals.operation', 'Operation')}</label>
        </div>
        <div className="col openapi-operation-options">
          <Select
            options={operationOptions}
            value={localOptions.operationRecordId}
            onChange={changeOperation}
            width="100%"
            customOption={renderOperationOption}
            placeholder={
              loadingOperations
                ? t('openApiV2.loadingOperations', 'Loading operations...')
                : t('openApi.selectOperation', 'Select an operation')
            }
            styles={queryManagerSelectComponentStyle(darkMode, '100%')}
            useCustomStyles={true}
            isDisabled={loadingOperations}
            // Search is server-side (path/name/tag - see the Tier 2 effect above) - the options
            // list is already filtered by the time it gets here, so react-select's own default
            // client-side filterOption is disabled to avoid re-filtering an already-filtered,
            // server-matched list against just the label text.
            onInputChange={(inputValue, meta) => {
              if (meta.action === 'input-change') setOperationSearchInput(inputValue);
            }}
            filterOption={() => true}
          />
          {operationDetail?.name && (
            <small
              className="openapi-operations-desc"
              style={{ marginTop: '12px' }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(operationDetail.name) }}
            />
          )}
        </div>
      </div>

      {operationDetail && (
        <div className={`row openApi-fields-row ${darkMode && 'theme-dark'}`}>
          <ParamFieldGroup
            title={t('globals.header', 'HEADER')}
            paramNames={headerParamNames}
            values={localOptions.params.header}
            onChange={(name, value) => changeParam('header', name, value)}
            onRemove={(name) => removeParam('header', name)}
          />
          <ParamFieldGroup
            title={t('globals.path', 'PATH')}
            paramNames={pathParamNames}
            values={localOptions.params.path}
            onChange={(name, value) => changeParam('path', name, value)}
            onRemove={(name) => removeParam('path', name)}
          />
          <ParamFieldGroup
            title={t('globals.query', 'QUERY')}
            paramNames={queryParamNames}
            values={localOptions.params.query}
            onChange={(name, value) => changeParam('query', name, value)}
            onRemove={(name) => removeParam('query', name)}
          />
          <ParamFieldGroup
            title={t('globals.requestBody', 'REQUEST BODY')}
            paramNames={requestBodyParamNames}
            values={localOptions.params.request}
            onChange={(name, value) => changeParam('request', name, value)}
            onRemove={(name) => removeParam('request', name)}
          />
        </div>
      )}
    </div>
  );
};

export default OpenApiV2;
