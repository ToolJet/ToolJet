// GENERATED from WidgetManager/shadcnSource.inputs.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadPhoneInputConfig = {
  name: 'ShadPhoneInput',
  displayName: 'Phone input',
  description:
    "shadcn/ui phone number input: a country picker (flag and calling code; searchable list) attached to the number box, which formats as you type. Exposes value (E.164, e.g. '+14155550123', '' when empty), country ('US'), countryCode ('+1'), formattedValue ('+1 415 555 0123') and isValidNumber; isValid is false for an invalid number. defaultCountry is an ISO code; onlyCountries limits the list (['US', 'CA']). Height: 64px with a label (label above the control), 36px without; add 24px for help text or a validation message",
  component: 'ShadPhoneInput',
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
        defaultValue: 'Phone number',
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
      displayName: 'Default value (E.164 or a national number)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    defaultCountry: {
      type: 'code',
      displayName: 'Default country (ISO code)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'US',
      },
    },
    onlyCountries: {
      type: 'code',
      displayName: 'Countries offered (ISO codes; empty: all)',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "['US', 'CA', 'GB']",
    },
    isCountryChangeEnabled: {
      type: 'toggle',
      displayName: 'Enable country change',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    showFlag: {
      type: 'toggle',
      displayName: 'Show country flag',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
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
    countryBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Country button background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    countryTextColor: {
      type: 'colorSwatches',
      displayName: 'Country button text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    popoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Popover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    popoverTextColor: {
      type: 'colorSwatches',
      displayName: 'Popover text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    hoverColor: {
      type: 'colorSwatches',
      displayName: 'Popover item hover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    selectedTextColor: {
      type: 'colorSwatches',
      displayName: 'Selected item text color (on the accent)',
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
    country: 'US',
    countryCode: '+1',
    formattedValue: '',
    isValidNumber: false,
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [
        {
          handle: 'value',
          displayName: 'Number (E.164 or national)',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'setCountry',
      displayName: 'Set country',
      params: [
        {
          handle: 'country',
          displayName: 'Country (ISO code or +calling code)',
          defaultValue: 'US',
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
        value: 'Phone number',
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
      defaultCountry: {
        value: 'US',
      },
      onlyCountries: {
        value: '{{[]}}',
      },
      isCountryChangeEnabled: {
        value: '{{true}}',
      },
      showFlag: {
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
