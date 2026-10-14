// GENERATED from WidgetManager/shadcnSource.conversation.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadQuestionnaireConfig = {
  name: 'ShadQuestionnaire',
  displayName: 'Questionnaire',
  description:
    "ToolJet UI 2.0 multi-step questionnaire, one question at a time: a 'Question 2 of 5' progress bar, the prompt and description, answer cards with a letter (or number) shortcut, and Previous, Skip (optional questions), Next and Submit. items: [{ name, prompt, description, required, type: 'single' | 'multiple' | 'text', choices: ['Label'] or [{ label, value, description }], other: true or { label, placeholder } (a free-text Other answer), placeholder (text), multiline: false (a one-line text answer: a name, an email) }]. A required question blocks Next with an error until answered. Exposes answers ({ [name]: value, multiple as an array, Other as its text }), currentIndex, currentItem and isComplete; onStepChange on every move, onSubmit with the answers (run the save query there). After submit it shows completeTitle and completeText. Actions reset() and goTo(index or name). defaultAnswers restores saved answers. Height: grows with the question (about 440px for four choices, 160px plus 58px per choice)",
  component: 'ShadQuestionnaire',
  defaultSize: {
    width: 20,
    height: 480,
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
    items: {
      type: 'code',
      displayName: 'Items',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      placeholder:
        "[{ name: 'role', prompt: 'Your role?', required: true, type: 'single', choices: ['Ops', 'Finance'] }]",
    },
    defaultAnswers: {
      type: 'code',
      displayName: 'Default answers',
      validation: {
        schema: {
          type: 'object',
          optional: true,
        },
        defaultValue: {},
      },
      placeholder: "{ role: 'Finance' }",
    },
    shortcuts: {
      type: 'switch',
      displayName: 'Answer shortcuts',
      options: [
        {
          displayName: 'Letters',
          value: 'letters',
        },
        {
          displayName: 'Numbers',
          value: 'numbers',
        },
        {
          displayName: 'None',
          value: 'none',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'letters',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    showProgress: {
      type: 'toggle',
      displayName: 'Show progress',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    submitLabel: {
      type: 'code',
      displayName: 'Submit button label',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Submit',
      },
    },
    completeTitle: {
      type: 'code',
      displayName: 'Completed title',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Thanks for your answers',
      },
    },
    completeText: {
      type: 'code',
      displayName: 'Completed text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    surface: {
      type: 'switch',
      displayName: 'Surface',
      options: [
        {
          displayName: 'Card',
          value: 'card',
        },
        {
          displayName: 'Plain',
          value: 'plain',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'card',
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
          optional: true,
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
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
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
          optional: true,
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onStepChange: {
      displayName: 'On step change',
    },
    onSubmit: {
      displayName: 'On submit',
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
          optional: true,
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent (progress, selected answer, buttons)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border and answer card border',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    titleColor: {
      type: 'colorSwatches',
      displayName: 'Question color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Description and answer description color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Radius',
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
          optional: true,
        },
      },
    },
    titleFontFamily: {
      type: 'select',
      displayName: 'Question typeface',
      options: [
        {
          name: 'Theme font',
          value: 'theme',
        },
        {
          name: 'Sans serif',
          value: 'sans',
        },
        {
          name: 'Serif',
          value: 'serif',
        },
        {
          name: 'Display serif',
          value: 'display',
        },
        {
          name: 'Monospace',
          value: 'mono',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'theme',
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    answers: {},
    currentIndex: 0,
    currentItem: {},
    isComplete: false,
  },
  actions: [
    {
      handle: 'reset',
      displayName: 'Reset',
    },
    {
      handle: 'goTo',
      displayName: 'Go to question',
      params: [
        {
          handle: 'index',
          displayName: 'Index or name',
          defaultValue: '{{0}}',
          type: 'code',
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
      items: {
        value:
          "{{[\n  { name: 'role', prompt: 'What best describes your role?', required: true, type: 'single', choices: [{ label: 'Operations', description: 'Run day-to-day work' }, { label: 'Finance' }, { label: 'Engineering' }], other: true },\n  { name: 'goals', prompt: 'What do you want to get done first?', description: 'Pick all that apply.', type: 'multiple', choices: ['Track orders', 'Approve requests', 'Report on spend'] },\n  { name: 'notes', prompt: 'Anything else we should know?', type: 'text', placeholder: 'Optional' }\n]}}",
      },
      defaultAnswers: {
        value: '{{{}}}',
      },
      shortcuts: {
        value: 'letters',
      },
      showProgress: {
        value: '{{true}}',
      },
      submitLabel: {
        value: 'Submit',
      },
      completeTitle: {
        value: 'Thanks for your answers',
      },
      completeText: {
        value: 'We will use them to set up your workspace.',
      },
      surface: {
        value: 'card',
      },
      dynamicHeight: {
        value: '{{true}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      visibility: {
        value: '{{true}}',
      },
      collapseWhenHidden: {
        value: '{{false}}',
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
      titleFontFamily: {
        value: 'theme',
      },
    },
  },
};
