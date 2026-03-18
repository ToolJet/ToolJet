import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { GalleryVerticalEnd, AudioWaveform, Command, Building2, Briefcase, Users } from 'lucide-react';

export default {
  title: 'UI/Blocks/TopBar',
  component: TopBar,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    workspaceName: {
      control: 'text',
      description: 'Current workspace name',
    },
    searchPlaceholder: {
      control: 'text',
      description: 'Search input placeholder text',
    },
    workspaces: {
      control: 'object',
      description: 'Array of available workspaces',
    },
  },
};

const Template = (args) => {
  const [searchValue, setSearchValue] = useState('');
  const [currentWorkspace, setCurrentWorkspace] = useState(args.workspaceName);

  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace.name);
    console.log('Workspace changed to:', workspace);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    console.log('Search:', value);
  };

  return (
    <div className="tw-w-full tw-h-screen tw-bg-background-surface-layer-01">
      <TopBar
        {...args}
        workspaceName={currentWorkspace}
        searchValue={searchValue}
        onWorkspaceChange={handleWorkspaceChange}
        onSearch={handleSearch}
      />
      <div className="tw-p-8 tw-bg-slate-200 tw-h-full tw-w-full">
      </div>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  workspaceName: 'ABC cargo main team',
  searchPlaceholder: 'Search',
  workspaces: [
    { name: 'ABC cargo main team', logo: GalleryVerticalEnd, plan: 'Enterprise' },
    { name: 'XYZ Logistics', logo: AudioWaveform, plan: 'Startup' },
    { name: 'Global Shipping Co.', logo: Command, plan: 'Pro' },
    { name: 'Fast Delivery Inc.', logo: Building2, plan: 'Free' },
  ],
};

export const SingleWorkspace = Template.bind({});
SingleWorkspace.args = {
  workspaceName: 'My Workspace',
  searchPlaceholder: 'Search applications...',
  workspaces: [{ name: 'My Workspace', logo: GalleryVerticalEnd, plan: 'Pro' }],
};

export const ManyWorkspaces = Template.bind({});
ManyWorkspaces.args = {
  workspaceName: 'Enterprise Team Alpha',
  searchPlaceholder: 'Search across all workspaces',
  workspaces: [
    { name: 'Enterprise Team Alpha', logo: GalleryVerticalEnd, plan: 'Enterprise' },
    { name: 'Development Team Beta', logo: AudioWaveform, plan: 'Startup' },
    { name: 'Marketing Team Gamma', logo: Command, plan: 'Pro' },
    { name: 'Sales Team Delta', logo: Building2, plan: 'Enterprise' },
    { name: 'Support Team Epsilon', logo: Briefcase, plan: 'Startup' },
    { name: 'Operations Team Zeta', logo: Users, plan: 'Pro' },
    { name: 'Research Team Eta', logo: GalleryVerticalEnd, plan: 'Free' },
    { name: 'Finance Team Theta', logo: AudioWaveform, plan: 'Enterprise' },
  ],
};

export const LongWorkspaceName = Template.bind({});
LongWorkspaceName.args = {
  workspaceName: 'Very Long Workspace Name That Should Be Truncated',
  searchPlaceholder: 'Search',
  workspaces: [
    { name: 'Very Long Workspace Name That Should Be Truncated', logo: GalleryVerticalEnd, plan: 'Enterprise' },
    { name: 'Another Very Long Workspace Name For Testing', logo: AudioWaveform, plan: 'Startup' },
    { name: 'Short Name', logo: Command, plan: 'Pro' },
  ],
};

export const WithoutSearch = Template.bind({});
WithoutSearch.args = {
  workspaceName: 'ABC cargo main team',
  workspaces: [
    { name: 'ABC cargo main team', logo: GalleryVerticalEnd, plan: 'Enterprise' },
    { name: 'XYZ Logistics', logo: AudioWaveform, plan: 'Startup' },
  ],
};

// Interactive example showing all features
export const Interactive = () => {
  const [searchValue, setSearchValue] = useState('');
  const [currentWorkspace, setCurrentWorkspace] = useState('ABC cargo main team');
  const [workspaces] = useState([
    { name: 'ABC cargo main team', logo: GalleryVerticalEnd, plan: 'Enterprise' },
    { name: 'XYZ Logistics', logo: AudioWaveform, plan: 'Startup' },
    { name: 'Global Shipping Co.', logo: Command, plan: 'Pro' },
    { name: 'Fast Delivery Inc.', logo: Building2, plan: 'Free' },
  ]);

  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace.name);
    console.log('Workspace changed to:', workspace);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    console.log('Search:', value);
  };

  return (
    <div className="tw-w-full tw-h-screen tw-bg-background-surface-layer-01">
      <TopBar
        workspaceName={currentWorkspace}
        workspaces={workspaces}
        searchValue={searchValue}
        onWorkspaceChange={handleWorkspaceChange}
        onSearch={handleSearch}
        searchPlaceholder="Search applications, pages, or data sources..."
      />
      <div className="tw-p-8">
        <h1 className="tw-text-2xl tw-font-bold tw-text-text-default tw-mb-4">Interactive TopBar Demo</h1>
        <p className="tw-text-text-medium tw-mb-6">
          Try interacting with the workspace switcher and search input above. Check the console for event logs.
        </p>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
          <div className="tw-p-4 tw-bg-background-surface-layer-02 tw-rounded-lg">
            <h3 className="tw-font-medium tw-text-text-default tw-mb-2">Current State</h3>
            <div className="tw-space-y-2">
              <p className="tw-text-sm tw-text-text-medium">
                <span className="tw-font-medium">Workspace:</span> {currentWorkspace}
              </p>
              <p className="tw-text-sm tw-text-text-medium">
                <span className="tw-font-medium">Search:</span> "{searchValue || 'No search term'}"
              </p>
            </div>
          </div>

          <div className="tw-p-4 tw-bg-background-surface-layer-02 tw-rounded-lg">
            <h3 className="tw-font-medium tw-text-text-default tw-mb-2">Available Workspaces</h3>
            <div className="tw-space-y-1">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.name}
                  className={`tw-text-sm tw-p-2 tw-rounded ${
                    workspace.name === currentWorkspace
                      ? 'tw-bg-background-accent-strong tw-text-text-on-solid'
                      : 'tw-bg-background-surface-layer-03 tw-text-text-medium'
                  }`}
                >
                  {workspace.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




