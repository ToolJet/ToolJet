export const statisticsConfig = {
  name: 'Statistics',
  displayName: 'Statistics',
  description: 'Show key metrics',
  component: 'Statistics',
  defaultSize: {
    width: 9,
    height: 152,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    primaryValueLabel: {
      type: 'code',
      displayName: 'Primary value label',
      validation: { schema: { type: 'string' }, defaultValue: 'This months earnings' },
    },
    primaryValue: {
      type: 'code',
      displayName: 'Primary value',
      validation: {
        schema: { type: 'string' },
        defaultValue: '682.3',
      },
    },
    hideSecondary: {
      type: 'toggle',
      displayName: 'Hide secondary value',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
    },
    secondaryValueLabel: {
      type: 'code',
      displayName: 'Secondary value label',
      validation: { schema: { type: 'string' }, defaultValue: 'Last month' },
    },
    secondaryValue: {
      type: 'code',
      displayName: 'Secondary value',
      validation: { schema: { type: 'string' }, defaultValue: '2.85' },
    },
    secondarySignDisplay: {
      type: 'code',
      displayName: 'Secondary sign display',

      validation: { schema: { type: 'string' }, defaultValue: 'positive' },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
    },
  },
  events: {},
  styles: {
    primaryLabelColour: {
      type: 'color',
      displayName: 'Primary label colour',
      validation: { schema: { type: 'string' }, defaultValue: '#8092AB' },
    },
    primaryTextColour: {
      type: 'color',
      displayName: 'Primary text  colour',
      validation: { schema: { type: 'string' }, defaultValue: '#000000' },
    },
    secondaryLabelColour: {
      type: 'color',
      displayName: 'Secondary label colour',
      validation: { schema: { type: 'string' }, defaultValue: '#8092AB' },
    },
    secondaryTextColour: {
      type: 'color',
      displayName: 'Secondary text colour',
      validation: { schema: { type: 'string' }, defaultValue: '#36AF8B' },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
    },
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      primaryValueLabel: { value: 'This months earnings' },
      primaryValue: { value: '682.3' },
      secondaryValueLabel: { value: 'Last month' },
      secondaryValue: { value: '2.85' },
      secondarySignDisplay: { value: 'positive' },
      loadingState: { value: `{{false}}` },
    },
    events: [],
    styles: {
      primaryLabelColour: { value: '#8092AB' },
      primaryTextColour: { value: '#000000' },
      secondaryLabelColour: { value: '#8092AB' },
      secondaryTextColour: { value: '#36AF8B' },
      visibility: { value: '{{true}}' },
    },
  },
};
