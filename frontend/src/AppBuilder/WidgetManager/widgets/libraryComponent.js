export const libraryComponentConfig = {
  name: 'LibraryComponent',
  displayName: 'Library component',
  description: 'Custom component from a deployed library',
  component: 'LibraryComponent',
  defaultSize: {
    width: 12,
    height: 200,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    // F3: typed by hand in the Inspector; F4's picker fills them on drop.
    libraryId: {
      type: 'code',
      displayName: 'Library ID',
      validation: { schema: { type: 'string' }, defaultValue: '' },
    },
    componentName: {
      type: 'code',
      displayName: 'Component name',
      validation: { schema: { type: 'string' }, defaultValue: '' },
    },
    revisionId: {
      type: 'code',
      displayName: 'Revision',
      validation: { schema: { type: 'string' }, defaultValue: 'v1' },
    },
  },
  events: {},
  styles: {
    // REQUIRED by the canvas: WidgetWrapper resolves properties.visibility ?? styles.visibility
    // with NO true-fallback — an undeclared visibility is falsy → display:none in view mode.
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
    },
  },
  exposedVariables: {},
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      libraryId: { value: '' },
      componentName: { value: '' },
      revisionId: { value: 'v1' },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
    },
  },
};
