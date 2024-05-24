export const codeEditorConfig = {
  name: 'CodeEditor',
  displayName: 'Code Editor',
  description: 'Edit source code',
  component: 'CodeEditor',
  defaultSize: {
    width: 15,
    height: 120,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    enableLineNumber: {
      type: 'code',
      displayName: 'Show line number',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    mode: {
      type: 'code',
      displayName: 'Mode',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'javascript',
      },
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'placeholder',
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
    value: '',
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      enableLineNumber: { value: '{{true}}' },
      mode: { value: 'javascript' },
      placeholder: { value: '' },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      borderRadius: { value: '{{4}}' },
    },
  },
};
