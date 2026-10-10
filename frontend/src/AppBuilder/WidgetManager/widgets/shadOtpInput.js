// GENERATED from WidgetManager/shadcnSource.inputs.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadOtpInputConfig = {
  name: 'ShadOtpInput',
  displayName: 'OTP input',
  description:
    "shadcn/ui one-time code input: length (4 to 8) character boxes, numeric or alphanumeric (upper-cased), typing moves to the next box, Backspace goes back, pasting a whole code fills it ('123-456' works). Optional separator in the middle and masked dots. Exposes value and isComplete; onComplete fires when the last box is filled (verify there). Boxes are 36px (slotSize style); height 64px with a label, 36px without",
  component: 'ShadOtpInput',
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
        defaultValue: 'Verification code',
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
    length: {
      type: 'code',
      displayName: 'Length (4 to 8)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 6,
      },
    },
    characters: {
      type: 'switch',
      displayName: 'Characters',
      options: [
        {
          displayName: 'Digits',
          value: 'numeric',
        },
        {
          displayName: 'Letters and digits',
          value: 'alphanumeric',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'numeric',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    separator: {
      type: 'toggle',
      displayName: 'Separator in the middle',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    slotStyle: {
      type: 'switch',
      displayName: 'Boxes',
      options: [
        {
          displayName: 'Joined',
          value: 'joined',
        },
        {
          displayName: 'Separate',
          value: 'separate',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'joined',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    masked: {
      type: 'toggle',
      displayName: 'Mask characters',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder (one character per box)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    defaultValue: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
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
    regex: {
      type: 'code',
      displayName: 'Regex',
      placeholder: '^[a-zA-Z0-9_ -]{3,16}$',
    },
    minLength: {
      type: 'code',
      displayName: 'Min length',
      placeholder: 'Enter min length',
    },
    maxLength: {
      type: 'code',
      displayName: 'Max length',
      placeholder: 'Enter max length',
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
    onComplete: {
      displayName: 'On complete',
    },
    onFocus: {
      displayName: 'On focus',
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
      displayName: 'Accent (focus ring, selection)',
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
    separatorColor: {
      type: 'colorSwatches',
      displayName: 'Separator color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    slotSize: {
      type: 'numberInput',
      displayName: 'Box size',
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
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    isValid: true,
    isMandatory: false,
    value: '',
    isComplete: false,
  },
  actions: [
    {
      handle: 'clear',
      displayName: 'Clear',
    },
    {
      handle: 'setFocus',
      displayName: 'Set focus',
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
        value: 'Verification code',
      },
      description: {
        value: '',
      },
      length: {
        value: '{{6}}',
      },
      characters: {
        value: 'numeric',
      },
      separator: {
        value: '{{false}}',
      },
      slotStyle: {
        value: 'joined',
      },
      masked: {
        value: '{{false}}',
      },
      placeholder: {
        value: '',
      },
      defaultValue: {
        value: '',
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
      regex: {
        value: '',
      },
      minLength: {
        value: '',
      },
      maxLength: {
        value: '',
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
