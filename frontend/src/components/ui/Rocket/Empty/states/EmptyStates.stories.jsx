import React from 'react';
import AppsEmptyState from './AppsEmptyState';
import DataSourcesEmptyState from './DataSourcesEmptyState';
import WorkflowsEmptyState from './WorkflowsEmptyState';

export default {
  title: 'Rocket/Empty/States',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export const Apps = {
  render: () => (
    <div className="tw-w-[600px]">
      <AppsEmptyState onCreateApp={() => alert('Create app clicked')} />
    </div>
  ),
};

export const DataSources = {
  render: () => (
    <div className="tw-w-[600px]">
      <DataSourcesEmptyState onAddDatasource={() => alert('Add datasource clicked')} />
    </div>
  ),
};

export const Workflows = {
  render: () => (
    <div className="tw-w-[600px]">
      <WorkflowsEmptyState onCreateWorkflow={() => alert('Create workflow clicked')} />
    </div>
  ),
};

export const AllStates = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-8 tw-w-[600px]">
      <div>
        <span className="tw-text-xs tw-text-text-placeholder tw-mb-2 tw-block">Apps</span>
        <AppsEmptyState onCreateApp={() => alert('Create app clicked')} />
      </div>
      <div>
        <span className="tw-text-xs tw-text-text-placeholder tw-mb-2 tw-block">Data Sources</span>
        <DataSourcesEmptyState onAddDatasource={() => {}} />
      </div>
      <div>
        <span className="tw-text-xs tw-text-text-placeholder tw-mb-2 tw-block">Workflows</span>
        <WorkflowsEmptyState onCreateWorkflow={() => {}} />
      </div>
    </div>
  ),
};
