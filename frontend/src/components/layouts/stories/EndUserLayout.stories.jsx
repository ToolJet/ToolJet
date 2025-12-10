import React from 'react';
import { EndUserLayout } from '../EndUserLayout';
import { TopBarSearch } from '@/components/ui/blocks/TopBarSearch';
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react';

const DUMMY_WORKSPACES = [
  { name: 'Acme Inc', logo: GalleryVerticalEnd, plan: 'Enterprise' },
  { name: 'Acme Corp.', logo: AudioWaveform, plan: 'Startup' },
  { name: 'Evil Corp.', logo: Command, plan: 'Free' },
];

export default {
  title: 'Layouts/EndUserLayout',
  component: EndUserLayout,
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => {
  const [searchValue, setSearchValue] = React.useState('');

  return (
    <EndUserLayout
      workspaceName={DUMMY_WORKSPACES[0].name}
      workspaces={DUMMY_WORKSPACES}
      onWorkspaceChange={(ws) => console.log('Workspace changed:', ws)}
      topbarLeftSlot={<TopBarSearch placeholder="Search..." value={searchValue} onChange={setSearchValue} />}
    >
      <div className="tw-p-6">
        <h1 className="tw-text-2xl tw-font-bold tw-mb-4">End User Layout</h1>
        <p>This is the main content area for end users.</p>
      </div>
    </EndUserLayout>
  );
};

export const Minimal = () => {
  return (
    <EndUserLayout>
      <div className="tw-p-6">
        <h1 className="tw-text-2xl tw-font-bold tw-mb-4">Minimal Layout</h1>
        <p>Layout without workspace switcher or search.</p>
      </div>
    </EndUserLayout>
  );
};

