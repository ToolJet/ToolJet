/**
 * The dependency graph is the bridge between "a component published a value"
 * and "these other properties must be recomputed". Every binding that silently
 * stops updating traces back to an edge that is missing, or an edge that should
 * have been removed and wasn't.
 *
 * Pure class, no store, no DOM, no mocks.
 *
 * Edge direction is inverted from intuition: addDependency(fromPath = SOURCE,
 * toPath = DEPENDENT PROPERTY), so getDependencies(sourcePath) returns the
 * property paths to recompute.
 */
import DependencyGraph from '../DependencyClass';

const TEXT = 'components.t1.properties.text';

describe('edge registration', () => {
  test('a source cascades to its dependent property, transitively', () => {
    const g = new DependencyGraph();
    g.addDependency('components.t1.value', 'components.t2.properties.text');
    g.addDependency('components.t2.value', 'components.t3.properties.text');

    // The whole cascade relies on this being transitive: t1 changing must reach
    // everything downstream of t2 as well. Two hops here — components.t1 ->
    // components.t1.value -> components.t2.properties.text.
    expect(g.getDependencies('components.t1')).toEqual(
      expect.arrayContaining(['components.t1.value', 'components.t2.properties.text'])
    );
    expect(g.getDependencies('components.t2')).toEqual(
      expect.arrayContaining(['components.t2.properties.text', 'components.t3.properties.text'])
    );
  });

  test('source paths are truncated to 3 segments so they match what setExposedValue emits', () => {
    const g = new DependencyGraph();
    g.addDependency('components.t1.properties.options.label', 'others.foo');

    // addNode(path, 3) returns the 3-segment dataPath and THAT is the edge
    // source. If this changed, the cascade key `components.<id>.<key>` written
    // by resolvedSlice.setExposedValue would no longer find its dependents.
    expect(g.getDirectDependents('others.foo')).toEqual(['components.t1.properties']);
  });

  test('variables and input keep only 2 segments', () => {
    const g = new DependencyGraph();
    g.addDependency('variables.a.b.c', TEXT);

    // DependencyClass.js:17-22 — the variables/input branch slices to 2 parts.
    expect(g.getDirectDependents(TEXT)).toEqual(expect.arrayContaining(['variables.a']));
    expect(g.hasNode('variables.a.b.c')).toBe(false);
  });

  test('node data carries the unresolved expression used for re-resolution', () => {
    const g = new DependencyGraph();
    g.addDependency('queries.q1.data', TEXT, '{{queries.q1.data}}');

    // applyDependencyUpdate reads this back to know WHAT to re-evaluate.
    expect(g.getNodeData(TEXT)).toBe('{{queries.q1.data}}');
  });
});

describe('edge removal', () => {
  test.failing('BUG: removeDependency removes only ONE incoming edge', () => {
    const g = new DependencyGraph();
    g.addDependency('queries.q1.data', TEXT);
    g.addDependency('queries.q2.data', TEXT);

    g.removeDependency(TEXT);

    // DependencyClass.js:39-44 breaks out of the loop after the FIRST dependent
    // that is not a prefix of toPath, so exactly one edge is ever removed.
    //
    // Real consequence: an expression like `{{queries.q1.data}} {{queries.q2.data}}`
    // edited down to a single reference leaves q2 wired to this property
    // forever. q2 keeps triggering recomputes of a property that no longer
    // mentions it, and once q2 is deleted the property re-resolves against a
    // missing entity. Observed today: ['components.t1', 'queries.q2.data'].
    expect(g.getDirectDependents(TEXT)).toEqual(['components.t1']);
  });

  test.failing('BUG: updateDependency leaves the surplus edges behind', () => {
    const g = new DependencyGraph();
    g.addDependency('queries.q1.data', TEXT);
    g.addDependency('queries.q2.data', TEXT);

    // This is the real edit path: the user rewrites the expression to reference
    // only q3. updateDependency = removeDependency + addDependency, and
    // removeDependency drops only one edge (above), so q2 survives.
    g.updateDependency('queries.q3.data', TEXT);

    expect(g.getDirectDependents(TEXT).filter((d) => d.startsWith('queries.'))).toEqual(['queries.q3.data']);
  });

  test('removing the only edge does clear it', () => {
    const g = new DependencyGraph();
    g.addDependency('queries.q1.data', TEXT);

    g.removeDependency(TEXT);

    // The single-reference case works — which is why the bug above survived so
    // long. Keep this as the contrast pair.
    expect(g.getDirectDependents(TEXT)).not.toContain('queries.q1.data');
  });

  test.failing('BUG: removeNode on an exact leaf path is a total no-op', () => {
    const g = new DependencyGraph();
    g.addDependency('variables.v1', TEXT);

    g.removeNode('variables.v1');

    // DependencyClass.js:61 filters `node.startsWith(`${path}.`)` — it only ever
    // removes DESCENDANTS, never the node AT `path`. So removeNode on a leaf or
    // on a source path silently does nothing, and the caller believes it
    // unregistered the entity. `removeLeafNode` (:184) is the method that
    // actually does this; callers reaching for removeNode get a no-op.
    expect(g.hasNode('variables.v1')).toBe(false);
  });

  test('removeNode does remove a subtree under a component id', () => {
    const g = new DependencyGraph();
    g.addDependency('queries.q1.data', TEXT);

    g.removeNode('components.t1');

    // The component-delete path works because the property nodes are genuine
    // descendants of `components.t1`.
    expect(g.hasNode(TEXT)).toBe(false);
  });

  test('removeLeafNode removes the exact node removeNode cannot', () => {
    const g = new DependencyGraph();
    g.addDependency('variables.v1', TEXT);

    g.removeLeafNode('variables.v1');

    expect(g.hasNode('variables.v1')).toBe(false);
  });
});

