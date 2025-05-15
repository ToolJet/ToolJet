export const stepsConfig = {
  name: 'Steps',
  displayName: 'Steps',
  description: 'Step-by-step navigation aid',
  component: 'Steps',
  properties: {
    variant: {
      type: 'switch',
      displayName: 'Variant',
      validation: { schema: { type: 'string' }, defaultValue: 'titles' },
      options: [
        { displayName: 'Label', value: 'titles' },
        { displayName: 'Number', value: 'numbers' },
        { displayName: 'Plain', value: 'plain' },
      ],
      accordian: 'label',
    },
    schema: {
      type: 'code',
      displayName: 'Schema',
      conditionallyRender: {
        key: 'advanced',
        value: true,
      },
      accordian: 'Options',
    },
    steps: {
      type: 'code',
      displayName: '',
      showLabel: false,
      validation: {
        schema: {
          type: 'array',
          element: { type: 'object' },
        },
        defaultValue: `[{ name: 'step 1'}, {name: 'step 2'}]`,
      },
    },
    stepsSelectable: {
      type: 'toggle',
      displayName: 'Steps selectable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' } },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    advanced: {
      type: 'toggle',
      displayName: 'Dynamic options',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      accordian: 'Options',
    },
    currentStep: {
      type: 'code',
      displayName: 'Current step',
      validation: {
        schema: { type: 'number' },
        defaultValue: 1,
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
  actions: [
    {
      handle: 'setStep',
      displayName: 'Set step',
      params: [
        {
          handle: 'option',
          displayName: 'Option',
        },
      ],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'visible', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setDisabled',
      displayName: 'Set disabled',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'resetSteps',
      displayName: 'Reset steps',
      params: [],
    },
    {
      handle: 'setStepVisible',
      displayName: 'Set step visible',
      params: [
        {
          handle: 'id',
          displayName: 'Step id',
        },
        {
          handle: 'visibility',
          displayName: 'visibility',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setStepDisable',
      displayName: 'Set step disable',
      params: [
        {
          handle: 'id',
          displayName: 'Step id',
        },
        {
          handle: 'disabled',
          displayName: 'disabled',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
  ],
  events: {
    onSelect: { displayName: 'On select' },
  },
  styles: {
    incompletedAccent: {
      type: 'colorSwatches',
      displayName: 'Incompleted accent',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#CCD1D5',
      },
      accordian: 'steps',
    },
    incompletedLabel: {
      type: 'colorSwatches',
      displayName: 'Incompleted label',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#1B1F24',
      },
      accordian: 'steps',
    },
    completedAccent: {
      type: 'colorSwatches',
      displayName: 'Completed accent',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-brand)',
      },
      accordian: 'steps',
    },
    completedLabel: {
      type: 'colorSwatches',
      displayName: 'Completed label',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#1B1F24',
      },
      accordian: 'steps',
    },
    currentStepLabel: {
      type: 'colorSwatches',
      displayName: 'Current step label',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#1B1F24',
      },
      accordian: 'steps',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 'default',
      },
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'container',
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
        value: [
          { name: 'step 1', tooltip: '', id: 1, visible: { value: true }, disabled: { value: false } },
          { name: 'step 2', tooltip: '', id: 2, visible: { value: true }, disabled: { value: false } },
          { name: 'step 3', tooltip: '', id: 3, visible: { value: true }, disabled: { value: false } },
          { name: 'step 4', tooltip: '', id: 4, visible: { value: true }, disabled: { value: false } },
          { name: 'step 5', tooltip: '', id: 5, visible: { value: true }, disabled: { value: false } },
        ],
      },
      schema: {
        value: `{{ [{ name: 'step 1', tooltip: '', id: 1,visible: true, disabled: false},{ name: 'step 2', tooltip: '', id: 2,visible: true, disabled: false},{ name: 'step 3', tooltip: '', id: 3,visible: true, disabled: false},{ name: 'step 4', tooltip: '', id: 4,visible: true, disabled: false},{ name: 'step 5', tooltip: '', id: 5,visible: true, disabled: false}]}}`,
      },
      disabledState: { value: '{{false}}' },
      variant: { value: 'titles' },
      currentStep: { value: '{{3}}' },
      stepsSelectable: { value: true },
      advanced: { value: `{{false}}` },
      visibility: { value: '{{true}}' },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      // color: { value: '' },
      // textColor: { value: '' },
      padding: { value: 'default' },
      incompletedAccent: { value: 'var(--cc-surface3-surface)' },
      incompletedLabel: { value: 'var(--cc-primary-text)' },
      completedAccent: { value: 'var(--cc-primary-brand)' },
      completedLabel: { value: 'var(--cc-primary-text)' },
      currentStepLabel: { value: 'var(--cc-primary-text)' },
    },
  },
};
