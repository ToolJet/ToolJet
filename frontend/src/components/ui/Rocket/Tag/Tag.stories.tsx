import React from 'react';
import { ChevronDown, User } from 'lucide-react';

import { Tag, type TagVariant } from './Tag';

const VARIANTS: TagVariant[] = ['solid', 'background', 'outline', 'warning', 'neutral'];

export default {
  title: 'Rocket/Tag',
  component: Tag,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: { variant: { control: 'select', options: VARIANTS } },
};

export const Default = { args: { variant: 'outline', children: 'title contains "filters"', removable: true } };

export const AllVariants = {
  render: () => (
    <div className="tw-grid tw-grid-cols-[auto_repeat(4,auto)] tw-items-center tw-gap-3">
      {VARIANTS.map((variant) => (
        <React.Fragment key={variant}>
          <span className="tw-font-body-default tw-text-text-default">{variant}</span>
          <Tag variant={variant} removable>
            Static
          </Tag>
          <Tag variant={variant} removable onClick={() => undefined}>
            Clickable
          </Tag>
          <Tag variant={variant} removable disabled onClick={() => undefined}>
            Disabled
          </Tag>
          <Tag variant={variant} removable loading onClick={() => undefined}>
            Loading
          </Tag>
        </React.Fragment>
      ))}
    </div>
  ),
};

export const WithVisuals = {
  render: () => (
    <div className="tw-flex tw-items-center tw-gap-3">
      <Tag variant="outline" leadingVisual={<User />}>
        Owner
      </Tag>
      <Tag variant="outline" prefix="On update">
        RESTRICT
      </Tag>
      <Tag variant="outline" onClick={() => undefined} trailingVisual={<ChevronDown />}>
        +3 more
      </Tag>
    </div>
  ),
};
