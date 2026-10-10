// GENERATED from WidgetManager/shadcnSource.display.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadLinkConfig = {
  name: 'ShadLink',
  displayName: 'Link',
  description:
    "shadcn/ui text link (native Link names): linkText, linkTarget (URL; empty makes it act as a button), targetType ('new' or 'same' tab), underline ('underline', 'on-hover', 'no-underline'), showIcon (external-link icon), fontSize (px), fontWeight (normal, medium, semibold, bold); textColor and hoverColor styles (default: the primary). onClick fires as well as navigating; onHover. Height: 24px at 14px",
  component: 'ShadLink',
  defaultSize: {
    width: 6,
    height: 24,
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
    linkText: {
      type: 'code',
      displayName: 'Link text',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'View details',
      },
    },
    linkTarget: {
      type: 'code',
      displayName: 'Link target (URL)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    targetType: {
      type: 'switch',
      displayName: 'Open in',
      options: [
        {
          displayName: 'New tab',
          value: 'new',
        },
        {
          displayName: 'Same tab',
          value: 'same',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'new',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    underline: {
      type: 'switch',
      displayName: 'Underline',
      options: [
        {
          displayName: 'Always',
          value: 'underline',
        },
        {
          displayName: 'On hover',
          value: 'on-hover',
        },
        {
          displayName: 'Never',
          value: 'no-underline',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'on-hover',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    showIcon: {
      type: 'toggle',
      displayName: 'External-link icon',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    fontSize: {
      type: 'code',
      displayName: 'Font size (px)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 14,
      },
    },
    fontWeight: {
      type: 'switch',
      displayName: 'Weight',
      options: [
        {
          displayName: 'Normal',
          value: 'normal',
        },
        {
          displayName: 'Medium',
          value: 'medium',
        },
        {
          displayName: 'Semibold',
          value: 'semibold',
        },
        {
          displayName: 'Bold',
          value: 'bold',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'medium',
      },
      isFxNotRequired: true,
      fullWidth: true,
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
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Link color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    hoverColor: {
      type: 'colorSwatches',
      displayName: 'Link hover color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    alignment: {
      type: 'alignButtons',
      displayName: 'Alignment',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'left',
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
      linkText: {
        value: 'View details',
      },
      linkTarget: {
        value: 'https://tooljet.com',
      },
      targetType: {
        value: 'new',
      },
      underline: {
        value: 'on-hover',
      },
      showIcon: {
        value: '{{false}}',
      },
      fontSize: {
        value: '{{14}}',
      },
      fontWeight: {
        value: 'medium',
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
      alignment: {
        value: 'left',
      },
    },
  },
};
