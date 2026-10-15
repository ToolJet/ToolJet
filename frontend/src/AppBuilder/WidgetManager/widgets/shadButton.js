// GENERATED from WidgetManager/shadcnSource.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadButtonConfig = {
  name: 'ShadButton',
  displayName: 'Button',
  description: 'Button',
  component: 'ShadButton',
  defaultSize: {
    width: 6,
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
      displayName: 'Label',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Button',
      },
    },
    variant: {
      type: 'switch',
      displayName: 'Variant',
      options: [
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Secondary',
          value: 'secondary',
        },
        {
          displayName: 'Outline',
          value: 'outline',
        },
        {
          displayName: 'Ghost',
          value: 'ghost',
        },
        {
          displayName: 'Destructive',
          value: 'destructive',
        },
        {
          displayName: 'Link',
          value: 'link',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    size: {
      type: 'switch',
      displayName: 'Size',
      options: [
        {
          displayName: 'Sm',
          value: 'sm',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Lg',
          value: 'lg',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    fullWidth: {
      type: 'toggle',
      displayName: 'Full width',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
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
    onClick: {
      displayName: 'On click',
    },
    onHover: {
      displayName: 'On hover',
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
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Button background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    hoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Button hover background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Button text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Button border color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Button radius',
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
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    buttonText: 'Button',
  },
  actions: [
    {
      handle: 'click',
      displayName: 'Click',
    },
    {
      handle: 'setText',
      displayName: 'Set text',
      params: [
        {
          handle: 'text',
          displayName: 'Text',
          defaultValue: 'New text',
        },
      ],
    },
    {
      handle: 'disable',
      displayName: 'Disable',
      params: [
        {
          handle: 'disable',
          displayName: 'Value',
          defaultValue: '{{false}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'visibility',
      displayName: 'Visibility',
      params: [
        {
          handle: 'visible',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'loading',
      displayName: 'Loading',
      params: [
        {
          handle: 'loading',
          displayName: 'Value',
          defaultValue: '{{false}}',
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
      text: {
        value: 'Button',
      },
      variant: {
        value: 'default',
      },
      size: {
        value: 'default',
      },
      fullWidth: {
        value: '{{false}}',
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
    },
  },
};
