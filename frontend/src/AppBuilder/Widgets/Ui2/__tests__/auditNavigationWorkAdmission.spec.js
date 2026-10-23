import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixture currentNavigationWorkAdmission016, its characterizations turned into assertions):
// setItemVisibility and setItemDisable patch the raw Items before navItems normalizes them, and the patch kept its own
// caps. It mapped 1,000 top-level items where navItems reads 200, every child where navItems reads 50, one level deeper
// than navItems flattens, and patched a node shared down several paths once per path. The patch now reads the same
// caps as navItems (imported from actionsModel) and patches a shared node once per depth. The controls: no changes
// reads nothing, and a patch still applies, reveals a hidden item and leaves the input alone.
import { navItems } from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';
import { patchNavItems } from '@/AppBuilder/Widgets/Ui2/Navigation/navParts';

// Counts indexed reads of an array, passing every read through.
const counted = (array, count) =>
  new Proxy(array, {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^(0|[1-9]\d*)$/.test(key)) count.reads++;
      return Reflect.get(target, key, receiver);
    },
  });

test('no changes returns the original Items without reading them (control)', () => {
  const count = { reads: 0 };
  const raw = counted(
    [{ value: 'root', label: 'Root', children: counted([{ value: 'child', label: 'Child' }], count) }],
    count
  );
  expect(patchNavItems(raw, {})).toBe(raw);
  expect(count.reads).toBe(0);
});

test('a patch applies without changing the input (control)', () => {
  const raw = [{ value: 'root', label: 'Root', children: [{ value: 'child', label: 'Child' }] }];
  const before = JSON.stringify(raw);
  const normalized = navItems(patchNavItems(raw, { root: { disabled: true } }));
  expect(normalized[0]).toMatchObject({
    key: 'root',
    disabled: true,
    children: [expect.objectContaining({ key: 'child', disabled: false })],
  });
  expect(JSON.stringify(raw)).toBe(before);
});

test('a visibility change reveals a hidden child (control)', () => {
  const raw = [{ value: 'root', label: 'Root', children: [{ value: 'child', label: 'Child', visible: false }] }];
  expect(navItems(raw)[0].children).toHaveLength(0);
  expect(navItems(patchNavItems(raw, { child: { visible: true } }))[0].children.map((c) => c.key)).toEqual(['child']);
});

test('240 top-level items: the patch reads no more than navItems admits', () => {
  const count = { reads: 0 };
  const raw = counted(
    Array.from({ length: 240 }, (_, i) => ({ value: `item-${i}`, label: `Item ${i}` })),
    count
  );
  const before = navItems(raw);
  const normalizerReads = count.reads;
  count.reads = 0;
  const after = navItems(patchNavItems(raw, { 'item-0': { disabled: true } }));
  expect(before).toHaveLength(200);
  expect(after).toHaveLength(200);
  expect(after[0].disabled).toBe(true);
  expect(normalizerReads).toBe(200);
  // The patch's own read of each item, then navItems' read of the patched list (a plain array, uncounted).
  expect(count.reads).toBe(200);
});

test('80 children: the patch reads no more than navItems admits', () => {
  const count = { reads: 0 };
  const children = Array.from({ length: 80 }, (_, i) => ({ value: `child-${i}`, label: `Child ${i}` }));
  const raw = [{ value: 'root', label: 'Root', children: counted(children, count) }];
  const before = navItems(raw);
  const normalizerReads = count.reads;
  count.reads = 0;
  const after = navItems(patchNavItems(raw, { root: { disabled: true } }));
  expect(before[0].children).toHaveLength(50);
  expect(after[0].children).toHaveLength(50);
  expect(after[0].disabled).toBe(true);
  expect(normalizerReads).toBe(50);
  expect(count.reads).toBe(50);
});

test('a shared descendant graph is patched once per depth, not once per path', () => {
  const count = { reads: 0 };
  let child = { value: 'leaf', label: 'Leaf' };
  for (let depth = 3; depth >= 0; depth--) {
    child = {
      value: `level-${depth}`,
      label: `Level ${depth}`,
      children: counted(
        Array.from({ length: 4 }, () => child),
        count
      ),
    };
  }
  const raw = [child];
  const before = navItems(raw);
  const normalizerReads = count.reads;
  count.reads = 0;
  const after = navItems(patchNavItems(raw, { 'level-0': { disabled: true } }));
  expect(after[0].disabled).toBe(true);
  expect(after[0].children.map((x) => x.key)).toEqual(before[0].children.map((x) => x.key));
  expect(normalizerReads).toBe(12);
  expect(count.reads).toBeLessThanOrEqual(normalizerReads);
});

test('a change reaches the deepest level navItems flattens, and the patch reads no deeper', () => {
  const count = { reads: 0 };
  const level4 = counted([{ value: 'level-4', label: 'Level 4' }], count);
  const raw = [
    {
      value: 'level-0',
      label: 'Level 0',
      children: [
        {
          value: 'level-1',
          label: 'Level 1',
          children: [
            {
              value: 'level-2',
              label: 'Level 2',
              children: [{ value: 'level-3', label: 'Level 3', children: level4 }],
            },
          ],
        },
      ],
    },
  ];
  const keys = navItems(raw)[0].children.map((c) => c.key);
  expect(keys).toEqual(['level-1', 'level-2', 'level-3']);
  count.reads = 0;
  const after = navItems(patchNavItems(raw, { 'level-3': { disabled: true } }));
  expect(after[0].children.find((c) => c.key === 'level-3').disabled).toBe(true);
  expect(count.reads).toBe(0);
});
