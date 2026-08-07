/**
 * @jest-environment node
 */
import DependencyGraph from '@/AppBuilder/_stores/slices/DependencyClass';

describe('DependencyGraph toJSON/fromJSON round-trip', () => {
  it('preserves nodes, edges and traversal order after serialize/deserialize', () => {
    const graph = new DependencyGraph();
    graph.addDependency('queries.q1.data', 'components.c1.property.text');
    graph.addDependency('components.c1.property.text', 'components.c2.property.text');

    const restored = DependencyGraph.fromJSON(JSON.parse(JSON.stringify(graph.toJSON())));

    expect(restored.getOverallOrder()).toEqual(graph.getOverallOrder());
    expect(restored.getDependencies('components.c2.property.text')).toEqual(
      graph.getDependencies('components.c2.property.text')
    );
    expect(restored.hasNode('queries.q1.data')).toBe(true);
  });
});
