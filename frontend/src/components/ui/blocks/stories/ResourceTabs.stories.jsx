import React, { useState } from 'react';
import { ResourceTabs } from '../ResourceTabs';
import { EmptyNoApps } from '@/features/apps/components/EmptyNoApps';

export default {
  title: 'UI/Blocks/ResourceTabs',
  component: ResourceTabs,
  parameters: {
    layout: 'padded',
  },
};

export const Default = () => {
  const [activeTab, setActiveTab] = useState('apps');

  const tabs = [
    {
      id: 'apps',
      label: 'Apps',
      content: <div className="tw-p-6">Apps content goes here</div>,
    },
    {
      id: 'modules',
      label: 'Modules',
      content: <div className="tw-p-6">Modules content goes here</div>,
    },
  ];

  return <ResourceTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />;
};

export const SingleTab = () => {
  const [activeTab, setActiveTab] = useState('apps');

  const tabs = [
    {
      id: 'apps',
      label: 'Apps',
      content: <div className="tw-p-6">Single tab content</div>,
    },
  ];

  return <ResourceTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />;
};

export const WithError = () => {
  const [activeTab, setActiveTab] = useState('apps');

  const tabs = [
    {
      id: 'apps',
      label: 'Apps',
      content: <div className="tw-p-6">Apps content</div>,
    },
    {
      id: 'modules',
      label: 'Modules',
      error: new Error('Failed to load modules'),
    },
  ];

  return <ResourceTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />;
};

export const WithEmpty = () => {
  const [activeTab, setActiveTab] = useState('apps');

  const tabs = [
    {
      id: 'apps',
      label: 'Apps',
      empty: true,
      emptyState: <EmptyNoApps />,
    },
    {
      id: 'modules',
      label: 'Modules',
      content: <div className="tw-p-6">Modules content</div>,
    },
  ];

  return <ResourceTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />;
};

