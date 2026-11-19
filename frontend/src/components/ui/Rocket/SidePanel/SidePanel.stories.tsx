import React from 'react';
import { Plus, PanelLeftClose, Table2 } from 'lucide-react';
import { Button } from '../Button/Button';
import { SearchInput } from '../SearchInput/SearchInput';
import { SidePanel, SidePanelHeader, SidePanelSection, SidePanelBody } from './SidePanel';

export default {
  title: 'Rocket/SidePanel',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  component: SidePanel,
};

const TABLES = ['bugs_lr5l2efe', 'contracts_aoxskyxu', 'feature_list', 'releasenotes', 'support_desk_ticket'];

export const Default = {
  render: () => (
    <div style={{ height: 420 }}>
      <SidePanel aria-label="Tables">
        <SidePanelHeader
          title="Database"
          actions={
            <>
              <Button variant="ghost" size="medium" iconOnly aria-label="Create table">
                <Plus />
              </Button>
              <Button variant="ghost" size="medium" iconOnly aria-label="Collapse panel">
                <PanelLeftClose />
              </Button>
            </>
          }
        />
        <SidePanelSection label="All tables" count={TABLES.length} />
        <div className="tw-px-3">
          <SearchInput aria-label="Search tables" placeholder="Search tables" value="" onValueChange={() => {}} />
        </div>
        <SidePanelBody>
          {TABLES.map((name) => (
            <div key={name} className="tw-flex tw-h-8 tw-items-center tw-gap-1.5 tw-px-2 tw-font-body-default">
              <Table2 className="tw-size-4" />
              {name}
            </div>
          ))}
        </SidePanelBody>
      </SidePanel>
    </div>
  ),
};

export const HeaderOnly = {
  render: () => (
    <div style={{ height: 120 }}>
      <SidePanel aria-label="Tables">
        <SidePanelHeader title="Database" />
      </SidePanel>
    </div>
  ),
};
