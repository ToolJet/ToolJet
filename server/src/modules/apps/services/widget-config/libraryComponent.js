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
    // Mirror of the frontend config — keep in sync (see frontend widgets/libraryComponent.js).
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
