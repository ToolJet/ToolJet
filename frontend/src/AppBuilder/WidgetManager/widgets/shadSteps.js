// GENERATED from WidgetManager/shadcnSource.display.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadStepsConfig = {
  name: 'ShadSteps',
  displayName: 'Steps',
  description:
    "shadcn/ui stepper (native Steps names): steps [{ id, name, description?, visible?, disabled?, tooltip? }]; currentStep is the current step's id; numbered circles (variant 'dots' for small dots), check marks on completed steps, connecting lines; orientation 'horizontal' or 'vertical'. stepsSelectable lets users click a step (onSelect; exposed currentStepId, currentStepIndex). Actions setStep(id), nextStep, previousStep, resetSteps, setStepVisible(id, visible), setStepDisable(id, disabled). Height: 60px horizontal (78px with descriptions); vertical about 66px per step",
  component: 'ShadSteps',
  defaultSize: {
    width: 24,
    height: 80,
  },
  others: {
    showOnDesktop: {
      type: 'toggle',
      displayName: 'Show on desktop',
    },
    showOnMobile: {
      type: 'toggle',
      displayName: 'Show on mobile',
    },
  },
  properties: {
    steps: {
      type: 'code',
      displayName: 'Steps',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ id: 1, name: 'Details' }, { id: 2, name: 'Review' }]",
    },
    currentStep: {
      type: 'code',
      displayName: 'Current step (id)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
        defaultValue: 1,
      },
    },
    stepsSelectable: {
      type: 'toggle',
      displayName: 'Steps selectable',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    orientation: {
      type: 'switch',
      displayName: 'Orientation',
      options: [
        {
          displayName: 'Horizontal',
          value: 'horizontal',
        },
        {
          displayName: 'Vertical',
          value: 'vertical',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'horizontal',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    variant: {
      type: 'switch',
      displayName: 'Marker',
      options: [
        {
          displayName: 'Numbers',
          value: 'numbers',
        },
        {
          displayName: 'Dots',
          value: 'dots',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'numbers',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    loadingIndicator: {
      type: 'switch',
      displayName: 'Loading look',
      options: [
        {
          displayName: 'Spinner',
          value: 'spinner',
        },
        {
          displayName: 'Skeleton',
          value: 'skeleton',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'spinner',
      },
      isFxNotRequired: true,
      fullWidth: true,
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        {
          displayName: 'Plain text',
          value: 'plainText',
        },
        {
          displayName: 'Markdown',
          value: 'markdown',
        },
        {
          displayName: 'HTML',
          value: 'html',
        },
      ],
      isFxNotRequired: true,
      defaultValue: {
        value: 'plainText',
      },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: {
          type: 'string',
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onSelect: {
      displayName: 'On select',
    },
  },
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    completedAccent: {
      type: 'colorSwatches',
      displayName: 'Completed and current accent',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    incompletedAccent: {
      type: 'colorSwatches',
      displayName: 'Upcoming step accent (circle border, line)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    completedLabel: {
      type: 'colorSwatches',
      displayName: 'Completed step label',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    currentStepLabel: {
      type: 'colorSwatches',
      displayName: 'Current step label',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    incompletedLabel: {
      type: 'colorSwatches',
      displayName: 'Upcoming step label',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    descriptionColor: {
      type: 'colorSwatches',
      displayName: 'Description color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    currentStepId: 1,
    currentStepIndex: 0,
    steps: [],
  },
  actions: [
    {
      handle: 'setStep',
      displayName: 'Set step',
      params: [
        {
          handle: 'option',
          displayName: 'Step id',
          defaultValue: '{{1}}',
        },
      ],
    },
    {
      handle: 'nextStep',
      displayName: 'Next step',
      params: [],
    },
    {
      handle: 'previousStep',
      displayName: 'Previous step',
      params: [],
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
          displayName: 'Visible',
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
          displayName: 'Disabled',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
  ],
  definition: {
    others: {
      showOnDesktop: {
        value: '{{true}}',
      },
      showOnMobile: {
        value: '{{false}}',
      },
    },
    properties: {
      steps: {
        value:
          "{{[{ id: 1, name: 'Account', description: 'Your details' }, { id: 2, name: 'Company', description: 'Team and size' }, { id: 3, name: 'Billing', description: 'Plan and payment' }, { id: 4, name: 'Done', description: 'Review and finish' }]}}",
      },
      currentStep: {
        value: '{{2}}',
      },
      stepsSelectable: {
        value: '{{true}}',
      },
      orientation: {
        value: 'horizontal',
      },
      variant: {
        value: 'numbers',
      },
      dynamicHeight: {
        value: '{{true}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      loadingIndicator: {
        value: 'spinner',
      },
      visibility: {
        value: '{{true}}',
      },
      disabledState: {
        value: '{{false}}',
      },
      tooltipFormat: {
        value: 'plainText',
      },
      tooltip: {
        value: '',
      },
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
    },
  },
};
