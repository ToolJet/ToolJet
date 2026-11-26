import { createWorkQueue } from '../workQueue';

// Drains a queue, recording the items in the order they ran. `onItem` may add more work while it runs.
const drainAll = (queue, onItem = () => {}) => {
  const ran = [];
  queue.drain((item) => {
    ran.push(item);
    onItem(item);
  });
  return ran;
};

describe('dynamic height: work queue', () => {
  it('[DynamicHeight-QUEUE-001] runs the deepest level first, and each level in the order it was added', () => {
    const queue = createWorkQueue();
    queue.add(1, 'canvas', 'canvas');
    queue.add(3, 'inner-a', 'inner-a');
    queue.add(2, 'middle', 'middle');
    queue.add(3, 'inner-b', 'inner-b');
    expect(drainAll(queue)).toEqual(['inner-a', 'inner-b', 'middle', 'canvas']);
  });

  it('[DynamicHeight-QUEUE-002] runs each key once, however often it is added', () => {
    const queue = createWorkQueue();
    queue.add(2, 'slot', 'first');
    queue.add(2, 'slot', 'second');
    const ran = drainAll(queue, (item) => {
      if (item === 'first') queue.add(1, 'parent', 'parent');
    });
    expect(ran).toEqual(['first', 'parent']);
  });

  it('[DynamicHeight-QUEUE-003] does not run a key again when it is added after it ran', () => {
    const queue = createWorkQueue();
    queue.add(2, 'slot', 'slot');
    const ran = drainAll(queue, (item) => {
      if (item === 'slot') queue.add(1, 'slot', 'slot again');
    });
    expect(ran).toEqual(['slot']);
  });

  it('[DynamicHeight-QUEUE-004] runs work added at the level being drained, or below it, in the same drain', () => {
    const queue = createWorkQueue();
    queue.add(2, 'a', 'a');
    const ran = drainAll(queue, (item) => {
      if (item === 'a') {
        queue.add(2, 'b', 'b'); // same level: after `a`
        queue.add(0, 'root', 'root');
      }
    });
    expect(ran).toEqual(['a', 'b', 'root']);
  });

  it('[DynamicHeight-QUEUE-005] refuses work added above the level being drained, which would never run', () => {
    const queue = createWorkQueue();
    queue.add(1, 'outer', 'outer');
    expect(() => drainAll(queue, () => queue.add(3, 'inner', 'inner'))).toThrow(
      'dynamic height: inner added at level 3 while level 1 is running'
    );
  });

  it('[DynamicHeight-QUEUE-006] refuses a level that is not a whole number from 0 up', () => {
    const queue = createWorkQueue();
    for (const level of [-1, 1.5, NaN, undefined]) {
      expect(() => queue.add(level, 'x', 'x')).toThrow('dynamic height: x has no valid level');
    }
  });

  it('[DynamicHeight-QUEUE-007] drains nothing when nothing was added', () => {
    expect(drainAll(createWorkQueue())).toEqual([]);
  });

  it('[DynamicHeight-QUEUE-008] runs work added after a drain on the next drain', () => {
    const queue = createWorkQueue();
    queue.add(1, 'a', 'a');
    drainAll(queue);
    queue.add(3, 'b', 'b');
    expect(drainAll(queue)).toEqual(['b']);
  });
});
