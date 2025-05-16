export const linkConfig = {
  name: 'Link',
  displayName: 'Link',
  description: 'Add link to the text',
  defaultSize: {
    width: 6,
    height: 30,
  },
  component: 'Link',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    linkText: {
      type: 'code',
      displayName: 'Link text',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Click here',
      },
    },
    linkTarget: {
      type: 'code',
      displayName: 'Link target',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'https://dev.to/',
      },
    },
    targetType: {
      type: 'select',
      displayName: 'Target type',
      options: [
        { name: 'New Tab', value: 'new' },
        { name: 'Same Tab', value: 'same' },
      ],
      validation: {
        schema: { type: 'string' },
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {
    onClick: { displayName: 'On click' },
    onHover: { displayName: 'On hover' },
  },
  styles: {
    textColor: {
      type: 'colorSwatches',
      displayName: 'Text color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
      accordian: 'Link text',
    },
    textSize: {
      type: 'numberInput',
      displayName: 'Text size',
      validation: {
        schema: { type: 'number' },
        defaultValue: 14,
      },
      accordian: 'Link text',
    },
    horizontalAlignment: {
      type: 'alignButtons',
      displayName: 'Alignment',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'left',
      },
      accordian: 'Link text',
    },
    verticalAlignment: {
      type: 'switch',
      displayName: '',
      validation: { schema: { type: 'string' }, defaultValue: 'center' },
      showLabel: false,
      isIcon: true,
      options: [
        { displayName: 'alignverticallytop', value: 'top', iconName: 'alignverticallytop' },
        { displayName: 'alignverticallycenter', value: 'center', iconName: 'alignverticallycenter' },
        { displayName: 'alignverticallybottom', value: 'bottom', iconName: 'alignverticallybottom' },
      ],
      accordian: 'Link text',
      isFxNotRequired: true,
    },
    icon: {
      type: 'icon',
      displayName: 'Icon',
      validation: { schema: { type: 'string' }, defaultValue: 'IconHome2' },
      accordian: 'Link text',
      visibility: false,
    },

    underline: {
      type: 'select',
      displayName: 'Underline',
      options: [
        { name: 'Never', value: 'no-underline' },
        { name: 'On Hover', value: 'on-hover' },
        { name: 'Always', value: 'underline' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'on-hover',
      },
      accordian: 'Link text',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box Shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Link text',
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
      accordian: 'container',
    },
  },
  exposedVariables: {},
  actions: [
    {
      handle: 'click',
      displayName: 'Click',
    },
    {
      handle: 'setLinkTarget',
      displayName: 'Set link target',
      params: [{ handle: 'setLinkTargetState', displayName: 'Value', defaultValue: '', type: 'code' }],
    },
    {
      handle: 'setLinkText',
      displayName: 'Set link text',
      params: [{ handle: 'setLinkTextState', displayName: 'Value', defaultValue: '', type: 'code' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'isVisible', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'isDisabled', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'isLoading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      linkTarget: { value: 'https://dev.to/' },
      linkText: { value: 'Click here' },
      targetType: { value: 'new' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
      loadingState: { value: '{{false}}' },
    },
    events: [],
    styles: {
      textColor: { value: '#4368E3' },
      textSize: { value: '{{14}}' },
      underline: { value: 'on-hover' },
      verticalAlignment: { value: 'center' },
      horizontalAlignment: { value: 'left' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
      icon: { value: 'IconLink' },
      iconVisibility: { value: false },
    },
  },
};
