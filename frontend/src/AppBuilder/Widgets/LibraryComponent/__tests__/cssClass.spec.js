import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';

describe('LibraryComponent cssClass exclusion', () => {
  it('[LibraryComponent-STYLE-003] offers no CSS Class style, unlike a regular widget', () => {
    // Break this catches: removing (or scoping too narrowly) the
    // `if (widget.component === 'LibraryComponent') { delete combined.styles.cssClass; ... }`
    // branch in componentTypes.js — a wrapper class can't reach inside the
    // sandboxed iframe, so silently re-adding it would offer a dead affordance.
    // Button is a revamped widget: it gets the CSS class style but no definition
    // default, so a legacy widget covers the definition-side default.
    const button = componentTypeDefinitionMap['Button'];
    expect(button.styles.cssClass).toBeDefined();
    const legacyWidget = componentTypeDefinitionMap['Timeline'];
    expect(legacyWidget.definition.styles.cssClass).toBeDefined();

    const libraryComponent = componentTypeDefinitionMap['LibraryComponent'];
    expect(libraryComponent.styles.cssClass).toBeUndefined();
    expect(libraryComponent.definition.styles.cssClass).toBeUndefined();
  });
});
