// GENERATED from WidgetManager/shadcnSource.pickers.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadTagsInputConfig = {
  name: 'ShadTagsInput',
  displayName: 'Tags input',
  description:
    'shadcn/ui tags input: free-form tags typed in the field (Enter or comma adds, Backspace removes the last, x removes one), with optional suggestions, maxTags, duplicate check and a per-tag pattern. Exposes tags (array of text) and value (the same). Height: 64px with a label, 36px without (one row; grows with dynamic height)',
  component: 'ShadTagsInput',
  defaultSize: {
    width: 10,
    height: 64,
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
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    description: {
      type: 'code',
      displayName: 'Help text',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Add a tag...',
      },
    },
    defaultValue: {
      type: 'code',
      displayName: 'Default tags',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
    },
    suggestions: {
      type: 'code',
      displayName: 'Suggestions',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "['urgent', 'billing'] or [{ label, value }]",
    },
    allowCustomTags: {
      type: 'toggle',
      displayName: 'Allow tags not in suggestions',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    maxTags: {
      type: 'code',
      displayName: 'Max tags (0 for no limit)',
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
        defaultValue: 0,
      },
    },
    caseSensitive: {
      type: 'toggle',
      displayName: 'Case-sensitive duplicate check',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    tagPattern: {
      type: 'code',
      displayName: 'Tag pattern (regex)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
      placeholder: '^[a-z0-9-]+$',
    },
    patternError: {
      type: 'code',
      displayName: 'Pattern error message',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    addOnBlur: {
      type: 'toggle',
      displayName: 'Add typed text on blur',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    showClearBtn: {
      type: 'toggle',
      displayName: 'Show clear button',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
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
  validation: {
    mandatory: {
      type: 'toggle',
      displayName: 'Make this field mandatory',
    },
    customRule: {
      type: 'code',
      displayName: 'Custom validation',
      placeholder: "{{components.text1.text === 'yes' || 'Enter yes'}}",
    },
  },
  events: {
    onChange: {
      displayName: 'On change',
    },
    onTagAdded: {
      displayName: 'On tag added',
    },
    onTagRemoved: {
      displayName: 'On tag removed',
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
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Label color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    helpTextColor: {
      type: 'colorSwatches',
      displayName: 'Help text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Field background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Field text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    placeholderColor: {
      type: 'colorSwatches',
      displayName: 'Placeholder color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Field border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent (focus ring, checks)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    errorColor: {
      type: 'colorSwatches',
      displayName: 'Error color (message and border)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Field radius',
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
      },
    },
    chipBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Chip background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    chipTextColor: {
      type: 'colorSwatches',
      displayName: 'Chip text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    menuBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Menu background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    menuTextColor: {
      type: 'colorSwatches',
      displayName: 'Menu text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    optionHoverColor: {
      type: 'colorSwatches',
      displayName: 'Highlighted option background',
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
    isValid: true,
    isMandatory: false,
    tags: [],
    value: [],
    lastAddedTag: '',
    lastRemovedTag: '',
  },
  actions: [
    {
      handle: 'setTags',
      displayName: 'Set tags',
      params: [
        {
          handle: 'tags',
          displayName: 'Tags',
          defaultValue: '{{[]}}',
        },
      ],
    },
    {
      handle: 'clear',
      displayName: 'Clear',
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
      label: {
        value: 'Tags',
      },
      description: {
        value: '',
      },
      placeholder: {
        value: 'Add a tag...',
      },
      defaultValue: {
        value: "{{['react', 'typescript']}}",
      },
      suggestions: {
        value: "{{['react', 'typescript', 'node', 'python', 'design', 'devops']}}",
      },
      allowCustomTags: {
        value: '{{true}}',
      },
      maxTags: {
        value: '{{0}}',
      },
      caseSensitive: {
        value: '{{false}}',
      },
      tagPattern: {
        value: '',
      },
      patternError: {
        value: '',
      },
      addOnBlur: {
        value: '{{false}}',
      },
      showClearBtn: {
        value: '{{false}}',
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
    validation: {
      mandatory: {
        value: '{{false}}',
      },
      customRule: {
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
