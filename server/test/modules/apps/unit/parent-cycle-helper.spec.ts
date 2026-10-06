/// <reference types="jest" />
import { repairParentCycles, ParentRefComponent } from '@helpers/parent_cycle.helper';

/** @group platform */
describe('repairParentCycles', () => {
  it('should return no repaired ids for an empty array', () => {
    expect(repairParentCycles([])).toEqual({ repairedIds: [] });
  });

  it('should leave a tree without cycles unchanged', () => {
    const components: ParentRefComponent[] = [
      { id: 'A', parent: null },
      { id: 'B', parent: 'A' },
      { id: 'C', parent: 'B' },
    ];

    const result = repairParentCycles(components);

    expect(result.repairedIds).toEqual([]);
    expect(components).toEqual([
      { id: 'A', parent: null },
      { id: 'B', parent: 'A' },
      { id: 'C', parent: 'B' },
    ]);
  });

  it('should repair a self-parent by nulling its parent', () => {
    const components: ParentRefComponent[] = [{ id: 'A', parent: 'A' }];

    const result = repairParentCycles(components);

    expect(result.repairedIds).toEqual(['A']);
    expect(components.find((c) => c.id === 'A')?.parent).toBeNull();
  });

  it('should break a two-node cycle at the lexicographically smallest id', () => {
    const components: ParentRefComponent[] = [
      { id: 'A', parent: 'B' },
      { id: 'B', parent: 'A' },
    ];

    const result = repairParentCycles(components);

    expect(result.repairedIds).toEqual(['A']);
    expect(components.find((c) => c.id === 'A')?.parent).toBeNull();
    expect(components.find((c) => c.id === 'B')?.parent).toBe('A');
  });

  it('should break a three-node cycle at the lexicographically smallest id only', () => {
    const components: ParentRefComponent[] = [
      { id: 'a', parent: 'b' },
      { id: 'b', parent: 'c' },
      { id: 'c', parent: 'a' },
    ];

    const result = repairParentCycles(components);

    expect(result.repairedIds).toEqual(['a']);
    expect(components.find((c) => c.id === 'a')?.parent).toBeNull();
    expect(components.find((c) => c.id === 'b')?.parent).toBe('c');
    expect(components.find((c) => c.id === 'c')?.parent).toBe('a');
  });

  it('should resolve a slot-suffixed parent to its bare UUID when detecting a cycle', () => {
    const uuidA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const uuidB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const components: ParentRefComponent[] = [
      { id: uuidA, parent: `${uuidB}-tab1` },
      { id: uuidB, parent: uuidA },
    ];

    const result = repairParentCycles(components);

    expect(result.repairedIds).toEqual([uuidA]);
    expect(components.find((c) => c.id === uuidA)?.parent).toBeNull();
    expect(components.find((c) => c.id === uuidB)?.parent).toBe(uuidA);
  });

  it('should leave a parent pointing at an unknown id alone', () => {
    const components: ParentRefComponent[] = [
      { id: 'A', parent: 'ghost' },
      { id: 'B', parent: 'A' },
    ];

    const result = repairParentCycles(components);

    expect(result.repairedIds).toEqual([]);
    expect(components.find((c) => c.id === 'A')?.parent).toBe('ghost');
  });

  it('should be deterministic across repeated calls on the same input', () => {
    const makeComponents = (): ParentRefComponent[] => [
      { id: 'a', parent: 'b' },
      { id: 'b', parent: 'c' },
      { id: 'c', parent: 'a' },
    ];

    const first = repairParentCycles(makeComponents());
    const second = repairParentCycles(makeComponents());

    expect(first.repairedIds).toEqual(second.repairedIds);
  });
});