describe('orphan cleanup', () => {
  test.failing('BUG: a still-referenced source is deleted when one consumer goes away', () => {
    const g = new DependencyGraph();
    g.addDependency('variables.v1', 'components.t1.properties.text');
    g.addDependency('variables.v1', 'components.t2.properties.text');

    // t1 is deleted; t2 still binds to variables.v1.
    g.removeNode('components.t1');

    // cleanupOrphanedNodes (DependencyClass.js:104) deletes any candidate whose
    // dependencies.length + dependents.length <= 1 — so a node with one LIVE
    // relation left is eligible for deletion.
    //
    // Real consequence, and this is the nasty one: deleting ANY component that
    // shares a variable with another component silently unregisters that
    // variable. t2's `{{variables.v1}}` binding never updates again for the rest
    // of the session, with no error anywhere. Observed today: hasNode === false
    // and getDependencies() === [].
    expect(g.hasNode('variables.v1')).toBe(true);
    expect(g.getDependencies('variables.v1')).toContain('components.t2.properties.text');
  });

  test('a source with two surviving consumers is kept', () => {
    const g = new DependencyGraph();
    g.addDependency('variables.v1', 'components.t1.properties.text');
    g.addDependency('variables.v1', 'components.t2.properties.text');
    g.addDependency('variables.v1', 'components.t3.properties.text');

    g.removeNode('components.t1');

    // With two relations remaining the `<= 1` test fails and the node survives,
    // which is why this only bites on the two-consumer case.
    expect(g.hasNode('variables.v1')).toBe(true);
  });
});

describe('cycle safety', () => {
  test('a self-referencing binding registers, but reading it back THROWS', () => {
    const g = new DependencyGraph();

    // A user can always type {{components.t1.value}} into t1's own property, so
    // this input is reachable from the UI.
    expect(() => g.addDependency('components.t1.value', 'components.t1.value')).not.toThrow();

    // The cycle is only detected on read, by dependency-graph itself.
    // updateDependencyValues -> getDependencies is NOT wrapped in a try/catch at
    // componentsSlice.js:2848, so this propagates out of the cascade and takes
    // the rest of that flush with it. Pinned as the known contract: if someone
    // adds cycle tolerance, this test tells them the blast radius they changed.
    expect(() => g.getDependencies('components.t1.value')).toThrow(/Dependency Cycle Found/);
  });

  test('a two-node cycle also throws on read rather than looping forever', () => {
    const g = new DependencyGraph();
    g.addDependency('components.t1.value', 'components.t2.value');
    g.addDependency('components.t2.value', 'components.t1.value');

    // Terminating with an error is the important half — an infinite loop here
    // would hang the editor tab.
    expect(() => g.getDependencies('components.t1.value')).toThrow(/Dependency Cycle Found/);
    expect(() => g.getOverallOrder()).toThrow(/Dependency Cycle Found/);
  });
});
