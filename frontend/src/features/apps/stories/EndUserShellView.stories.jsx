import React, { useState } from 'react';
import { EndUserShellView } from '../components/EndUserShellView';
import { EndUserHeader } from '@/components/ui/blocks/ResourcePageHeader/EndUserHeader';
import { PaginationFooter } from '@/components/ui/blocks/PaginationFooter';
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react';

const DUMMY_WORKSPACES = [
  { name: 'Acme Inc', logo: GalleryVerticalEnd, plan: 'Enterprise' },
  { name: 'Acme Corp.', logo: AudioWaveform, plan: 'Startup' },
  { name: 'Evil Corp.', logo: Command, plan: 'Free' },
];

export default {
  title: 'Features/Apps/Components/EndUserShellView',
  component: EndUserShellView,
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => {
  const [searchValue, setSearchValue] = useState('');
  const [currentWorkspace, setCurrentWorkspace] = useState(DUMMY_WORKSPACES[0].name);

  return (
    <EndUserShellView
      searchValue={searchValue}
      onSearch={setSearchValue}
      workspaceName={currentWorkspace}
      workspaces={DUMMY_WORKSPACES}
      onWorkspaceChange={(ws) => {
        setCurrentWorkspace(ws.name);
        console.log('Workspace changed:', ws);
      }}
      header={
        <EndUserHeader
          title="Applications"
          breadcrumbItems={[{ label: 'Home' }, { label: 'Applications' }]}
          viewAs="list"
          onViewChange={() => {}}
        />
      }
      footer={<PaginationFooter recordCount={50} currentPage={1} totalPages={5} />}
    >
      <div className="tw-p-6">Content goes here</div>
    </EndUserShellView>
  );
};

export const Minimal = () => {
  return (
    <EndUserShellView searchValue="" onSearch={() => {}}>
      <div className="tw-p-6">Minimal shell view</div>
    </EndUserShellView>
  );
};
