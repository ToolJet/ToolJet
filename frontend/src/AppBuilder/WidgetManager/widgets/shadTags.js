// GENERATED from WidgetManager/shadcnSource.display.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadTagsConfig = {
  name: 'ShadTags',
  displayName: 'Tags',
  description:
    "shadcn/ui read-only tag chips: tags is an array or a comma-separated string; tagColors maps a value to a colour ({ Paid: '#16a34a' }: tinted chip, light background and strong text of that hue); variant ('soft', 'outline', 'solid'), size ('sm', 'default', 'lg'), overflow ('wrap', or 'single' for one line with +N), pill. Clicking a tag sets lastClickedTag and fires onTagClick. Height: 24px per line",
  component: 'ShadTags',
  defaultSize: {
    width: 12,
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
    tags: {
      type: 'code',
      displayName: 'Tags (array or comma-separated)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'array',
            },
            {
              type: 'string',
            },
          ],
        },
        defaultValue: [],
      },
      placeholder: "['Design', 'Urgent']",
    },
    tagColors: {
      type: 'code',
      displayName: 'Colours by tag',
      validation: {
        schema: {
          type: 'object',
        },
        defaultValue: {},
      },
      placeholder: "{ Urgent: '#dc2626', Design: '#7c3aed' }",
    },
    variant: {
      type: 'switch',
      displayName: 'Variant',
      options: [
        {
          displayName: 'Soft',
          value: 'soft',
        },
        {
          displayName: 'Outline',
          value: 'outline',
        },
        {
          displayName: 'Solid',
          value: 'solid',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'soft',
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
        },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    overflow: {
      type: 'switch',
      displayName: 'Overflow',
      options: [
        {
          displayName: 'Wrap',
          value: 'wrap',
        },
        {
          displayName: 'One line, +N',
          value: 'single',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'wrap',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    pill: {
      type: 'toggle',
      displayName: 'Pill shape',
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
    onTagClick: {
      displayName: 'On tag click',
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
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Tag background (unmapped tags)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Tag text color (unmapped tags)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Tag border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Tag radius',
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
    lastClickedTag: '',
    tags: [],
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
      tags: {
        value: "{{['Design', 'Frontend', 'Urgent']}}",
      },
      tagColors: {
        value: "{{{ Urgent: '#dc2626' }}}",
      },
      variant: {
        value: 'soft',
      },
      size: {
        value: 'default',
      },
      overflow: {
        value: 'wrap',
      },
      pill: {
        value: '{{false}}',
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
