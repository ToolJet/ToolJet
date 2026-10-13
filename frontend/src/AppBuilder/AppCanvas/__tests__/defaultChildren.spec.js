// Drop-time defaults are stamped once on drag; existing apps keep their own copy.
jest.mock('@/AppBuilder/_stores/store', () => ({
  __esModule: true,
  default: { getState: () => ({ getCurrentPageComponents: () => ({}) }) },
}));
jest.mock('@/_stores/gridStore', () => ({ useGridStore: { getState: () => ({}) } }));

import { addChildrenWidgetsToParent } from '../appCanvasUtils';

const byType = (children, componentName) => children.filter((child) => child.component.component === componentName);

describe('addChildrenWidgetsToParent', () => {
  describe('Listview', () => {
    let children;

    beforeAll(() => {
      children = addChildrenWidgetsToParent('Listview', 'parent-id', 'desktop');
    });

    it('drops an image, a title, a description and an action', () => {
      expect(children.map((child) => child.component.component)).toEqual(['Image', 'Text', 'Text', 'Button']);
    });

    it('binds each child property to the row via listItem', () => {
      const [image, title, description, button] = children;
      expect(image.component.definition.properties.source.value).toBe('{{listItem.imageURL}}');
      expect(title.component.definition.properties.text.value).toBe('{{listItem.text}}');
      expect(description.component.definition.properties.text.value).toBe('{{listItem.description}}');
      expect(button.component.definition.properties.text.value).toBe('{{listItem.buttonText}}');
    });

    it('gives children static styles instead of row bindings', () => {
      const [, title, description, button] = children;
      expect(title.component.definition.styles.fontWeight.value).toBe('bold');
      expect(title.component.definition.styles.textSize.value).toBe('{{14}}');
      expect(description.component.definition.styles.textColor.value).toBe('var(--cc-secondary-text)');
      expect(button.component.definition.styles.type.value).toBe('outline');
      expect(button.component.definition.styles.iconVisibility.value).toBe(true);
      expect(button.component.definition.styles.icon.value).toBe('IconMail');
    });

    it('keeps the outline button readable', () => {
      const [button] = byType(children, 'Button');
      expect(button.component.definition.styles.textColor.value).toBe('var(--cc-primary-text)');
      expect(button.component.definition.styles.iconColor.value).toBe('var(--cc-primary-text)');
    });
  });

  describe('widgets without a row resolver', () => {
    it('keeps style defaults the child config declares but the parent does not override', () => {
      const [text] = byType(addChildrenWidgetsToParent('Container', 'parent-id', 'desktop'), 'Text');

      expect(text.component.definition.styles.fontWeight.value).toBe('bold');
      // Not overridden by the parent, so these must survive the merge.
      expect(text.component.definition.styles.textAlign.value).toBe('left');
      expect(text.component.definition.styles.lineHeight.value).toBe('{{1.5}}');
      expect(text.component.definition.styles.text).toBeUndefined();
      expect(text.component.definition.properties.text.value).toBe('Container title');
    });
  });
});
