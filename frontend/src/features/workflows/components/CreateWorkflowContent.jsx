import * as React from 'react';
import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Rocket/tabs';
import { FileText, RefreshCw, Globe, Clock, Zap } from 'lucide-react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { workflowTemplates } from '../adapters/workflowData';

const getTemplateIcon = (iconName) => {
  const iconMap = {
    FileText: FileText,
    RefreshCw: RefreshCw,
    Globe: Globe,
    Clock: Clock,
    Zap: Zap,
  };
  
  const IconComponent = iconMap[iconName] || FileText;
  return <IconComponent className="tw-w-6 tw-h-6 tw-text-icon-accent" />;
};

export function CreateWorkflowContent({ onSelectTemplate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const categories = useMemo(
    () => [
      { id: 'all', name: 'All' },
      { id: 'basic', name: 'Basic' },
      { id: 'integration', name: 'Integration' },
      { id: 'automation', name: 'Automation' },
    ],
    []
  );

  const filteredByQuery = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return workflowTemplates;

    return workflowTemplates.filter((template) => {
      const name = template.name?.toLowerCase() || '';
      const description = template.description?.toLowerCase() || '';
      return name.includes(query) || description.includes(query);
    });
  }, [searchQuery]);

  const groupedTemplates = useMemo(() => {
    const base = categories.filter((cat) => cat.id !== 'all');
    return base.map((cat) => ({
      ...cat,
      items: filteredByQuery.filter((template) => template.category === cat.id),
    }));
  }, [categories, filteredByQuery]);

  const renderTemplateCard = (template) => (
    <button
      type="button"
      key={template.id}
      onClick={() => onSelectTemplate?.(template)}
      className="tw-flex tw-gap-3 tw-items-start tw-px-[14px] tw-py-3 tw-bg-white tw-border tw-border-[#e4e7eb] tw-rounded-[6px] tw-w-[240px] tw-h-full hover:tw-bg-gray-50 hover:tw-border-border-accent-strong tw-transition-colors"
    >
      <div className="tw-shrink-0 tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center tw-bg-background-accent-subtle tw-rounded-md">
        {getTemplateIcon(template.icon)}
      </div>
      <div className="tw-flex-1 tw-min-w-0 tw-flex tw-flex-col tw-gap-1 tw-text-left">
        <span className="tw-text-sm tw-font-medium tw-text-text-default tw-truncate">{template.name}</span>
        <span className="tw-text-xs tw-text-text-subtle tw-line-clamp-2">{template.description}</span>
      </div>
    </button>
  );

  const renderSection = (title, items) => {
    if (!items.length) return null;

    return (
      <div className="tw-flex tw-flex-col tw-gap-3">
        <div className="tw-flex tw-items-center tw-justify-between">
          <h3 className="tw-font-title-large tw-text-text-default">{title}</h3>
          <span className="tw-font-body-small tw-text-text-placeholder">{items.length} templates</span>
        </div>
        <div className="tw-flex tw-flex-wrap tw-gap-3">{items.map((item) => renderTemplateCard(item))}</div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'all') {
      const sections = groupedTemplates.map((group) => renderSection(group.name, group.items)).filter(Boolean);
      return sections.length ? sections : null;
    }

    const activeGroup = groupedTemplates.find((group) => group.id === activeTab);
    return activeGroup ? renderSection(activeGroup.name, activeGroup.items) : null;
  };

  return (
    <div className="tw-space-y-4">
      {/* Search Input */}
      <div className="tw-relative">
        <div className="tw-absolute tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-pointer-events-none">
          <SolidIcon name="search" width="16" fill="#acb2b9" />
        </div>
        <input
          type="text"
          placeholder="Search templates"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-py-1.5 tw-text-xs tw-font-normal tw-text-text-placeholder tw-bg-background-surface-layer-01 tw-border tw-border-border-default tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-accent focus:tw-border-accent"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="tw-w-full">
        <TabsList variant="secondary" className="tw-border-b tw-border-[#e4e7eb] tw-gap-1 tw-p-0 tw-h-auto">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              variant="secondary"
              className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-h-auto tw-border-b-2 tw-border-transparent data-[state=active]:tw-border-border-accent-strong data-[state=active]:tw-text-text-default tw-text-text-default"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="tw-flex-1 tw-overflow-y-auto">
        <div className="tw-flex tw-flex-col tw-gap-6">
          {renderContent() || (
            <div className="tw-py-8 tw-text-center">
              <p className="tw-text-sm tw-text-text-subtle">No templates found matching your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
