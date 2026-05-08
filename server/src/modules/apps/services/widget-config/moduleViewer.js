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
    styles: {
      padding: {
        type: 'switch',
        displayName: 'Padding',
        validation: {
          schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
          defaultValue: 'default',
        },
        isFxNotRequired: true,
        options: [
          { displayName: 'Default', value: 'default' },
          { displayName: 'None', value: 'none' },
        ],
      },
    },
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
        padding: { value: 'default' },
      },
    },
  };
  