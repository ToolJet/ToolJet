export const buttonConfig = {
  name: 'Button',
  displayName: 'Button',
  description: 'Trigger actions: queries, alerts, set variables etc.',
  component: 'Button',
  defaultSize: {
    width: 4,
    height: 40,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    text: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: { type: 'string' },
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' } },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' } },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' } },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' } },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {
    onClick: { displayName: 'On click' },
    onHover: { displayName: 'On hover' },
  },
  styles: {
    type: {
      type: 'switch',
      displayName: 'Type',
      validation: { schema: { type: 'string' } },
      options: [
        { displayName: 'Solid', value: 'primary' },
        { displayName: 'Outline', value: 'outline' },
      ],
      accordian: 'button',
    },
    backgroundColor: {
      type: 'color',
      displayName: 'Background',
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
      conditionallyRender: {
        key: 'type',
        value: 'primary',
      },
      accordian: 'button',
    },
    textColor: {
      type: 'color',
      displayName: 'Text color',
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
      accordian: 'button',
    },
    borderColor: {
      type: 'color',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
      accordian: 'button',
    },
    loaderColor: {
      type: 'color',
      displayName: 'Loader color',
      validation: {
        schema: { type: 'string' },
        defaultValue: false,
      },
      accordian: 'button',
    },

    icon: {
      type: 'icon',
      displayName: 'Icon',
      validation: { schema: { type: 'string' } },
      accordian: 'button',
      visibility: false,
    },
    iconColor: {
      type: 'color',
      displayName: 'Icon color',
      validation: { schema: { type: 'string' } },
      accordian: 'button',
      visibility: false,
    },

    direction: {
      type: 'switch',
      displayName: '',
      validation: { schema: { type: 'string' } },
      showLabel: false,
      isIcon: true,
      options: [
        { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
        { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
      ],
      accordian: 'button',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: {
        validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
        defaultValue: false,
      },
      accordian: 'button',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'button',
      conditionallyRender: {
        key: 'type',
        value: 'primary',
      },
    },

    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'container',
    },
  },
  exposedVariables: {
    buttonText: 'Button',
    isVisible: true,
    isDisabled: false,
    isLoading: false,
  },
  actions: [
    {
      handle: 'click',
      displayName: 'Click',
    },
    {
      handle: 'setText',
      displayName: 'Set text',
      params: [{ handle: 'text', displayName: 'Text', defaultValue: 'New Text' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'loading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'disable',
      displayName: 'Disable(deprecated)',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
    {
      handle: 'visibility',
      displayName: 'Visibility(deprecated)',
      params: [{ handle: 'visible', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
    {
      handle: 'loading',
      displayName: 'Loading(deprecated)',
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
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      textColor: { value: '#FFFFFF' },
      borderColor: { value: '#4368E3' },
      loaderColor: { value: '#FFFFFF' },
      borderRadius: { value: '{{6}}' },
      backgroundColor: { value: '#4368E3' },
      iconColor: { value: '#FFFFFF' },
      direction: { value: 'left' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000090' },
      icon: { value: 'IconAlignBoxBottomLeft' },
      iconVisibility: { value: false },
      type: { value: 'primary' },
    },
  },
};
