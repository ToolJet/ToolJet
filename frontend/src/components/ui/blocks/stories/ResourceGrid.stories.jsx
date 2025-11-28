import React from 'react';
import { ResourceGrid } from '../ResourceGrid';

const mockItems = Array.from({ length: 12 }, (_, i) => ({
  id: `item-${i + 1}`,
  name: `Item ${i + 1}`,
}));

const renderCard = (item) => (
  <div key={item.id} className="tw-p-4 tw-border tw-border-border-weak tw-rounded tw-bg-background-surface-layer-01">
    <h3 className="tw-font-semibold">{item.name}</h3>
    <p className="tw-text-sm tw-text-text-placeholder">Description for {item.name}</p>
  </div>
);

export default {
  title: 'UI/Blocks/ResourceGrid',
  component: ResourceGrid,
  parameters: {
    layout: 'padded',
  },
};

export const Default = () => <ResourceGrid items={mockItems} renderItem={renderCard} />;

export const TwoColumns = () => <ResourceGrid items={mockItems} renderItem={renderCard} gridColumns={2} />;

export const ThreeColumns = () => <ResourceGrid items={mockItems} renderItem={renderCard} gridColumns={3} />;

export const FourColumns = () => <ResourceGrid items={mockItems} renderItem={renderCard} gridColumns={4} />;

export const Empty = () => <ResourceGrid items={[]} renderItem={renderCard} />;

export const SingleColumn = () => <ResourceGrid items={mockItems.slice(0, 3)} renderItem={renderCard} gridColumns={1} />;

