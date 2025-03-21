export const textareaConfig = {
  name: 'Textarea',
  displayName: 'Text Area',
  description: 'Multi-line text input',
  component: 'TextArea',
  defaultSize: {
    width: 6,
    height: 100,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    value: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'default text',
      },
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Placeholder text',
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
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    borderRadius: {
      type: 'code',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'number' },
        defaultValue: 4,
      },
    },
  },
  exposedVariables: {
    value:
      'ToolJet is an open-source low-code platform for building and deploying internal tools with minimal engineering efforts 🚀',
  },
  actions: [
    {
      handle: 'setText',
      displayName: 'Set Text',
      params: [{ handle: 'text', displayName: 'text', defaultValue: 'New Text' }],
    },
    {
      handle: 'clear',
      displayName: 'Clear',
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      value: {
        value:
          'ToolJet is an open-source low-code platform for building and deploying internal tools with minimal engineering efforts 🚀',
      },
      placeholder: { value: 'Placeholder text' },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      borderRadius: { value: '{{4}}' },
    },
  },
};
