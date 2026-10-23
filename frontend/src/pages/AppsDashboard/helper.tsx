import React from 'react';
import { LayoutTemplate, Workflow, ToyBrick } from 'lucide-react';

export const appTypeToDisplayNameMapping = {
  'front-end': 'app',
  module: 'module',
  workflow: 'workflow',
} as const;

export type TAppType = keyof typeof appTypeToDisplayNameMapping;

type TStaticContentMappingByAppType = {
  [key in TAppType]: {
    title: string;
    description: string;
    emptyState: {
      icon: React.ReactNode;
      title: string;
      description: string;
    };
  };
};

export const staticContentMappingByAppType: TStaticContentMappingByAppType = {
  'front-end': {
    title: 'Applications',
    description: 'Build, organize, and manage the applications in your workspace.',
    emptyState: {
      icon: <LayoutTemplate size={20} />,
      title: 'Build your first app',
      description: 'Start from a blank canvas or describe what you\nneed, and let ToolJet build it for you.',
    },
  },
  module: {
    title: 'Modules',
    description: 'Create, reuse, and manage modules across the applications in your workspace.',
    emptyState: {
      icon: <ToyBrick size={20} />,
      title: 'Create your first module',
      description: 'Reuse UI and logic across your apps.\nCreate a module from scratch or with AI.',
    },
  },
  workflow: {
    title: 'Workflows',
    description: 'Build, automate, and manage the workflows in your workspace.',
    emptyState: {
      icon: <Workflow size={20} />,
      title: 'Create your first workflow',
      description: 'Automate tasks and connect your tools.\nStart from scratch or build with AI.',
    },
  },
} as const;
