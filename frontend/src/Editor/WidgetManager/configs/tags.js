export const tagsConfig = {
  name: 'Tags',
  displayName: 'Tags',
  description: 'Display tag labels',
  component: 'Tags',
  defaultSize: {
    width: 8,
    height: 30,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    data: {
      type: 'code',
      displayName: 'Tags',
      validation: {
        schema: {
          type: 'array',
          element: {
            type: 'object',
            object: { title: { type: 'string' }, color: { type: 'string' }, textColor: { type: 'string' } },
          },
        },
        defaultValue:
          "{{ [{ title: 'success', color: '#2fb344', textColor: '#fff' }, { title: 'info', color: '#206bc4', textColor: '#fff'  }] }}",
      },
    },
  },
  events: {},
  styles: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
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
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      data: {
        value:
          "{{ [ \n\t\t{ title: 'success', color: '#2fb344', textColor: '#fff' }, \n\t\t{ title: 'info', color: '#206bc4', textColor: '#fff'  }, \n\t\t{ title: 'warning', color: '#f59f00', textColor: '#fff'  }, \n\t\t{ title: 'danger', color: '#d63939', textColor: '#fff' } ] }}",
      },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      padding: { value: 'default' },
    },
  },
};
