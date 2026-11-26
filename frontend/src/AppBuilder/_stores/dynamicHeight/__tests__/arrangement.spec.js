import { createArrangementCache } from '../arrangement';
import { buildBlockers, sortBoxes } from '../solver';

// Boxes as the engine builds them for one canvas: saved layout plus the drawn height and the collapse flag.
const box = (id, top, overrides = {}) => ({
  id,
  top,
  left: 0,
  width: 10,
  height: 40,
  collapsible: false,
  ...overrides,
});
const boxes = () => [box('b', 60), box('a', 0), box('side', 0, { left: 20 })];

describe('dynamic height: a canvas’s arrangement kept between passes', () => {
  it('[DynamicHeight-ARRANGE-001] is the saved order and blockers of the canvas', () => {
    const { arrange } = createArrangementCache();
    const { sorted, blockers } = arrange({}, 'canvas', boxes());
    const expected = sortBoxes(boxes());
    expect(sorted).toEqual(expected);
    expect(blockers).toEqual(buildBlockers(expected));
  });

  it('[DynamicHeight-ARRANGE-002] is reused while the page and every box are unchanged', () => {
    const { arrange } = createArrangementCache();
    const page = {};
    const first = arrange(page, 'canvas', boxes());
    // A later pass builds new box objects with the same values.
    expect(arrange(page, 'canvas', boxes())).toBe(first);
  });

  it('[DynamicHeight-ARRANGE-003] is built again when any saved input of a box changes', () => {
    const changes = {
      // Another widget in the same spot (one deleted, one added).
      id: { id: 'c' },
      top: { top: 70 },
      left: { left: 5 },
      width: { width: 4 },
      'drawn height': { height: 60 },
      'collapse flag': { collapsible: true },
      'positioned at': { updatedAt: '2026-11-26T00:00:00Z' },
    };
    for (const [name, change] of Object.entries(changes)) {
      const { arrange } = createArrangementCache();
      const page = {};
      const first = arrange(page, 'canvas', boxes());
      const changed = boxes().map((b) => (b.id === 'b' ? { ...b, ...change } : b));
      const again = arrange(page, 'canvas', changed);
      expect({ name, reused: again === first }).toEqual({ name, reused: false });
      expect(again.sorted).toEqual(sortBoxes(changed));
    }
  });

  it('[DynamicHeight-ARRANGE-004] is built again when a box is added or removed', () => {
    const { arrange } = createArrangementCache();
    const page = {};
    const first = arrange(page, 'canvas', boxes());
    const added = arrange(page, 'canvas', [...boxes(), box('c', 120)]);
    expect(added).not.toBe(first);
    expect(arrange(page, 'canvas', boxes().slice(1))).not.toBe(added);
  });

  it('[DynamicHeight-ARRANGE-005] is kept per page and per canvas', () => {
    const { arrange } = createArrangementCache();
    const page = {};
    const root = arrange(page, 'canvas', boxes());
    expect(arrange(page, 'other', boxes())).not.toBe(root);
    // An edited page is a new page object: nothing from the old one is reused.
    expect(arrange({}, 'canvas', boxes())).not.toBe(root);
    // Each canvas keeps its own: the root's is still there.
    expect(arrange(page, 'canvas', boxes())).toBe(root);
  });
});
