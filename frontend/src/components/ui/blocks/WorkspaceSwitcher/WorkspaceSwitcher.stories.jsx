import React, { useState } from 'react';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { GalleryVerticalEnd, AudioWaveform, Command } from 'lucide-react';

export default {
  title: 'UI/Blocks/WorkspaceSwitcher',
  component: WorkspaceSwitcher,
  parameters: {
    layout: 'centered',
  },
};

const workspaces = [
  {
    name: 'Acme Inc',
    logo: GalleryVerticalEnd,
    plan: 'Enterprise',
  },
  {
    name: 'Acme Corp.',
    logo: AudioWaveform,
    plan: 'Startup',
  },
  {
    name: 'Evil Corp.',
    logo: Command,
    plan: 'Free',
  },
];

export const Default = () => {
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);
  return (
    <WorkspaceSwitcher
      workspaces={workspaces}
      activeWorkspace={activeWorkspace}
      onWorkspaceChange={setActiveWorkspace}
    />
  );
};

export const SingleWorkspace = () => {
  const singleWorkspace = { name: 'My Workspace', logo: GalleryVerticalEnd, plan: 'Pro' };
  const [activeWorkspace, setActiveWorkspace] = useState(singleWorkspace);
  return (
    <WorkspaceSwitcher
      workspaces={[singleWorkspace]}
      activeWorkspace={activeWorkspace}
      onWorkspaceChange={setActiveWorkspace}
    />
  );
};

export const ManyWorkspaces = () => {
  const manyWorkspaces = [
    { name: 'Workspace Alpha', logo: GalleryVerticalEnd, plan: 'Enterprise' },
    { name: 'Workspace Beta', logo: AudioWaveform, plan: 'Startup' },
    { name: 'Workspace Gamma', logo: Command, plan: 'Free' },
    { name: 'Workspace Delta', logo: GalleryVerticalEnd, plan: 'Pro' },
    { name: 'Workspace Epsilon', logo: AudioWaveform, plan: 'Enterprise' },
  ];
  const [activeWorkspace, setActiveWorkspace] = useState(manyWorkspaces[0]);
  return (
    <WorkspaceSwitcher
      workspaces={manyWorkspaces}
      activeWorkspace={activeWorkspace}
      onWorkspaceChange={setActiveWorkspace}
    />
  );
};


