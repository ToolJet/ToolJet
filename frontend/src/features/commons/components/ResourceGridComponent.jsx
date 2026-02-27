import * as React from 'react';
import { ResourceGrid } from '@/components/ui/blocks/ResourceGrid/ResourceGrid';

/**
 * Generic resource grid component that renders items using a custom render function.
 *
 * @param {Object} props
 * @param {Array} props.items - Array of resource items to render
 * @param {Function} props.renderItem - Function to render each item: (item, index) => ReactNode
 *
 * @returns {ReactNode}
 */
export const ResourceGridComponent = ({ items = [], renderItem }) => {
  if (!renderItem || typeof renderItem !== 'function') {
    console.warn('ResourceGridComponent requires a renderItem function');
    return null;
  }

  return <ResourceGrid items={items} renderItem={renderItem} />;
};

export default ResourceGridComponent;
