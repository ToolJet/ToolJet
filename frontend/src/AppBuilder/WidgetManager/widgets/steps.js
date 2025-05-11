export const stepsConfig = {
  name: 'Steps',
  displayName: 'Steps',
  description: 'Step-by-step navigation aid',
  component: 'Steps',
  properties: {
    steps: {
      type: 'code',
      displayName: 'Steps',
      validation: {
        schema: {
          type: 'array',
          element: { type: 'object', object: { id: { type: 'number' } } },
        },
        defaultValue: `[{ name: 'step 1'}, {name: 'step 2'}]`,
      },
    },
    currentStep: {
      type: 'code',
      displayName: 'Current step',
      validation: {
        schema: { type: 'number' },
        defaultValue: 1,
      },
    },
    stepsSelectable: {
      type: 'toggle',
      displayName: 'Steps selectable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  defaultSize: {
    width: 22,
    height: 38,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  events: {
    onSelect: { displayName: 'On select' },
  },
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
      displayName: 'Text color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#000000',
      },
    },
    theme: {
      type: 'select',
      displayName: 'Theme',
      options: [
        { name: 'titles', value: 'titles' },
        { name: 'numbers', value: 'numbers' },
        { name: 'plain', value: 'plain' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'titles',
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
  exposedVariables: {
    currentStepId: '3',
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      steps: {
        value: `{{ [{ name: 'step 1', tooltip: 'some tooltip', id: 1},{ name: 'step 2', tooltip: 'some tooltip', id: 2},{ name: 'step 3', tooltip: 'some tooltip', id: 3},{ name: 'step 4', tooltip: 'some tooltip', id: 4},{ name: 'step 5', tooltip: 'some tooltip', id: 5}]}}`,
      },
      currentStep: { value: '{{3}}' },
      stepsSelectable: { value: true },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      theme: { value: 'titles' },
      color: { value: 'var(--cc-primary-brand)' },
      textColor: { value: '' },
    },
  },
};
