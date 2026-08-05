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
  // Identity (libraryId/componentName/revisionId) is deliberately NOT in the schema —
  // it lives only in definition.properties (stamped on drop, moduleViewer precedent:
  // moduleAppId is likewise definition-only). The custom Inspector (F4b) renders
  // manifest-driven fields instead; raw id inputs must never appear.
  properties: {},
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
