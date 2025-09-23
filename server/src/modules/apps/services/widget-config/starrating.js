export const starratingConfig = {
  name: 'StarRating',
  displayName: 'Rating',
  description: 'Star rating',
  component: 'StarRating',
  defaultSize: {
    width: 10,
    height: 30,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Select your rating',
      },
    },
    iconType: {
      type: 'switch',
      displayName: 'Icon Type',
      validation: { schema: { type: 'string' }, defaultValue: 'stars' },
      options: [
        { displayName: 'Stars', value: 'stars' },
        { displayName: 'Hearts', value: 'hearts' },
      ],
      accordian: 'label',
    },
    maxRating: {
      type: 'code',
      displayName: 'Number of stars',
      validation: {
        schema: { type: 'number' },
        defaultValue: 5,
      },
    },
    defaultSelected: {
      type: 'code',
      displayName: 'Default no of selected stars',
      validation: {
        schema: { type: 'number' },
        defaultValue: 5,
      },
    },
    allowEditing: {
      type: 'toggle',
      displayName: 'Allow editing',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    allowHalfStar: {
      type: 'toggle',
      displayName: 'Allow half rating',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    tooltips: {
      type: 'code',
      displayName: 'Tooltips',
      validation: {
        schema: { type: 'array', element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
        defaultValue: '[]',
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
      validation: { schema: { type: 'boolean' }, defaultValue: true },
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
    onChange: { displayName: 'On Change' },
  },
  styles: {
    labelStyle: {
      type: 'select',
      displayName: 'Style',
      options: [
        { name: 'Standard', value: 'standard' },
        { name: 'Legacy', value: 'legacy' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'standard',
      },
      accordian: 'label',
    },
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Label color',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-text)' },
      accordian: 'label',
    },
    alignment: {
      type: 'switch',
      displayName: 'Alignment',
      validation: { schema: { type: 'string' }, defaultValue: 'side' },
      options: [
        { displayName: 'Side', value: 'side' },
        { displayName: 'Top', value: 'top' },
      ],
      accordian: 'label',
      conditionallyRender: [
        {
          key: 'labelStyle',
          value: 'standard',
        },
      ],
    },
    direction: {
      type: 'switch',
      displayName: '',
      validation: { schema: { type: 'string' }, defaultValue: 'left' },
      showLabel: false,
      isIcon: true,
      options: [
        { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
        { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
      ],
      accordian: 'label',
      isFxNotRequired: true,
      conditionallyRender: [
        {
          key: 'labelStyle',
          value: 'standard',
        },
      ],
    },
    auto: {
      type: 'checkbox',
      displayName: 'Width',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      accordian: 'label',
      conditionallyRender: [
        {
          key: 'labelStyle',
          value: 'standard',
        },
        {
          key: 'alignment',
          value: 'side',
        },
      ],
      isFxNotRequired: true,
    },
    labelWidth: {
      type: 'slider',
      showLabel: false,
      accordian: 'label',
      conditionallyRender: [
        {
          key: 'labelStyle',
          value: 'standard',
        },
        {
          key: 'alignment',
          value: 'side',
        },
        {
          key: 'auto',
          value: false,
        },
      ],
      isFxNotRequired: true,
    },
    widthType: {
      type: 'select',
      showLabel: false,
      options: [
        { name: 'Of the Component', value: 'ofComponent' },
        { name: 'Of the Field', value: 'ofField' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'ofComponent',
      },
      accordian: 'label',
      isFxNotRequired: true,
      conditionallyRender: [
        {
          key: 'labelStyle',
          value: 'standard',
        },
        {
          key: 'alignment',
          value: 'side',
        },
        {
          key: 'auto',
          value: false,
        },
      ],
    },
    // keeping textColor for backward compatibility
    textColor: {
      type: 'colorSwatches',
      displayName: 'Selected background',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#ffb400',
      },
      accordian: 'Icon',
      conditionallyRender: [
        {
          key: 'iconType',
          value: 'stars',
          parentObjectKey: 'properties',
        },
      ],
    },
    selectedBackgroundHearts: {
      type: 'colorSwatches',
      displayName: 'Selected background',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#EE5B67',
      },
      conditionallyRender: [
        {
          key: 'iconType',
          value: 'hearts',
          parentObjectKey: 'properties',
        },
      ],
      accordian: 'Icon',
    },
    unselectedBackground: {
      type: 'colorSwatches',
      displayName: 'Unselected background',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#ffb400',
      },
      accordian: 'Icon',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box Shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
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
      accordian: 'Container',
    },
  },
  exposedVariables: {
    value: 0,
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [{ handle: 'value', displayName: 'value', defaultValue: '0' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'setVisibility', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'setDisable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'setLoading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'resetValue',
      displayName: 'Reset rating',
      params: [],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      label: { value: 'Select your rating' },
      iconType: { value: 'stars' },
      maxRating: { value: '5' },
      defaultSelected: { value: '3' },
      allowHalfStar: { value: '{{false}}' },
      visible: { value: '{{true}}' },
      allowEditing: { value: '{{true}}' },
      tooltips: { value: '{{["Very Poor","Poor","Average", "Good","Excellent"]}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      textColor: { value: '#EFB82D' },
      labelColor: { value: 'var(--cc-primary-text)' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
      labelStyle: { value: 'standard' },
      alignment: { value: 'side' },
      direction: { value: 'left' },
      auto: { value: '{{true}}' },
      widthType: { value: 'ofComponent' },
      labelWidth: { value: '{{33}}' },
      selectedBackgroundHearts: { value: '#EE5B67' },
      unselectedBackground: { value: 'var(--cc-surface3-surface)' },
    },
  },
};
