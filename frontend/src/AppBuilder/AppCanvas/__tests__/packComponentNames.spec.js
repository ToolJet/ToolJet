import { computeComponentName } from '../appCanvasUtils';

// A widget dropped from the components panel is named after its type. The pack's types start with "Shad" (an internal
// name), so a new line chart was "shadlinechart1" in the canvas, the inspector and every binding the user wrote.
describe('names for new pack widgets', () => {
  const existing = (...names) => Object.fromEntries(names.map((name, i) => [`id-${i}`, { component: { name } }]));

  it('leave out the pack prefix', () => {
    expect(computeComponentName('ShadLineChart', {})).toBe('linechart1');
    expect(computeComponentName('ShadStat', existing('stat1'))).toBe('stat2');
  });

  it('stay unique beside native widgets of the same name', () => {
    expect(computeComponentName('ShadText', existing('text1'))).toBe('text2');
    expect(computeComponentName('Text', existing('text1', 'text2'))).toBe('text3');
  });

  it('leave native widget names as they were', () => {
    expect(computeComponentName('Table', {})).toBe('table1');
  });
});
