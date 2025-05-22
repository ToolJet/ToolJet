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
    allowHalfStar: {
      type: 'toggle',
      displayName: 'Enable half star',
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
  },
  events: {
    onChange: { displayName: 'On Change' },
  },
  styles: {
    textColor: {
      type: 'colorSwatches',
      displayName: 'Star color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#ffb400',
      },
    },
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Label color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-text)',
      },
    },
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
  exposedVariables: {
    value: 0,
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      label: { value: 'Select your rating' },
      maxRating: { value: '5' },
      defaultSelected: { value: '5' },
      allowHalfStar: { value: '{{false}}' },
      visible: { value: '{{true}}' },
      tooltips: { value: '{{[]}}' },
    },
    events: [],
    styles: {
      textColor: { value: '#ffb400' },
      labelColor: { value: 'var(--cc-primary-text)' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      padding: { value: 'default' },
    },
  },
};
