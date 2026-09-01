import { addChildrenWidgetsToParent } from '../appCanvasUtils';
import { componentTypes } from '@/AppBuilder/WidgetManager';

// The util only reads the page's existing components to de-duplicate the new
// child's name. Stubbing the store keeps this a unit spec (see src/test/README).
jest.mock('@/AppBuilder/_stores/store', () => ({
  __esModule: true,
  default: {
    getState: () => ({ getCurrentPageComponents: () => ({}) }),
  },
}));

const metaFor = (componentType) => componentTypes.find((component) => component.component === componentType);

const childOf = (children, componentName) => children.find((child) => child.component.component === componentName);

describe('addChildrenWidgetsToParent', () => {
  describe('preset styles of default children', () => {
    it('keeps every preset style the child widget meta declares', () => {
      const textPresetStyles = metaFor('Text').definition.styles;

      const children = addChildrenWidgetsToParent('Container', 'parent-id', 'desktop');
      const headerText = childOf(children, 'Text');

      expect(Object.keys(headerText.component.definition.styles)).toEqual(
        expect.arrayContaining(Object.keys(textPresetStyles))
      );
    });

    it('does not leak property keys into the styles block', () => {
      const children = addChildrenWidgetsToParent('Container', 'parent-id', 'desktop');
      const headerText = childOf(children, 'Text');

      // `text` is a property, not a style. It appeared under styles when both
      // blocks were seeded from — and written back to — one shared object.
      expect(headerText.component.definition.styles.text).toBeUndefined();
      expect(headerText.component.definition.styles.textFormat).toBeUndefined();
    });

    it('applies the defaultValue overrides declared for the child', () => {
      const children = addChildrenWidgetsToParent('Container', 'parent-id', 'desktop');
      const { styles, properties } = childOf(children, 'Text').component.definition;

      expect(styles.fontWeight).toEqual({ value: 'bold' });
      expect(styles.textSize).toEqual({ value: 16 });
      expect(styles.textColor).toEqual({ value: 'var(--cc-primary-text)' });
      expect(properties.text).toEqual({ value: 'Container title' });
    });

    it('preserves a falsy defaultValue instead of coercing it to an empty string', () => {
      const children = addChildrenWidgetsToParent('ModalV2', 'parent-id', 'desktop');
      const footerButton = childOf(children, 'Button');

      // ModalV2's footer button declares `iconVisibility: false`; `||` turned
      // that into ''.
      expect(footerButton.component.definition.styles.iconVisibility).toEqual({ value: false });
    });
  });
});
