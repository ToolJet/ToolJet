import { computeComponentName } from '../appCanvasUtils';
import { resolvePastedComponentName } from '../copyPasteWidgetsUtils';

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

  // A pack component is named after its own name, not a native widget's: the registry has ButtonGroup as
  // ButtonGroupLegacy, Modal as ModalLegacy, TextArea as Textarea and Divider as HorizontalDivider.
  describe('for a pack component, which skips the native widget registry', () => {
    const pack = { skipRegistry: true };

    it('is named after the pack component', () => {
      expect(computeComponentName('ButtonGroup', {}, undefined, pack)).toBe('buttongroup1');
      expect(computeComponentName('Modal', {}, undefined, pack)).toBe('modal1');
      expect(computeComponentName('TextArea', {}, undefined, pack)).toBe('textarea1');
      expect(computeComponentName('Divider', {}, undefined, pack)).toBe('divider1');
    });

    it('numbers on from the pack components already there', () => {
      expect(computeComponentName('ButtonGroup', existing('buttongroup1'), undefined, pack)).toBe('buttongroup2');
    });

    it('still leaves out the Shad prefix', () => {
      expect(computeComponentName('ShadStat', {}, undefined, pack)).toBe('stat1');
    });
  });

  describe('when a pack component is copied and pasted', () => {
    const copied = (componentName) => ({
      component: {
        component: 'PackComponent',
        definition: { properties: { componentName: { value: componentName } } },
      },
    });

    it('keeps the pack component name, not the native widget it shares a name with', () => {
      const name = resolvePastedComponentName({
        isCut: false,
        isCloning: false,
        originalName: 'buttongroup1',
        componentType: 'PackComponent',
        mergedComponents: existing('buttongroup1'),
        componentDef: copied('ButtonGroup'),
      });

      expect(name).toBe('buttongroup2');
    });

    it('names a pasted pack TextArea textarea1', () => {
      const name = resolvePastedComponentName({
        isCut: false,
        isCloning: false,
        originalName: 'x',
        componentType: 'PackComponent',
        mergedComponents: {},
        componentDef: copied('TextArea'),
      });

      expect(name).toBe('textarea1');
    });
  });
});
