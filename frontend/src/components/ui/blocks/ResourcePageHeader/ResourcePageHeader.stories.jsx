import React from 'react';
import { ResourcePageHeader } from './ResourcePageHeader';
import { Button } from '@/components/ui/Button/Button';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default {
  title: 'UI/Blocks/ResourcePageHeader',
  component: ResourcePageHeader,
  parameters: {
    layout: 'padded',
  },
};

// Simple test story
export const Simple = () => {
  return (
    <ResourcePageHeader
      title="Applications"
      rightSlot={
        <>
          <Button variant="primary" onClick={() => console.log('Create blank app')}>
            Create blank app
          </Button>
          <Button variant="secondary" onClick={() => console.log('Build with AI')}>
            Build with AI
          </Button>
        </>
      }
      contextMenuItems={[]}
    />
  );
};

// Story with menu items
export const WithMenu = () => {
  const menuItems = [
    {
      label: 'Import template',
      onClick: () => console.log('Import template'),
      icon: 'Download',
    },
  ];

  return (
    <ResourcePageHeader
      title="Applications"
      rightSlot={
        <>
          <Button variant="primary" onClick={() => console.log('Create blank app')}>
            Create blank app
          </Button>
          <Button variant="secondary" onClick={() => console.log('Build with AI')}>
            Build with AI
          </Button>
        </>
      }
      contextMenuItems={menuItems}
    />
  );
};

// Story with single action button
export const SingleAction = () => {
  return (
    <ResourcePageHeader
      title="Applications"
      rightSlot={
        <Button variant="primary" onClick={() => console.log('Create app')}>
          Create app
        </Button>
      }
    />
  );
};

// Story with upgrade banner
export const WithUpgradeBanner = () => {
  return (
    <ResourcePageHeader
      title="Applications"
      rightSlot={
        <div
          className={cn('tw-flex tw-items-center tw-gap-3 tw-pl-3 tw-pr-3 tw-py-3 tw-rounded-xl')}
          style={{
            background:
              'linear-gradient(98deg, rgba(255, 255, 255, 0.04) 1.67%, rgba(142, 78, 198, 0.04) 39.08%, rgba(252, 95, 112, 0.04) 73.14%, rgba(252, 162, 63, 0.04) 100%)',
          }}
        >
          <span className="tw-font-title-default tw-text-text-default">2 apps built! Upgrade for more apps.</span>
          <Button variant="outline" size="default" isLucid={true} onClick={() => console.log('Upgrade')}>
            <Crown width={14} height={14} className="tw-text-background-premium" />
            Upgrade
          </Button>
        </div>
      }
    />
  );
};
