import React from 'react';
import Select from '@/_ui/Select';
import Input from '@/_ui/Input';
import Textarea from '@/_ui/Textarea';
import OAuth from '@/_ui/OAuth';
import Headers from '@/_ui/HttpHeaders';
import { useOpenApiSpecStatus } from '@/_hooks/use-openapi-spec-status';

// Same shape/behaviour as REST API's own datasource-config Credentials fields (plain key-value,
// not query-editor mode) - see restapi/lib/manifest.json's credentialsInputs.
const CREDENTIALS_FIELDS = [
  { key: 'headers', label: 'Headers' },
  { key: 'url_parameters', label: 'URL parameters' },
  { key: 'body', label: 'Body' },
  { key: 'cookies', label: 'Cookies' },
];

const SOURCE_TYPES = [
  { name: 'URL', value: 'url' },
  { name: 'Definition', value: 'definition' },
];

const STATUS_BADGE_CONFIG = {
  ready: { label: 'Processed', className: 'bg-success' },
  pending: { label: 'Pending', className: 'bg-azure' },
  processing: { label: 'Processing', className: 'bg-azure' },
  failed: { label: 'Failed', className: 'bg-danger' },
  cancelled: { label: 'Cancelled', className: 'bg-secondary' },
};

// Purely informational status chip - saving the datasource is what starts the background job.
const StatusBadge = ({ status, isPending }) => {
  const config = STATUS_BADGE_CONFIG[status] || { label: 'Not processed', className: 'bg-secondary' };
  return (
    <span className={`badge ${config.className} d-inline-flex align-items-center`} data-cy="openapi-spec-status-badge">
      {isPending && (
        <span className="spinner-border spinner-border-sm me-1" style={{ width: '0.6rem', height: '0.6rem' }} />
      )}
      {config.label}
    </span>
  );
};

// Datasource-config UI for the OpenAPI 2.0 plugin. Saving posts the raw spec text/URL and starts
// background processing; this component only polls/reflects that job's status. Auth uses the
// same static auth_type selector as REST API (@/_ui/OAuth), not the spec's securitySchemes.
const OpenApiV2Config = ({
  optionchanged,
  auth_type,
  bearer_token,
  username,
  password,
  access_token_url,
  client_id,
  client_secret,
  client_auth,
  custom_auth_params,
  custom_query_params,
  add_token_to,
  header_prefix,
  grant_type,
  scopes,
  auth_url,
  access_token_custom_headers,
  workspaceConstants,
  isDisabled,
  multiple_auth_enabled,
  currentAppEnvironmentId,
  selectedDataSource,
  optionsChanged,
  audience,
  options,
  // Form-tracked (spec_source_type/spec_url/raw_spec) so they persist via the generic Save
  // button and validate like any other option, instead of living only in local component state.
  sourceType,
  url,
  definition,
}) => {
  const dataSourceId = selectedDataSource?.id;
  const { status, error: specError, isPending, isFailed } = useOpenApiSpecStatus(dataSourceId, currentAppEnvironmentId);

  return (
    <>
      <div className="col-md-12 mb-3">
        <label className="form-label text-muted mt-3">Source</label>
        <Select
          options={SOURCE_TYPES}
          value={sourceType}
          onChange={(value) => optionchanged('spec_source_type', value)}
          width={'100%'}
          useMenuPortal={false}
          isDisabled={isDisabled || isPending}
        />
      </div>

      {sourceType === 'url' ? (
        <div className="col-md-12 mb-3" data-cy="spec-url-section">
          <label className="form-label text-muted mt-3">Spec URL</label>
          <Input
            type="text"
            className="form-control"
            placeholder="Enter the OpenAPI spec URL"
            value={url}
            onChange={(e) => optionchanged('spec_url', e.target.value)}
            onBlur={() => {}}
            disabled={isDisabled || isPending}
            workspaceConstants={workspaceConstants}
          />
        </div>
      ) : (
        <div className="col-md-12 mb-3" data-cy="definition-section">
          <label className="form-label text-muted mt-3">Definition</label>
          <Textarea
            className="form-control"
            rows="14"
            value={definition}
            onChange={(e) => optionchanged('raw_spec', e.target.value)}
            workspaceConstants={workspaceConstants}
            disabled={isDisabled || isPending}
          />
        </div>
      )}

      <div className="col-md-12 mb-3">
        {CREDENTIALS_FIELDS.map(({ key, label }) => (
          <div className="mb-3" key={key}>
            <label className="form-label" data-cy={`label-${key}`}>
              {label}
            </label>
            <Headers
              getter={key}
              options={options?.[key]?.value || [['', '']]}
              optionchanged={optionchanged}
              isRenderedAsQueryEditor={false}
              workspaceConstants={workspaceConstants}
              isDisabled={isDisabled}
              width="316px"
              dataCy={key}
            />
          </div>
        ))}
      </div>

      <div className="col-md-12 mb-3">
        <OAuth
          isGrpc={false}
          isRestApi={false}
          auth_type={auth_type}
          grant_type={grant_type}
          add_token_to={add_token_to}
          header_prefix={header_prefix}
          access_token_url={access_token_url}
          access_token_custom_headers={access_token_custom_headers}
          client_id={client_id}
          client_secret={client_secret}
          client_auth={client_auth}
          scopes={scopes}
          audience={audience}
          username={username}
          password={password}
          bearer_token={bearer_token}
          auth_url={auth_url}
          custom_auth_params={custom_auth_params}
          custom_query_params={custom_query_params}
          multiple_auth_enabled={multiple_auth_enabled}
          optionchanged={optionchanged}
          workspaceConstants={workspaceConstants}
          isDisabled={isDisabled}
          options={options}
          optionsChanged={optionsChanged}
          selectedDataSource={selectedDataSource}
        />
      </div>
      {isFailed && (
        <div className="p-2" style={{ color: 'red' }}>
          Processing failed{specError ? `: ${specError}` : ''}
        </div>
      )}

      <div className="col-md-12 mb-3 d-flex justify-content-end">
        <StatusBadge status={status} isPending={isPending} />
      </div>
    </>
  );
};

export default OpenApiV2Config;
