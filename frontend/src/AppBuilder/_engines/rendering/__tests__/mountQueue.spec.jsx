import React, { useLayoutEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { useMountBatches } from '../mountQueue';

// A container renders its children through useMountBatches; a child with children of its own is a container too.
const tree = { root: ['a', 'b'], a: ['a1', 'a2'], b: ['b1', 'b2'] };

const setup = (enabled) => {
  const mounted = [];
  const hold = {
    count: 0,
    increments: 0,
    increment: () => {
      hold.count++;
      hold.increments++;
    },
    decrement: () => hold.count--,
  };
  const Node = ({ name }) => {
    useLayoutEffect(() => {
      mounted.push(name);
    }, [name]);
    const children = tree[name] ?? [];
    const shown = useMountBatches(children.length, () => enabled, hold);
    return (
      <div data-name={name}>
        {children.slice(0, shown).map((child) => (
          <Node key={child} name={child} />
        ))}
      </div>
    );
  };
  return { mounted, hold, Node };
};

describe('useMountBatches', () => {
  test('off: every child mounts in the first render, as before', () => {
    const { mounted, hold, Node } = setup(false);
    render(<Node name="root" />);
    expect(mounted).toHaveLength(7);
    expect(hold.increments).toBe(0);
  });

  test('on: children mount over later tasks, a level at a time, holding the page until all have', async () => {
    const { mounted, hold, Node } = setup(true);
    const { container } = render(<Node name="root" />);
    expect(mounted).toEqual(['root']);
    expect(hold.count).toBe(1);
    await waitFor(() => expect(container.querySelectorAll('[data-name]')).toHaveLength(7));
    // Every container's children before any grandchild.
    expect(mounted.slice(0, 3)).toEqual(['root', 'a', 'b']);
    expect(mounted.slice(3).sort()).toEqual(['a1', 'a2', 'b1', 'b2']);
    await waitFor(() => expect(hold.count).toBe(0));
    expect(hold.increments).toBe(3);
  });

  test('unmounting while still mounting releases the page', async () => {
    const { hold, Node } = setup(true);
    const { unmount } = render(<Node name="root" />);
    expect(hold.count).toBe(1);
    unmount();
    expect(hold.count).toBe(0);
  });
});
