import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import CustomJSONViewer from '../CustomJSONViewer';

// The rows' overflow tooltips observe their size; jsdom has no ResizeObserver.
beforeAll(() => {
  global.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const rowsOf = (container) => container.querySelectorAll('.json-viewer-row');
const open = (container, label) =>
  fireEvent.click(container.querySelector(`[data-cy="inspector-${label}-label"]`).closest('.json-viewer-row'));

describe('Inspector value viewer', () => {
  test('a small array lists its entries, as before', () => {
    const { container } = render(
      <CustomJSONViewer data={{ items: [1, 2, 3] }} absolutePath="queries.q1" iconsList={[]} />
    );
    open(container, 'items');
    expect([...rowsOf(container)].map((row) => row.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining('0'), expect.stringContaining('2')])
    );
    expect(container.querySelectorAll('[data-cy="inspector-entry-group"]')).toHaveLength(0);
  });

  test('a million rows open as a few groups, then rows on demand', () => {
    const data = Array.from({ length: 1000000 }, (_, id) => ({ id }));
    const { container } = render(<CustomJSONViewer data={{ data }} absolutePath="queries.q1" iconsList={[]} />);
    open(container, 'data');
    const groups = container.querySelectorAll('[data-cy="inspector-entry-group"]');
    expect(groups.length).toBeLessThanOrEqual(100);
    expect(rowsOf(container).length).toBeLessThan(110);
    expect(groups[0].textContent).toBe('[0 … 9999]');

    // Open the first group, then its first group: rows 0…99.
    fireEvent.click(groups[0]);
    fireEvent.click(container.querySelectorAll('[data-cy="inspector-entry-group"]')[1]);
    expect(container.querySelector('[data-cy="inspector-99-label"]')).not.toBeNull();
    expect(container.querySelector('[data-cy="inspector-100-label"]')).toBeNull();
  });
});
