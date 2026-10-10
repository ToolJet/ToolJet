// GENERATED from WidgetManager/shadcnSource.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadHeadingConfig = {
  name: 'ShadHeading',
  displayName: 'Heading',
  description:
    "shadcn/ui heading (h1 to h4). Typeface styles: fontFamily ('theme', 'sans', 'serif', 'display' or 'mono'), fontWeight (400 to 800), fontSize (px), letterSpacing (px or em) and textTransform ('uppercase' for an eyebrow)",
  component: 'ShadHeading',
  defaultSize: {
    width: 16,
    height: 36,
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
    text: {
      type: 'code',
      displayName: 'Text',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Heading',
      },
    },
    level: {
      type: 'switch',
      displayName: 'Level',
      options: [
        {
          displayName: 'H1',
          value: 'h1',
        },
        {
          displayName: 'H2',
          value: 'h2',
        },
        {
          displayName: 'H3',
          value: 'h3',
        },
        {
          displayName: 'H4',
          value: 'h4',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'h2',
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
  events: {},
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
    textColor: {
      type: 'colorSwatches',
      displayName: 'Heading color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    textAlign: {
      type: 'alignButtons',
      displayName: 'Text alignment (left, center, right)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'left',
      },
    },
    fontFamily: {
      type: 'select',
      displayName: 'Typeface',
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
        },
        defaultValue: 'theme',
      },
    },
    fontWeight: {
      type: 'select',
      displayName: 'Weight',
      options: [
        {
          name: 'Default',
          value: '',
        },
        {
          name: 'Regular',
          value: '400',
        },
        {
          name: 'Medium',
          value: '500',
        },
        {
          name: 'Semibold',
          value: '600',
        },
        {
          name: 'Bold',
          value: '700',
        },
        {
          name: 'Extra bold',
          value: '800',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    letterSpacing: {
      type: 'code',
      displayName: 'Letter spacing (px, or em like 0.12em)',
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
    textTransform: {
      type: 'select',
      displayName: 'Casing',
      options: [
        {
          name: 'As typed',
          value: 'none',
        },
        {
          name: 'UPPERCASE',
          value: 'uppercase',
        },
        {
          name: 'lowercase',
          value: 'lowercase',
        },
        {
          name: 'Capitalize',
          value: 'capitalize',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'none',
      },
    },
    fontSize: {
      type: 'numberInput',
      displayName: 'Font size (px; default from the level)',
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
  },
  actions: [
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
      text: {
        value: 'Heading',
      },
      level: {
        value: 'h2',
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
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
      textAlign: {
        value: 'left',
      },
      fontFamily: {
        value: 'theme',
      },
      fontWeight: {
        value: '',
      },
      textTransform: {
        value: 'none',
      },
    },
  },
};
