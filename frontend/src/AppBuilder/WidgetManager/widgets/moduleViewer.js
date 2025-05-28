export const moduleViewerConfig = {
  name: 'ModuleViewer',
  displayName: 'Module',
  description: 'Module',
  component: 'ModuleViewer',
  defaultSize: {
    width: 10,
    height: 400,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {},
  events: {},
  styles: {},
  exposedVariables: {},
  actions: [],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {},
    events: [],
    styles: {
      backgroundColor: { value: '#fff' },
    },
  },
};
