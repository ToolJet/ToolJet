import React from 'react';
import { render, screen } from '@/test/test-utils';
import { SortableTree } from '@/_ui/SortableTree';

const PROPERTY_NAMES = { isGroup: 'isGroup', parentId: 'parentId' };

// Regression for: editing a Nav menu item's / Tabs tab's own "id" field closed its
// edit popover. Root cause: SortableTree keyed each row by `item.id`, so changing
// `id` gave the row a new React key, forcing an unmount/remount that reset any
// popover-open state living on that row. Fix: an optional `getItemKey` prop lets a
// consumer key rows by a stable identity instead of the mutable `id`.
describe('SortableTree row identity (getItemKey)', () => {
  const Row = ({ item, mountSpy }) => {
    // Empty-deps effect: fires once per mount. A second call means the row unmounted
    // and remounted rather than being updated in place.
    React.useEffect(() => {
      mountSpy(item._key);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div data-testid={`row-${item._key}`}>{item.id}</div>;
  };

  it('keeps a row mounted when its id changes but getItemKey stays stable', () => {
    const mountSpy = jest.fn();
    const renderItem = (item) => <Row item={item} mountSpy={mountSpy} />;

    const { rerender } = render(
      <SortableTree
        items={[{ id: 'item1', _key: 'stable-key-1', label: 'Item 1' }]}
        propertyNames={PROPERTY_NAMES}
        renderItem={renderItem}
        getItemKey={(item) => item._key}
      />
    );

    expect(mountSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('row-stable-key-1')).toHaveTextContent('item1');

    // Simulate editing the item's user-facing id; `_key` (assigned once at creation)
    // does not change.
    rerender(
      <SortableTree
        items={[{ id: 'item1-renamed', _key: 'stable-key-1', label: 'Item 1' }]}
        propertyNames={PROPERTY_NAMES}
        renderItem={renderItem}
        getItemKey={(item) => item._key}
      />
    );

    // Same row instance (no second mount), updated in place to the new id.
    expect(mountSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('row-stable-key-1')).toHaveTextContent('item1-renamed');
  });
});

// Regression for: rejecting a duplicate Nav item id (validation correctly flags it,
// and it's never persisted) still reflects the typed value in local state so the
// user sees what they typed — which briefly means two distinct items share the same
// `id`. SortableTree's internal flattening had its own dedup guard keyed by `id`
// (separate from the React row key above), so the second same-id item silently
// vanished from the rendered list instead of just failing validation.
describe('SortableTree flatten dedup (getItemKey)', () => {
  it('renders two distinct items that temporarily share the same id', () => {
    const renderItem = (item) => <div data-testid={`row-${item._key}`}>{item.label}</div>;

    render(
      <SortableTree
        items={[
          { id: 'dup', _key: 'key-a', label: 'Item A' },
          { id: 'dup', _key: 'key-b', label: 'Item B' },
        ]}
        propertyNames={PROPERTY_NAMES}
        renderItem={renderItem}
        getItemKey={(item) => item._key}
      />
    );

    expect(screen.getByTestId('row-key-a')).toHaveTextContent('Item A');
    expect(screen.getByTestId('row-key-b')).toHaveTextContent('Item B');
  });
});
