// GENERATED from WidgetManager/shadcnSource.inputs.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadPasswordInputConfig = {
  name: 'ShadPasswordInput',
  displayName: 'Password input',
  description:
    "shadcn/ui password input with a show/hide eye button (showToggle) and an optional strength meter (showStrength: a three-part weak/fair/strong bar under the box, exposed as strength = '' | 'weak' | 'fair' | 'strong'). Validate with the text rules (mandatory, regex, min length). Height: 64px with a label (label above the control), 36px without; add 24px for help text or a validation message; the strength meter adds 16px",
  component: 'ShadPasswordInput',
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
        defaultValue: 'Password',
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
    showToggle: {
      type: 'toggle',
      displayName: 'Show/hide button',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    showStrength: {
      type: 'toggle',
      displayName: 'Strength meter',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
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
    onEnterPressed: {
      displayName: 'On enter pressed',
    },
    onFocus: {
      displayName: 'On focus',
    },
    onBlur: {
      displayName: 'On blur',
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
    iconColor: {
      type: 'colorSwatches',
      displayName: 'Eye icon color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    weakColor: {
      type: 'colorSwatches',
      displayName: 'Strength color: weak',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    fairColor: {
      type: 'colorSwatches',
      displayName: 'Strength color: fair',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    strongColor: {
      type: 'colorSwatches',
      displayName: 'Strength color: strong',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    meterTrackColor: {
      type: 'colorSwatches',
      displayName: 'Strength meter track color',
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
    value: '',
    strength: '',
  },
  actions: [
    {
      handle: 'setText',
      displayName: 'Set text',
      params: [
        {
          handle: 'value',
          displayName: 'Text',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'clear',
      displayName: 'Clear',
    },
    {
      handle: 'setFocus',
      displayName: 'Set focus',
    },
    {
      handle: 'setBlur',
      displayName: 'Set blur',
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
        value: 'Password',
      },
      description: {
        value: '',
      },
      placeholder: {
        value: '',
      },
      defaultValue: {
        value: '',
      },
      showToggle: {
        value: '{{true}}',
      },
      showStrength: {
        value: '{{false}}',
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
