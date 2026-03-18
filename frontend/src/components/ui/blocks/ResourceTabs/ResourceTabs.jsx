import * as React from 'react';
import PropTypes from 'prop-types';
import { Tabs, TabsContent } from '@/components/ui/Rocket/tabs';

export function ResourceTabs({ activeTab, onTabChange, tabs = [] }) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="tw-w-full tw-flex-col tw-justify-start tw-gap-6">
      {tabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className="tw-relative tw-flex tw-flex-col tw-gap-4 tw-overflow-auto tw-mt-0"
        >
          {tab.error ? tab.errorState : tab.empty ? tab.emptyState : tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

ResourceTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      content: PropTypes.node,
      error: PropTypes.object,
      errorState: PropTypes.node,
      empty: PropTypes.bool,
      emptyState: PropTypes.node,
    })
  ).isRequired,
};
