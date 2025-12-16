import * as React from 'react';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Rocket/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Rocket/tabs';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { X } from 'lucide-react';
import {
  CommonlyUsedDataSources,
  DataBaseSources,
  ApiSources,
  CloudStorageSources,
  DUMMY_PLUGINS,
} from '../adapters/datasourceData';

// Placeholder icon function
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

export function CreateNewDatasourceSheet({ open, onOpenChange, onSelectDatasource }) {
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
        <h3 className="tw-text-base tw-font-medium tw-text-[#11181c] tw-leading-6">
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="tw-w-full sm:tw-max-w-2xl tw-overflow-hidden tw-flex tw-flex-col tw-p-0">
        {/* Header */}
        <div className="tw-border-b tw-border-[#e4e7eb] tw-px-6 tw-pt-6 tw-pb-0 tw-flex-shrink-0">
          <SheetHeader className="tw-mb-3.5">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
              <SheetTitle className="tw-text-base tw-font-medium tw-text-[#11181c] tw-leading-6 tw-m-0">
                Select datasource
              </SheetTitle>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="tw-p-2 tw-rounded-lg hover:tw-bg-gray-100 tw-transition-colors"
              >
                <X className="tw-w-4 tw-h-4 tw-text-[#6a727c]" />
              </button>
            </div>
          </SheetHeader>

          {/* Search */}
          <div className="tw-mb-3.5">
            <div className="tw-relative">
              <div className="tw-absolute tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-pointer-events-none">
                <SolidIcon name="search" width="16" fill="#acb2b9" />
              </div>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-py-1.5 tw-text-xs tw-font-normal tw-text-[#6a727c] tw-bg-white tw-border tw-border-[#ccd1d5] tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="tw-w-full">
            <TabsList variant="secondary" className="tw-border-b tw-border-[#e4e7eb] tw-gap-1 tw-p-0 tw-h-auto">
              <TabsTrigger
                value="all"
                variant="secondary"
                className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-[#4368e3] data-[state=active]:tw-text-[#1b1f24] tw-text-[#6a727c]"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="commonly-used"
                variant="secondary"
                className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-[#4368e3] data-[state=active]:tw-text-[#1b1f24] tw-text-[#6a727c]"
              >
                Commonly used
              </TabsTrigger>
              <TabsTrigger
                value="databases"
                variant="secondary"
                className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-[#4368e3] data-[state=active]:tw-text-[#1b1f24] tw-text-[#6a727c]"
              >
                Databases
              </TabsTrigger>
              <TabsTrigger
                value="apis"
                variant="secondary"
                className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-[#4368e3] data-[state=active]:tw-text-[#1b1f24] tw-text-[#6a727c]"
              >
                APIs
              </TabsTrigger>
              <TabsTrigger
                value="cloud-storages"
                variant="secondary"
                className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-[#4368e3] data-[state=active]:tw-text-[#1b1f24] tw-text-[#6a727c]"
              >
                Cloud Storages
              </TabsTrigger>
              <TabsTrigger
                value="plugins"
                variant="secondary"
                className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-[#4368e3] data-[state=active]:tw-text-[#1b1f24] tw-text-[#6a727c]"
              >
                Plugins
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-p-6">
          <div className="tw-flex tw-flex-col tw-gap-9">{renderContent()}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
