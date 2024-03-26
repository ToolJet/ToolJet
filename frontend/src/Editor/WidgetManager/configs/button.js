export const buttonConfig = {
  name: 'Button',
  displayName: 'Button',
  description: 'Trigger actions: queries, alerts, set variables etc.',
  component: 'Button',
  defaultSize: {
    width: 3,
    height: 30,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    text: {
      type: 'code',
      displayName: 'Button text',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Submit',
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  events: {
    onClick: { displayName: 'On click' },
    onHover: { displayName: 'On hover' },
  },
  styles: {
    backgroundColor: {
      type: 'color',
      displayName: 'Background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
    },
    textColor: {
      type: 'color',
      displayName: 'Text color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#fff',
      },
    },
    loaderColor: {
      type: 'color',
      displayName: 'Loader color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#fff',
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
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
      type: 'number',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'number' },
        defaultValue: 4,
      },
    },
    borderColor: {
      type: 'color',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
    },
  },
  exposedVariables: {
    buttonText: 'Button',
  },
  actions: [
    {
      handle: 'click',
      displayName: 'Click',
    },
    {
      handle: 'setText',
      displayName: 'Set Text',
      params: [{ handle: 'text', displayName: 'Text', defaultValue: 'New Text' }],
    },
    {
      handle: 'disable',
      displayName: 'Disable',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
    {
      handle: 'visibility',
      displayName: 'Visibility',
      params: [{ handle: 'visible', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
    {
      handle: 'loading',
      displayName: 'Loading',
      params: [{ handle: 'loading', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      text: { value: `Button` },
      loadingState: { value: `{{false}}` },
    },
    events: [],
    styles: {
      backgroundColor: { value: '#375FCF' },
      textColor: { value: '#fff' },
      loaderColor: { value: '#fff' },
      visibility: { value: '{{true}}' },
      borderRadius: { value: '{{4}}' },
      borderColor: { value: '#375FCF' },
      disabledState: { value: '{{false}}' },
    },
  },
};
