export const circularProgressbarConfig = {
  name: 'CircularProgressBar',
  displayName: 'Circular Progressbar',
  description: 'Show circular progress',
  component: 'CircularProgressBar',
  defaultSize: {
    width: 7,
    height: 50,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    text: {
      type: 'code',
      displayName: 'Text',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'text',
      },
    },
    progress: {
      type: 'code',
      displayName: 'Progress',
      validation: {
        schema: { type: 'number' },
        defaultValue: 50,
      },
    },
  },
  events: {},
  styles: {
    color: {
      type: 'colorSwatches',
      displayName: 'colorSwatches',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-brand)',
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Text Color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#fff',
      },
    },
    textSize: {
      type: 'code',
      displayName: 'Text size',
      validation: {
        schema: { type: 'number' },
        defaultValue: 16,
      },
    },
    strokeWidth: {
      type: 'code',
      displayName: 'Stroke width',
      validation: {
        schema: { type: 'number' },
        defaultValue: 8,
      },
    },
    counterClockwise: {
      type: 'code',
      displayName: 'Counter clockwise',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    circleRatio: {
      type: 'code',
      displayName: 'Circle ratio',
      validation: {
        schema: { type: 'number' },
        defaultValue: 1,
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
  },
  exposedVariables: {},
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      text: {
        value: '',
      },
      progress: {
        value: '{{50}}',
      },
    },
    events: [],
    styles: {
      color: { value: 'var(--cc-primary-brand)' },
      textColor: { value: '' },
      textSize: { value: '{{16}}' },
      strokeWidth: { value: '{{8}}' },
      counterClockwise: { value: '{{false}}' },
      circleRatio: { value: '{{1}}' },
      visibility: { value: '{{true}}' },
    },
  },
};
