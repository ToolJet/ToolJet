import * as React from 'react';

export function ConfigureDatasourceContent({ datasource }) {
  if (!datasource) return null;

  return (
    <div className="tw-space-y-4">
      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">Connection Name</label>
        <input
          type="text"
          placeholder="Enter connection name"
          className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
        />
      </div>

      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">Host</label>
        <input
          type="text"
          placeholder="Enter host address"
          className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
        />
      </div>

      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">Port</label>
        <input
          type="text"
          placeholder="Enter port"
          className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
        />
      </div>

      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">Database Name</label>
        <input
          type="text"
          placeholder="Enter database name"
          className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
        />
      </div>

      <div className="tw-pt-4 tw-border-t">
        <p className="tw-text-sm tw-text-gray-600">
          Additional configuration options for {datasource.name} will appear here.
        </p>
      </div>
    </div>
  );
}
