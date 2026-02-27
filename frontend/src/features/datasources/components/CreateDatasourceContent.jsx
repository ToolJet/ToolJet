import * as React from 'react';
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Rocket/tabs';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import {
  CommonlyUsedDataSources,
  DataBaseSources,
  ApiSources,
  CloudStorageSources,
  DUMMY_PLUGINS,
} from '../adapters/datasourceData';

const getSvgIcon = (kind, width, height, iconFile) => {
  if (iconFile) {
    return <img src={`data:image/svg+xml;base64,${iconFile}`} style={{ height: width, width: height }} alt="" />;
  }
  const initials = (kind || '?').substring(0, 2).toUpperCase();
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#e0e7ff',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: '600',
        color: '#4f46e5',
      }}
    >
      {initials}
    </div>
  );
};

export function CreateDatasourceContent({ onSelectDatasource }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filteredCommon, setFilteredCommon] = useState(CommonlyUsedDataSources);
  const [filteredDatabases, setFilteredDatabases] = useState(DataBaseSources);
  const [filteredApis, setFilteredApis] = useState(ApiSources);
  const [filteredCloudStorages, setFilteredCloudStorages] = useState(CloudStorageSources);
  const [filteredPlugins, setFilteredPlugins] = useState(DUMMY_PLUGINS);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    setFilteredCommon(CommonlyUsedDataSources.filter((ds) => ds.name.toLowerCase().includes(query)));
    setFilteredDatabases(DataBaseSources.filter((ds) => ds.name.toLowerCase().includes(query)));
    setFilteredApis(ApiSources.filter((ds) => ds.name.toLowerCase().includes(query)));
    setFilteredCloudStorages(CloudStorageSources.filter((ds) => ds.name.toLowerCase().includes(query)));
    setFilteredPlugins(
      DUMMY_PLUGINS.filter((ds) => ds.name?.toLowerCase().includes(query) || ds.kind?.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const renderDatasourceCard = (item) => {
    const iconFile = item?.iconFile?.data;
    const kind = item?.kind?.toLowerCase() || item?.name?.toLowerCase();

    return (
      <button
        type="button"
        key={item.key || item.id || item.name}
        onClick={() => onSelectDatasource?.(item)}
        className="tw-flex tw-gap-2 tw-items-center tw-px-[14px] tw-py-3 tw-bg-white tw-border tw-border-[#e4e7eb] tw-rounded-[6px] tw-w-[173.333px] hover:tw-bg-gray-50 tw-transition-colors"
      >
        <div className="tw-shrink-0 tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center">
          {getSvgIcon(kind, 24, 24, iconFile)}
        </div>
        <span className="tw-text-xs tw-font-normal tw-text-[#1b1f24] tw-whitespace-nowrap tw-overflow-hidden tw-text-ellipsis">
          {item.name}
        </span>
      </button>
    );
  };

  const renderSection = (title, count, items) => {
    if (items.length === 0) return null;

    return (
      <div className="tw-flex tw-flex-col tw-gap-4">
        <h3 className="tw-font-title-large tw-text-text-default">
          {title} ({count})
        </h3>
        <div className="tw-flex tw-flex-wrap tw-gap-4">{items.map((item) => renderDatasourceCard(item))}</div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'all':
        return (
          <div className="tw-flex tw-flex-col tw-gap-9">
            {renderSection('Commonly used', filteredCommon.length, filteredCommon)}
            {renderSection('Databases', filteredDatabases.length, filteredDatabases)}
            {renderSection('APIs', filteredApis.length, filteredApis)}
            {renderSection('Cloud Storages', filteredCloudStorages.length, filteredCloudStorages)}
            {renderSection('Plugins', filteredPlugins.length, filteredPlugins)}
          </div>
        );
      case 'commonly-used':
        return renderSection('Commonly used', filteredCommon.length, filteredCommon);
      case 'databases':
        return renderSection('Databases', filteredDatabases.length, filteredDatabases);
      case 'apis':
        return renderSection('APIs', filteredApis.length, filteredApis);
      case 'cloud-storages':
        return renderSection('Cloud Storages', filteredCloudStorages.length, filteredCloudStorages);
      case 'plugins':
        return renderSection('Plugins', filteredPlugins.length, filteredPlugins);
      default:
        return null;
    }
  };

  return (
    <div className="tw-space-y-4">
      <div className="tw-relative">
        <div className="tw-absolute tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-pointer-events-none">
          <SolidIcon name="search" width="16" fill="#acb2b9" />
        </div>
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-py-1.5 tw-text-xs tw-font-normal tw-text-text-placeholder tw-bg-background-surface-layer-01 tw-border tw-border-border-default tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-accent focus:tw-border-accent"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="tw-w-full">
        <TabsList variant="secondary" className="tw-border-b tw-border-[#e4e7eb] tw-gap-1 tw-p-0 tw-h-auto">
          <TabsTrigger
            value="all"
            variant="secondary"
            className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-border-accent-strong data-[state=active]:tw-text-text-default tw-text-text-default"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="commonly-used"
            variant="secondary"
            className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-border-accent-strong data-[state=active]:tw-text-text-default tw-text-text-default"
          >
            Commonly used
          </TabsTrigger>
          <TabsTrigger
            value="databases"
            variant="secondary"
            className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-border-accent-strong data-[state=active]:tw-text-text-default tw-text-text-default"
          >
            Databases
          </TabsTrigger>
          <TabsTrigger
            value="apis"
            variant="secondary"
            className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-border-accent-strong data-[state=active]:tw-text-text-default tw-text-text-default"
          >
            APIs
          </TabsTrigger>
          <TabsTrigger
            value="cloud-storages"
            variant="secondary"
            className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-border-accent-strong data-[state=active]:tw-text-text-default tw-text-text-default"
          >
            Cloud Storages
          </TabsTrigger>
          <TabsTrigger
            value="plugins"
            variant="secondary"
            className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-border-accent-strong data-[state=active]:tw-text-text-default tw-text-text-default"
          >
            Plugins
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="tw-flex-1 tw-overflow-y-auto">
        <div className="tw-flex tw-flex-col tw-gap-9">{renderContent()}</div>
      </div>
    </div>
  );
}
